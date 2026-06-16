import React, { useEffect, useState, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import styles from './index.module.scss'
import StatCard from '@/components/StatCard'
import SectionHeader from '@/components/SectionHeader'
import TransactionItem from '@/components/TransactionItem'
import BudgetProgress from '@/components/BudgetProgress'
import EmptyState from '@/components/EmptyState'
import { useAccountStore } from '@/store/accountStore'
import { useTransactionStore } from '@/store/transactionStore'
import { useBudgetStore } from '@/store/budgetStore'
import { useGoalStore } from '@/store/goalStore'
import { formatMoney, getMonthKey, getRelativeDate } from '@/utils/format'
import dayjs from 'dayjs'

const HomePage: React.FC = () => {
  const accounts = useAccountStore((s) => s.accounts)
  const getTotalAssets = useAccountStore((s) => s.getTotalAssets)
  const getTotalLiabilities = useAccountStore((s) => s.getTotalLiabilities)
  const getNetWorth = useAccountStore((s) => s.getNetWorth)
  const loaded = useAccountStore((s) => s.loaded)
  const transactions = useTransactionStore((s) => s.transactions)
  const getMonthSummary = useTransactionStore((s) => s.getMonthSummary)
  const getCurrentBudget = useBudgetStore((s) => s.getCurrentBudget)
  const getTotalProgress = useBudgetStore((s) => s.getTotalProgress)
  const getCategoryProgress = useBudgetStore((s) => s.getCategoryProgress)
  const getActiveGoals = useGoalStore((s) => s.getActiveGoals)
  const getEncourageMessage = useGoalStore((s) => s.getEncourageMessage)

  const [encourageMsg, setEncourageMsg] = useState<string | null>(null)

  useDidShow(() => {
    const msg = getEncourageMessage()
    if (msg) setEncourageMsg(msg.message)
  })

  const currentMonth = getMonthKey()
  const summary = useMemo(() => getMonthSummary(currentMonth), [getMonthSummary, currentMonth, transactions])
  const budget = useCurrentBudget()
  const totalProgress = budget ? getTotalProgress(currentMonth) : null

  const recentTransactions = transactions.slice(0, 5)

  const handleAddExpense = () => {
    Taro.navigateTo({ url: '/pages/add-transaction/index?type=expense' })
  }

  const handleAddIncome = () => {
    Taro.navigateTo({ url: '/pages/add-transaction/index?type=income' })
  }

  const handleGoals = () => {
    Taro.switchTab({ url: '/pages/asset/index' })
  }

  const handleBudgetDetail = () => {
    Taro.navigateTo({ url: '/pages/budget-detail/index' })
  }

  const greeting = useMemo(() => {
    const hour = dayjs().hour()
    if (hour < 6) return '凌晨好'
    if (hour < 12) return '早上好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    return '晚上好'
  }, [])

  if (!loaded) {
    return (
      <View className="pageContainer">
        <View className={styles.header}>
          <Text className={styles.greeting}>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView scrollY className="pageContainer" enhanced showScrollbar={false}>
      <View className={styles.header}>
        <Text className={styles.greeting}>{greeting}，欢迎回来 👋</Text>
        <Text className={styles.title}>我的账本</Text>

        <View className={styles.assetCard}>
          <Text className={styles.assetLabel}>净资产（元）</Text>
          <Text className={styles.assetValue}>{formatMoney(getNetWorth())}</Text>
          <View className={styles.assetSub}>
            <View className={styles.assetSubItem}>
              <Text className={styles.assetSubLabel}>总资产</Text>
              <Text className={styles.assetSubValue}>{formatMoney(getTotalAssets())}</Text>
            </View>
            <View className={styles.assetSubItem}>
              <Text className={styles.assetSubLabel}>总负债</Text>
              <Text className={styles.assetSubValue}>{formatMoney(getTotalLiabilities())}</Text>
            </View>
            <View className={styles.assetSubItem}>
              <Text className={styles.assetSubLabel}>账户数</Text>
              <Text className={styles.assetSubValue}>{accounts.length}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.mainContent}>
        {encourageMsg && (
          <View className={styles.encourageCard}>
            <Text className={styles.encourageIcon}>💪</Text>
            <Text className={styles.encourageText}>{encourageMsg}</Text>
          </View>
        )}

        <View className={styles.quickActions}>
          <View className={styles.quickAction} onClick={handleAddExpense}>
            <View className={styles.quickIcon} style={{ background: 'rgba(239,68,68,0.1)' }}>💸</View>
            <Text className={styles.quickLabel}>记支出</Text>
          </View>
          <View className={styles.quickAction} onClick={handleAddIncome}>
            <View className={styles.quickIcon} style={{ background: 'rgba(16,185,129,0.1)' }}>💰</View>
            <Text className={styles.quickLabel}>记收入</Text>
          </View>
          <View className={styles.quickAction} onClick={() => Taro.switchTab({ url: '/pages/asset/index' })}>
            <View className={styles.quickIcon} style={{ background: 'rgba(99,102,241,0.1)' }}>🏦</View>
            <Text className={styles.quickLabel}>账户</Text>
          </View>
          <View className={styles.quickAction} onClick={handleGoals}>
            <View className={styles.quickIcon} style={{ background: 'rgba(245,158,11,0.1)' }}>🎯</View>
            <Text className={styles.quickLabel}>存钱目标</Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <StatCard
            title="本月收入"
            value={formatMoney(summary.totalIncome)}
            icon="📈"
            color="income"
          />
          <StatCard
            title="本月支出"
            value={formatMoney(summary.totalExpense)}
            icon="📉"
            color="expense"
          />
        </View>

        {budget && totalProgress && (
          <View className={styles.budgetCard}>
            <View className={styles.budgetHeader}>
              <Text className={styles.budgetTitle}>📊 本月预算</Text>
              <Text className={styles.sectionMore} onClick={handleBudgetDetail}>查看详情 ›</Text>
            </View>
            <BudgetProgress
              label="总预算"
              spent={totalProgress.spent}
              limit={totalProgress.limit}
            />
            <View style={{ marginTop: 16 }}>
              {budget.categoryBudgets.slice(0, 3).map((cb) => {
                const prog = getCategoryProgress(currentMonth, cb.categoryId)
                return (
                  <View key={cb.categoryId} style={{ marginBottom: 12 }}>
                    <BudgetProgress
                      label={cb.categoryName}
                      spent={prog.spent}
                      limit={prog.limit}
                      size="sm"
                    />
                  </View>
                )
              })}
            </View>
          </View>
        )}

        <SectionHeader
          title="最近交易"
          actionText="查看全部"
          onAction={() => Taro.switchTab({ url: '/pages/record/index' })}
        />

        {recentTransactions.length === 0 ? (
          <EmptyState
            icon="📝"
            title="暂无交易记录"
            description="点击上方按钮记录你的第一笔交易"
            actionText="记一笔"
            onAction={handleAddExpense}
          />
        ) : (
          <View className={styles.transactionList}>
            {recentTransactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} showDate />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

export default HomePage
