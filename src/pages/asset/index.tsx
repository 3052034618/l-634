import React, { useMemo } from 'react'
import { View, Text, ScrollView, useDidShow, navigateTo } from '@tarojs/taro'
import { useAccountStore } from '@/store/accountStore'
import { useGoalStore } from '@/store/goalStore'
import AccountCard from '@/components/AccountCard'
import GoalCard from '@/components/GoalCard'
import EmptyState from '@/components/EmptyState'
import LineChart, { LineDataPoint } from '@/components/LineChart'
import { formatMoney } from '@/utils/format'
import dayjs from 'dayjs'
import styles from './index.module.scss'

const AssetPage: React.FC = () => {
  const loadAccounts = useAccountStore((s) => s.loadAccounts)
  const accounts = useAccountStore((s) => s.accounts)
  const getTotalAssets = useAccountStore((s) => s.getTotalAssets)
  const getTotalLiabilities = useAccountStore((s) => s.getTotalLiabilities)
  const getNetWorth = useAccountStore((s) => s.getNetWorth)

  const loadGoals = useGoalStore((s) => s.loadGoals)
  const goals = useGoalStore((s) => s.goals)
  const getTotalSaved = useGoalStore((s) => s.getTotalSaved)

  useDidShow(() => {
    loadAccounts()
    loadGoals()
  })

  const totalAssets = useMemo(() => getTotalAssets(), [accounts, getTotalAssets])
  const totalLiabilities = useMemo(() => getTotalLiabilities(), [accounts, getTotalLiabilities])
  const netWorth = useMemo(() => getNetWorth(), [accounts, getNetWorth])
  const totalSaved = useMemo(() => getTotalSaved(), [goals, getTotalSaved])

  const activeGoals = useMemo(() => goals.filter((g) => !g.completed), [goals])

  const trendData = useMemo((): LineDataPoint[] => {
    const points: LineDataPoint[] = []
    for (let i = 5; i >= 0; i--) {
      points.push({
        label: dayjs().subtract(i, 'month').format('M月'),
        value: Math.round(netWorth * (0.7 + (5 - i) * 0.06))
      })
    }
    return points
  }, [netWorth])

  const handleAddAccount = () => {
    navigateTo({ url: '/pages/add-account/index' })
  }

  const handleAddGoal = () => {
    navigateTo({ url: '/pages/goal-list/index' })
  }

  const handleAccountClick = (id: string) => {
    navigateTo({ url: `/pages/account-detail/index?id=${id}` })
  }

  const handleGoalClick = (id: string) => {
    navigateTo({ url: `/pages/goal-detail/index?id=${id}` })
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>我的资产</Text>
        <View className={styles.netWorthCard}>
          <Text className={styles.netWorthLabel}>净资产 (元)</Text>
          <Text className={styles.netWorthValue}>¥{formatMoney(netWorth)}</Text>
        </View>
        <View className={styles.assetStats}>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>总资产</Text>
            <Text className={styles.statValue}>¥{formatMoney(totalAssets)}</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>总负债</Text>
            <Text className={styles.statValue}>¥{formatMoney(totalLiabilities)}</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>存钱目标</Text>
            <Text className={styles.statValue}>¥{formatMoney(totalSaved)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.chartCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>📈</Text>
              净资产趋势
            </Text>
            <Text className={styles.sectionExtra}>近6个月</Text>
          </View>
          <LineChart data={trendData} color="#10b981" height={200} />
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>💳</Text>
              我的账户
            </Text>
            <View className={styles.sectionExtra} onClick={handleAddAccount}>
              <Text>管理</Text>
              <Text>›</Text>
            </View>
          </View>
          {accounts.length > 0 ? (
            <View className={styles.accountList}>
              {accounts.map((acc) => (
                <AccountCard
                  key={acc.id}
                  account={acc}
                  onClick={() => handleAccountClick(acc.id)}
                />
              ))}
              <View className={styles.addCard} onClick={handleAddAccount}>
                <Text className={styles.addIcon}>+</Text>
                <Text className={styles.addText}>添加新账户</Text>
              </View>
            </View>
          ) : (
            <EmptyState text="暂无账户，快去添加一个吧" />
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>🎯</Text>
              存钱目标
            </Text>
            <View className={styles.sectionExtra} onClick={handleAddGoal}>
              <Text>查看全部</Text>
              <Text>›</Text>
            </View>
          </View>
          {activeGoals.length > 0 ? (
            <View className={styles.goalList}>
              {activeGoals.slice(0, 3).map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onClick={() => handleGoalClick(goal.id)}
                />
              ))}
              <View className={styles.addCard} onClick={handleAddGoal}>
                <Text className={styles.addIcon}>+</Text>
                <Text className={styles.addText}>创建新目标</Text>
              </View>
            </View>
          ) : (
            <EmptyState text="暂无存钱目标，设置一个吧" />
          )}
        </View>
      </View>
    </ScrollView>
  )
}

export default AssetPage
