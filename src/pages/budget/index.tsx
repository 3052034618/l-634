import React, { useState, useMemo } from 'react'
import { View, Text, useDidShow, navigateTo, showToast } from '@tarojs/taro'
import dayjs from 'dayjs'
import { useBudgetStore } from '@/store/budgetStore'
import { useTransactionStore } from '@/store/transactionStore'
import { useAppStore } from '@/store/appStore'
import BudgetProgress from '@/components/BudgetProgress'
import EmptyState from '@/components/EmptyState'
import { formatMoney } from '@/utils/format'
import styles from './index.module.scss'

const BudgetPage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'))
  const loadBudgets = useBudgetStore((s) => s.loadBudgets)
  const getBudgetByMonth = useBudgetStore((s) => s.getBudgetByMonth)
  const getCategoryProgress = useBudgetStore((s) => s.getCategoryProgress)
  const getTotalProgress = useBudgetStore((s) => s.getTotalProgress)
  const alerts = useBudgetStore((s) => s.alerts)
  const checkBudgetAlerts = useBudgetStore((s) => s.checkBudgetAlerts)
  const markAlertRead = useBudgetStore((s) => s.markAlertRead)

  const loadTransactions = useTransactionStore((s) => s.loadTransactions)
  const categories = useAppStore((s) => s.categories)

  useDidShow(() => {
    loadBudgets()
    loadTransactions()
    setTimeout(() => checkBudgetAlerts(), 300)
  })

  const budget = useMemo(() => getBudgetByMonth(currentMonth), [currentMonth, getBudgetByMonth])
  const totalProgress = useMemo(() => getTotalProgress(currentMonth), [currentMonth, getTotalProgress])

  const unreadAlerts = useMemo(
    () => alerts.filter((a) => !a.read).slice(0, 5),
    [alerts]
  )

  const handlePrevMonth = () => {
    setCurrentMonth(dayjs(currentMonth + '-01').subtract(1, 'month').format('YYYY-MM'))
  }

  const handleNextMonth = () => {
    const next = dayjs(currentMonth + '-01').add(1, 'month')
    if (next.isAfter(dayjs(), 'month')) return
    setCurrentMonth(next.format('YYYY-MM'))
  }

  const handleAlertClick = (id: string) => {
    markAlertRead(id)
  }

  const handleSetBudget = () => {
    navigateTo({ url: `/pages/budget-detail/index?month=${currentMonth}` })
  }

  const getProgressClass = (status: string) => {
    if (status === 'over') return styles.progressOver
    if (status === 'warning') return styles.progressWarning
    return styles.progressNormal
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.monthNav}>
          <View className={styles.navBtn} onClick={handlePrevMonth}>‹</View>
          <Text className={styles.monthLabel}>
            {dayjs(currentMonth + '-01').format('YYYY年M月')}
          </Text>
          <View className={styles.navBtn} onClick={handleNextMonth}>›</View>
        </View>
        <View className={styles.totalBudget}>
          <Text className={styles.totalLabel}>月度总预算</Text>
          <Text className={styles.totalValue}>¥{formatMoney(totalProgress.limit)}</Text>
          <View className={styles.totalProgress}>
            <Text className={styles.spentText}>已用 ¥{formatMoney(totalProgress.spent)}</Text>
            <Text className={styles.remainText}>
              剩余 ¥{formatMoney(Math.max(totalProgress.limit - totalProgress.spent, 0))}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        {unreadAlerts.length > 0 && (
          <View className={styles.alertList}>
            {unreadAlerts.map((alert) => (
              <View
                key={alert.id}
                className={`${styles.alertItem} ${alert.type === 'overdue' ? styles.alertOverdue : styles.alertWarning}`}
                onClick={() => handleAlertClick(alert.id)}
              >
                <Text className={styles.alertIcon}>
                  {alert.type === 'overdue' ? '🚨' : '⚠️'}
                </Text>
                <Text className={styles.alertText}>{alert.message}</Text>
              </View>
            ))}
          </View>
        )}

        {budget ? (
          <View className={styles.budgetCard}>
            <View className={styles.cardHeader}>
              <Text className={styles.cardTitle}>分类预算</Text>
              <Text className={styles.editBtn} onClick={handleSetBudget}>编辑</Text>
            </View>
            {budget.categoryBudgets.length > 0 ? (
              budget.categoryBudgets.map((cb) => {
                const progress = getCategoryProgress(currentMonth, cb.categoryId)
                const cat = categories.find((c) => c.id === cb.categoryId)
                return (
                  <View key={cb.categoryId} className={styles.categoryItem}>
                    <View className={styles.categoryTop}>
                      <View className={styles.categoryLeft}>
                        <View className={styles.catIcon}>
                          <Text>{cat?.icon || '📊'}</Text>
                        </View>
                        <Text className={styles.catName}>{cb.categoryName}</Text>
                      </View>
                      <Text className={styles.catAmount}>
                        ¥{formatMoney(progress.spent)} / ¥{formatMoney(cb.limit)}
                      </Text>
                    </View>
                    <View className={styles.progressWrap}>
                      <View
                        className={`${styles.progressFill} ${getProgressClass(progress.status)}`}
                        style={{ width: `${Math.min(progress.percent * 100, 100)}%` }}
                      />
                    </View>
                    <View className={styles.catMeta}>
                      <Text>{(progress.percent * 100).toFixed(0)}%</Text>
                      <Text>
                        {progress.status === 'over'
                          ? `超支 ¥${formatMoney(progress.spent - cb.limit)}`
                          : progress.status === 'warning'
                            ? '接近预算'
                            : `剩余 ¥${formatMoney(Math.max(cb.limit - progress.spent, 0))}`}
                      </Text>
                    </View>
                  </View>
                )
              })
            ) : (
              <EmptyState text="暂无分类预算，快去设置吧" />
            )}
          </View>
        ) : (
          <View className={styles.budgetCard}>
            <EmptyState text="本月尚未设置预算" />
          </View>
        )}
      </View>

      <View className={styles.setBudgetBtn}>
        <View className={styles.btn} onClick={handleSetBudget}>
          <Text>{budget ? '编辑预算' : '设置预算'}</Text>
        </View>
      </View>
    </View>
  )
}

export default BudgetPage
