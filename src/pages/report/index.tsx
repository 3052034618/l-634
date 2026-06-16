import React, { useMemo, useState } from 'react'
import { View, Text, ScrollView, useDidShow, showToast } from '@tarojs/taro'
import dayjs from 'dayjs'
import { useTransactionStore } from '@/store/transactionStore'
import { useBudgetStore } from '@/store/budgetStore'
import { useAccountStore } from '@/store/accountStore'
import PieChart, { PieDataItem } from '@/components/PieChart'
import LineChart, { LineDataPoint } from '@/components/LineChart'
import SectionHeader from '@/components/SectionHeader'
import EmptyState from '@/components/EmptyState'
import { formatMoney, getMonthKey } from '@/utils/format'
import { exportToCSV, exportSummaryToText } from '@/utils/export'
import styles from './index.module.scss'

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'
]

const ReportPage: React.FC = () => {
  const [period, setPeriod] = useState<'month' | 'year'>('month')
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'))
  const [activeType, setActiveType] = useState<'expense' | 'income'>('expense')
  const loadTransactions = useTransactionStore((s) => s.loadTransactions)
  const getMonthSummary = useTransactionStore((s) => s.getMonthSummary)
  const predictNextMonth = useTransactionStore((s) => s.predictNextMonth)
  const getTotalProgress = useBudgetStore((s) => s.getTotalProgress)
  const loadBudgets = useBudgetStore((s) => s.loadBudgets)

  useDidShow(() => {
    loadTransactions()
    loadBudgets()
  })

  const summary = useMemo(() => getMonthSummary(currentMonth), [currentMonth, getMonthSummary])
  const prediction = useMemo(() => predictNextMonth(), [predictNextMonth])
  const budgetProgress = useMemo(() => getTotalProgress(currentMonth), [currentMonth, getTotalProgress])

  const pieData = useMemo((): PieDataItem[] => {
    const entries = Array.from(summary.byCategory.entries())
      .filter(([, v]) => v.type === activeType)
      .sort((a, b) => b[1].amount - a[1].amount)

    const total = entries.reduce((sum, [, v]) => sum + v.amount, 0)
    return entries.map(([, v], i) => ({
      name: v.name,
      value: v.amount,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
    }))
  }, [summary, activeType])

  const trendData = useMemo((): LineDataPoint[] => {
    const points: LineDataPoint[] = []
    for (let i = 5; i >= 0; i--) {
      const month = dayjs(currentMonth + '-01').subtract(i, 'month').format('YYYY-MM')
      const s = getMonthSummary(month)
      points.push({
        label: dayjs(month + '-01').format('M月'),
        value: activeType === 'expense' ? s.totalExpense : s.totalIncome
      })
    }
    return points
  }, [currentMonth, activeType, getMonthSummary])

  const totalPie = pieData.reduce((s, d) => s + d.value, 0)

  const handlePrevMonth = () => {
    setCurrentMonth(dayjs(currentMonth + '-01').subtract(1, 'month').format('YYYY-MM'))
  }

  const handleNextMonth = () => {
    const next = dayjs(currentMonth + '-01').add(1, 'month')
    if (next.isAfter(dayjs(), 'month')) return
    setCurrentMonth(next.format('YYYY-MM'))
  }

  const accounts = useAccountStore((s) => s.accounts)
  const handleExportCSV = async () => {
    const data = useTransactionStore.getState().getMonthTransactions(currentMonth)
    await exportToCSV(data, accounts, `交易明细_${currentMonth}`)
  }

  const handleExportReport = async () => {
    await exportSummaryToText(currentMonth, summary, budgetProgress, accounts)
  }

  const getTrendClass = () => {
    if (prediction.trend === 'up') return styles.trendUp
    if (prediction.trend === 'down') return styles.trendDown
    return styles.trendStable
  }

  const getTrendIcon = () => {
    if (prediction.trend === 'up') return '📈'
    if (prediction.trend === 'down') return '📉'
    return '➡️'
  }

  const getTrendText = () => {
    if (prediction.trend === 'up') return '上升趋势'
    if (prediction.trend === 'down') return '下降趋势'
    return '平稳'
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <View className={styles.periodTabs}>
            <View
              className={`${styles.periodTab} ${period === 'month' ? styles.periodTabActive : ''}`}
              onClick={() => setPeriod('month')}
            >
              月度
            </View>
            <View
              className={`${styles.periodTab} ${period === 'year' ? styles.periodTabActive : ''}`}
              onClick={() => setPeriod('year')}
            >
              年度
            </View>
          </View>
        </View>

        <View className={styles.monthNav}>
          <View className={styles.navBtn} onClick={handlePrevMonth}>‹</View>
          <Text className={styles.monthLabel}>
            {dayjs(currentMonth + '-01').format(period === 'month' ? 'YYYY年M月' : 'YYYY年')}
          </Text>
          <View className={styles.navBtn} onClick={handleNextMonth}>›</View>
        </View>

        <View className={styles.summaryCards}>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>总收入</Text>
            <Text className={styles.summaryValue}>¥{formatMoney(summary.totalIncome)}</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>总支出</Text>
            <Text className={styles.summaryValue}>¥{formatMoney(summary.totalExpense)}</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>结余</Text>
            <Text className={styles.summaryValue}>¥{formatMoney(summary.netIncome)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.predictCard}>
          <View className={styles.predictHeader}>
            <Text className={styles.predictIcon}>🔮</Text>
            <Text className={styles.predictTitle}>下月支出预测</Text>
          </View>
          <View className={styles.predictContent}>
            <Text className={styles.predictAmount}>¥{formatMoney(prediction.predicted)}</Text>
            <View className={`${styles.predictTrend} ${getTrendClass()}`}>
              <Text>{getTrendIcon()} {getTrendText()}</Text>
            </View>
          </View>
          <View className={styles.predictTip}>
            💡 {prediction.suggestion}
          </View>
        </View>

        <View className={styles.card}>
          <View className={styles.cardHeader}>
            <Text className={styles.cardTitle}>分类占比</Text>
          </View>
          <View className={styles.categoryTabs}>
            <View
              className={`${styles.categoryTab} ${activeType === 'expense' ? styles.categoryTabActive : ''}`}
              onClick={() => setActiveType('expense')}
            >
              支出
            </View>
            <View
              className={`${styles.categoryTab} ${activeType === 'income' ? styles.categoryTabActive : ''}`}
              onClick={() => setActiveType('income')}
            >
              收入
            </View>
          </View>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              size={300}
              centerLabel={activeType === 'expense' ? '总支出' : '总收入'}
              centerValue={`¥${formatMoney(totalPie)}`}
            />
          ) : (
            <EmptyState text={`暂无${activeType === 'expense' ? '支出' : '收入'}数据`} />
          )}
        </View>

        <View className={styles.card}>
          <View className={styles.cardHeader}>
            <Text className={styles.cardTitle}>近6个月趋势</Text>
            <Text className={styles.cardSub}>
              {activeType === 'expense' ? '支出' : '收入'}走势
            </Text>
          </View>
          <LineChart
            data={trendData}
            color={activeType === 'expense' ? '#ef4444' : '#10b981'}
            height={240}
          />
        </View>

        <View className={styles.card}>
          <SectionHeader
            title={`${activeType === 'expense' ? '支出' : '收入'}明细`}
            extra={`共${pieData.length}项`}
          />
          {pieData.length > 0 ? (
            <View className={styles.categoryList}>
              {pieData.map((d, i) => (
                <View key={i} className={styles.categoryRow}>
                  <View className={styles.catIcon}>
                    <Text>📊</Text>
                  </View>
                  <View className={styles.catInfo}>
                    <Text className={styles.catName}>{d.name}</Text>
                    <View className={styles.catAmountRow}>
                      <Text className={styles.catAmount}>¥{formatMoney(d.value)}</Text>
                      <Text className={styles.catPercent}>
                        {totalPie > 0 ? ((d.value / totalPie) * 100).toFixed(1) : 0}%
                      </Text>
                    </View>
                  </View>
                  <View className={styles.catBar}>
                    <View
                      className={styles.catBarFill}
                      style={{
                        width: `${totalPie > 0 ? (d.value / totalPie) * 100 : 0}%`,
                        backgroundColor: d.color
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState text="暂无数据" />
          )}
        </View>

        <SectionHeader title="数据导出" />
        <View className={styles.actionRow}>
          <View className={styles.actionBtn} onClick={handleExportCSV}>
            <Text className={styles.actionIcon}>📋</Text>
            <Text className={styles.actionLabel}>导出明细CSV</Text>
          </View>
          <View className={styles.actionBtn} onClick={handleExportReport}>
            <Text className={styles.actionIcon}>📄</Text>
            <Text className={styles.actionLabel}>导出财务报告</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

export default ReportPage
