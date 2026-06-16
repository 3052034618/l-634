import React, { useMemo } from 'react'
import { View, Text, ScrollView, useDidShow, navigateTo, showToast, showModal } from '@tarojs/taro'
import { useTransactionStore } from '@/store/transactionStore'
import { useAccountStore } from '@/store/accountStore'
import { useGoalStore } from '@/store/goalStore'
import { useBudgetStore } from '@/store/budgetStore'
import { useCreditStore } from '@/store/creditStore'
import { getStorage, removeStorage } from '@/utils/storage'
import dayjs from 'dayjs'
import styles from './index.module.scss'

const ProfilePage: React.FC = () => {
  const loadTransactions = useTransactionStore((s) => s.loadTransactions)
  const transactions = useTransactionStore((s) => s.transactions)
  const loadAccounts = useAccountStore((s) => s.loadAccounts)
  const accounts = useAccountStore((s) => s.accounts)
  const loadGoals = useGoalStore((s) => s.loadGoals)
  const goals = useGoalStore((s) => s.goals)
  const loadBudgets = useBudgetStore((s) => s.loadBudgets)
  const alerts = useBudgetStore((s) => s.alerts)
  const getUnreadAlertCount = useBudgetStore((s) => s.getUnreadAlertCount)
  const loadCredit = useCreditStore((s) => s.loadCredit)

  useDidShow(() => {
    loadTransactions()
    loadAccounts()
    loadGoals()
    loadBudgets()
    loadCredit()
  })

  const unreadAlerts = useMemo(() => getUnreadAlertCount(), [alerts, getUnreadAlertCount])

  const completedGoals = useMemo(() => goals.filter((g) => g.completed).length, [goals])

  const thisMonthTx = useMemo(() => {
    const now = dayjs().format('YYYY-MM')
    return transactions.filter((t) => t.date.startsWith(now)).length
  }, [transactions])

  const handleNavigate = (url: string) => {
    navigateTo({ url })
  }

  const handleClearData = () => {
    showModal({
      title: '确认清除',
      content: '确定要清除所有本地数据吗？此操作不可恢复！',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          const keys = [
            'finance_app_transactions',
            'finance_app_accounts',
            'finance_app_budgets',
            'finance_app_budget_alerts',
            'finance_app_saving_goals',
            'finance_app_goal_messages',
            'finance_app_credit_bills',
            'finance_app_credit_reminders',
            'finance_app_learned_keywords'
          ]
          keys.forEach((k) => removeStorage(k))
          showToast({ title: '数据已清除，请重启应用', icon: 'none' })
          setTimeout(() => {
            loadTransactions()
            loadAccounts()
            loadGoals()
            loadBudgets()
          }, 500)
        }
      }
    })
  }

  const handleAbout = () => {
    showModal({
      title: '关于',
      content: '个人记账与财务管理APP v1.0.0\n\n一款简洁、专业的个人理财工具，助您轻松管理财务。',
      showCancel: false
    })
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.userCard}>
          <View className={styles.avatar}>
            <Text>👤</Text>
          </View>
          <View className={styles.userInfo}>
            <Text className={styles.userName}>理财达人</Text>
            <Text className={styles.userDesc}>坚持记账，实现财富自由</Text>
          </View>
        </View>
        <View className={styles.statsRow}>
          <View className={styles.statCol}>
            <Text className={styles.statNum}>{accounts.length}</Text>
            <Text className={styles.statLabel}>账户</Text>
          </View>
          <View className={styles.statCol}>
            <Text className={styles.statNum}>{thisMonthTx}</Text>
            <Text className={styles.statLabel}>本月记账</Text>
          </View>
          <View className={styles.statCol}>
            <Text className={styles.statNum}>{completedGoals}</Text>
            <Text className={styles.statLabel}>已完成目标</Text>
          </View>
          <View className={styles.statCol}>
            <Text className={styles.statNum}>{transactions.length}</Text>
            <Text className={styles.statLabel}>累计交易</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.menuGroup}>
          <Text className={styles.menuGroupTitle}>财务工具</Text>
          <View className={styles.menuItem} onClick={() => handleNavigate('/pages/budget/index')}>
            <View className={styles.menuIcon}>
              <Text>📊</Text>
            </View>
            <Text className={styles.menuText}>预算管理</Text>
            {unreadAlerts > 0 && <Text className={styles.menuBadge}>{unreadAlerts}</Text>}
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => handleNavigate('/pages/credit/index')}>
            <View className={styles.menuIcon}>
              <Text>💳</Text>
            </View>
            <Text className={styles.menuText}>信用卡管理</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => handleNavigate('/pages/goal-list/index')}>
            <View className={styles.menuIcon}>
              <Text>🎯</Text>
            </View>
            <Text className={styles.menuText}>存钱目标</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => handleNavigate('/pages/export/index')}>
            <View className={styles.menuIcon}>
              <Text>📤</Text>
            </View>
            <Text className={styles.menuText}>数据导出</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>

        <View className={styles.menuGroup}>
          <Text className={styles.menuGroupTitle}>设置</Text>
          <View className={styles.menuItem} onClick={() => handleNavigate('/pages/account-list/index')}>
            <View className={styles.menuIcon}>
              <Text>🏦</Text>
            </View>
            <Text className={styles.menuText}>账户管理</Text>
            <Text className={styles.menuValue}>{accounts.length}个</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => handleNavigate('/pages/category-manage/index')}>
            <View className={styles.menuIcon}>
              <Text>🏷️</Text>
            </View>
            <Text className={styles.menuText}>分类管理</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={handleClearData}>
            <View className={styles.menuIcon} style={{ background: '#fef2f2' }}>
              <Text>🗑️</Text>
            </View>
            <Text className={styles.menuText} style={{ color: '#ef4444' }}>清除本地数据</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>

        <View className={styles.menuGroup}>
          <Text className={styles.menuGroupTitle}>其他</Text>
          <View className={styles.menuItem} onClick={handleAbout}>
            <View className={styles.menuIcon}>
              <Text>ℹ️</Text>
            </View>
            <Text className={styles.menuText}>关于</Text>
            <Text className={styles.menuValue}>v1.0.0</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>

        <Text className={styles.version}>💰 做好记账，财富自来</Text>
      </View>
    </ScrollView>
  )
}

export default ProfilePage
