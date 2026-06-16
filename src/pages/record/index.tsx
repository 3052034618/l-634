import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import TransactionItem from '@/components/TransactionItem'
import EmptyState from '@/components/EmptyState'
import { useTransactionStore } from '@/store/transactionStore'
import { useAppStore } from '@/store/appStore'
import { formatMoney, getRelativeDate, isSameDay, getMonthKey } from '@/utils/format'
import type { TransactionType } from '@/types'
import dayjs from 'dayjs'

const RecordPage: React.FC = () => {
  const transactions = useTransactionStore((s) => s.transactions)
  const getMonthSummary = useTransactionStore((s) => s.getMonthSummary)
  const categories = useAppStore((s) => s.categories)

  const [tab, setTab] = useState<'all' | 'income' | 'expense'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')

  const currentMonth = getMonthKey()
  const summary = useMemo(() => getMonthSummary(currentMonth), [getMonthSummary, currentMonth])

  const filteredTransactions = useMemo(() => {
    let result = transactions

    if (tab !== 'all') {
      result = result.filter((t) => t.type === tab)
    }
    if (selectedCategory) {
      result = result.filter((t) => t.categoryId === selectedCategory)
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase()
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          (t.merchant || '').toLowerCase().includes(q) ||
          t.categoryName.toLowerCase().includes(q) ||
          (t.note || '').toLowerCase().includes(q)
      )
    }

    return result
  }, [transactions, tab, selectedCategory, searchText])

  const groupedTransactions = useMemo(() => {
    const groups: Map<string, typeof filteredTransactions> = new Map()
    filteredTransactions.forEach((tx) => {
      const key = tx.date
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(tx)
    })
    return Array.from(groups.entries()).sort(
      (a, b) => dayjs(b[0]).valueOf() - dayjs(a[0]).valueOf()
    )
  }, [filteredTransactions])

  const categoryFilter = useMemo(() => {
    const typeFilter: TransactionType | null = tab === 'all' ? null : tab
    return categories.filter((c) => !typeFilter || c.type === typeFilter)
  }, [categories, tab])

  const handleAdd = () => {
    Taro.navigateTo({
      url: `/pages/add-transaction/index?type=${tab === 'income' ? 'income' : 'expense'}`
    })
  }

  return (
    <View className="pageContainer">
      <View className={styles.tabBar}>
        <View
          className={classnames(styles.tabItem, tab === 'all' && styles.active)}
          onClick={() => { setTab('all'); setSelectedCategory(null) }}
        >全部</View>
        <View
          className={classnames(styles.tabItem, tab === 'income' && styles.active)}
          onClick={() => { setTab('income'); setSelectedCategory(null) }}
        >收入</View>
        <View
          className={classnames(styles.tabItem, tab === 'expense' && styles.active)}
          onClick={() => { setTab('expense'); setSelectedCategory(null) }}
        >支出</View>
      </View>

      <View className={styles.summaryCard}>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryLabel}>本月收入</Text>
          <Text className={classnames(styles.summaryValue, styles.income)}>
            {formatMoney(summary.totalIncome)}
          </Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryLabel}>本月支出</Text>
          <Text className={classnames(styles.summaryValue, styles.expense)}>
            {formatMoney(summary.totalExpense)}
          </Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryLabel}>本月结余</Text>
          <Text className={classnames(styles.summaryValue, styles.net)}>
            {formatMoney(summary.netIncome)}
          </Text>
        </View>
      </View>

      <View className={styles.searchBar}>
        <Text className={styles.searchIcon}>🔍</Text>
        <Input
          className={styles.searchInput}
          placeholder="搜索交易描述、商户、备注"
          value={searchText}
          onInput={(e) => setSearchText(e.detail.value)}
        />
      </View>

      <ScrollView scrollX className={styles.filterRow} enhanced showScrollbar={false}>
        <View
          className={classnames(styles.filterChip, !selectedCategory && styles.active)}
          onClick={() => setSelectedCategory(null)}
        >全部分类</View>
        {categoryFilter.map((c) => (
          <View
            key={c.id}
            className={classnames(styles.filterChip, selectedCategory === c.id && styles.active)}
            onClick={() => setSelectedCategory(c.id)}
          >{c.icon} {c.name}</View>
        ))}
      </ScrollView>

      <ScrollView scrollY className={styles.scrollContent} enhanced showScrollbar={false}>
        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon="📝"
            title="暂无记录"
            description={searchText ? '没有找到匹配的交易记录' : '点击右下角按钮开始记账'}
            actionText="记一笔"
            onAction={handleAdd}
          />
        ) : (
          groupedTransactions.map(([date, txs]) => {
            const dayIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
            const dayExpense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

            return (
              <View key={date} className={styles.dateGroup}>
                <View className={styles.dateHeader}>
                  <Text className={styles.dateLabel}>{getRelativeDate(date)}（{date.slice(5)}）</Text>
                  <Text className={styles.dateSummary}>
                    收 {formatMoney(dayIncome)} / 支 {formatMoney(dayExpense)}
                  </Text>
                </View>
                <View className={styles.transactionList}>
                  {txs.map((tx) => (
                    <TransactionItem key={tx.id} transaction={tx} />
                  ))}
                </View>
              </View>
            )
          })
        )}
      </ScrollView>

      <View className={styles.fab} onClick={handleAdd}>
        <Text className={styles.fabIcon}>＋</Text>
      </View>
    </View>
  )
}

export default RecordPage
