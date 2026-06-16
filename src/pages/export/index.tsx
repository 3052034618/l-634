import React, { useMemo } from 'react'
import { View, Text, useDidShow, showToast } from '@tarojs/taro'
import dayjs from 'dayjs'
import { useTransactionStore } from '@/store/transactionStore'
import { useAccountStore } from '@/store/accountStore'
import { useBudgetStore } from '@/store/budgetStore'
import { formatMoney, getMonthKey } from '@/utils/format'
import { exportToCSV, exportSummaryToText } from '@/utils/export'
import styles from './index.module.scss'

const ExportPage: React.FC = () => {
  const loadTransactions = useTransactionStore((s) => s.loadTransactions)
  const transactions = useTransactionStore((s) => s.transactions)
  const getMonthSummary = useTransactionStore((s) => s.getMonthSummary)
  const loadAccounts = useAccountStore((s) => s.loadAccounts)
  const accounts = useAccountStore((s) => s.accounts)
  const getTotalProgress = useBudgetStore((s) => s.getTotalProgress)
  const loadBudgets = useBudgetStore((s) => s.loadBudgets)

  useDidShow(() => {
    loadTransactions()
    loadAccounts()
    loadBudgets()
  })

  const currentMonth = dayjs().format('YYYY-MM')
  const summary = useMemo(() => getMonthSummary(currentMonth), [currentMonth, getMonthSummary])
  const budgetProgress = useMemo(() => getTotalProgress(currentMonth), [currentMonth, getTotalProgress])

  const handleExportCSV = async () => {
    await exportToCSV(transactions, accounts, `全部交易记录_${dayjs().format('YYYYMMDD')}`)
  }

  const handleExportMonthCSV = async () => {
    const monthTx = transactions.filter((t) => t.date.startsWith(currentMonth))
    await exportToCSV(monthTx, accounts, `${currentMonth}交易明细`)
  }

  const handleExportReport = async () => {
    await exportSummaryToText(currentMonth, summary, budgetProgress, accounts)
  }

  const handleExportAll = async () => {
    if (transactions.length === 0) {
      showToast({ title: '暂无数据', icon: 'none' })
      return
    }
    await handleExportCSV()
    setTimeout(() => handleExportReport(), 1000)
  }

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        <View className={styles.statsCard}>
          <Text className={styles.statsTitle}>📊 数据概览</Text>
          <View className={styles.statsGrid}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{transactions.length}</Text>
              <Text className={styles.statLabel}>累计交易</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{accounts.length}</Text>
              <Text className={styles.statLabel}>账户数量</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>¥{formatMoney(summary.totalIncome)}</Text>
              <Text className={styles.statLabel}>本月收入</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>¥{formatMoney(summary.totalExpense)}</Text>
              <Text className={styles.statLabel}>本月支出</Text>
            </View>
          </View>
        </View>

        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>
            <Text>📤</Text>
            <Text>导出选项</Text>
          </Text>
          <Text className={styles.sectionDesc}>
            选择需要导出的数据类型，导出的文件可用于备份或在其他设备上查看。
          </Text>
          <View className={styles.exportList}>
            <View className={styles.exportItem} onClick={handleExportCSV}>
              <View className={styles.exportIcon}>
                <Text>📋</Text>
              </View>
              <View className={styles.exportInfo}>
                <Text className={styles.exportName}>全部交易记录</Text>
                <Text className={styles.exportSub}>导出所有历史交易为CSV格式</Text>
              </View>
              <Text className={styles.exportArrow}>›</Text>
            </View>

            <View className={styles.exportItem} onClick={handleExportMonthCSV}>
              <View className={styles.exportIcon}>
                <Text>📅</Text>
              </View>
              <View className={styles.exportInfo}>
                <Text className={styles.exportName}>本月交易明细</Text>
                <Text className={styles.exportSub}>仅导出{currentMonth}的交易记录</Text>
              </View>
              <Text className={styles.exportArrow}>›</Text>
            </View>

            <View className={styles.exportItem} onClick={handleExportReport}>
              <View className={styles.exportIcon}>
                <Text>📄</Text>
              </View>
              <View className={styles.exportInfo}>
                <Text className={styles.exportName}>月度财务报告</Text>
                <Text className={styles.exportSub}>收支汇总、预算执行情况分析</Text>
              </View>
              <Text className={styles.exportArrow}>›</Text>
            </View>

            <View className={styles.exportItem} onClick={handleExportAll}>
              <View className={styles.exportIcon}>
                <Text>📦</Text>
              </View>
              <View className={styles.exportInfo}>
                <Text className={styles.exportName}>一键导出全部</Text>
                <Text className={styles.exportSub}>导出所有数据和报告</Text>
              </View>
              <Text className={styles.exportArrow}>›</Text>
            </View>
          </View>
        </View>

        <View className={styles.tipCard}>
          <Text className={styles.tipTitle}>
            <Text>💡</Text>
            <Text>小贴士</Text>
          </Text>
          <Text className={styles.tipText}>
            {'\n'}• CSV文件可用Excel或WPS打开查看
            {'\n'}• 建议每月月底导出数据备份
            {'\n'}• 财务报告可截图保存分享
            {'\n'}• 所有数据均保存在本地，请定期备份
          </Text>
        </View>
      </View>
    </View>
  )
}

export default ExportPage
