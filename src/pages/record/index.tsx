import React, { useState, useMemo, useEffect } from 'react'
import { View, Text, ScrollView, Input, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import TransactionItem from '@/components/TransactionItem'
import EmptyState from '@/components/EmptyState'
import { useTransactionStore } from '@/store/transactionStore'
import { useAccountStore } from '@/store/accountStore'
import { useAppStore } from '@/store/appStore'
import { formatMoney, getRelativeDate, getMonthKey } from '@/utils/format'
import { getStorageSync, setStorageSync } from '@/utils/storage'
import dayjs from 'dayjs'

const FILTER_KEY = 'record_filter_state'

interface FilterState {
  tab: 'all' | 'income' | 'expense' | 'transfer'
  selectedAccountId: string | null
  selectedCategory: string | null
  selectedMonth: string
  searchText: string
}

const defaultFilter: FilterState = {
  tab: 'all',
  selectedAccountId: null,
  selectedCategory: null,
  selectedMonth: getMonthKey(),
  searchText: ''
}

const RecordPage: React.FC = () => {
  const transactions = useTransactionStore((s) => s.transactions)
  const accounts = useAccountStore((s) => s.accounts)
  const categories = useAppStore((s) => s.categories)

  const [filter, setFilter] = useState<FilterState>(() => {
    return getStorageSync<FilterState>(FILTER_KEY, { ...defaultFilter })
  })

  useEffect(() => {
    setStorageSync(FILTER_KEY, filter)
  }, [filter])

  const updateFilter = (patch: Partial<FilterState>) => {
    setFilter((prev) => ({ ...prev, ...patch }))
  }

  const { tab, selectedAccountId, selectedCategory, selectedMonth, searchText } = filter

  const monthOptions = useMemo(() => {
    const opts: string[] = []
    const now = dayjs()
    for (let i = 0; i < 12; i++) {
      opts.push(now.subtract(i, 'month').format('YYYY-MM'))
    }
    return opts
  }, [])
  const monthIndex = monthOptions.indexOf(selectedMonth)

  const accountOptions = useMemo(() => accounts.map((a) => `${a.icon} ${a.name}`), [accounts])
  const accountIndex = selectedAccountId ? accounts.findIndex((a) => a.id === selectedAccountId) : -1

  const filteredTransactions = useMemo(() => {
    let result = transactions

    result = result.filter((t) => dayjs(t.date).format('YYYY-MM') === selectedMonth)

    if (tab !== 'all') {
      result = result.filter((t) => t.type === tab)
    }
    if (selectedAccountId) {
      result = result.filter(
        (t) => t.accountId === selectedAccountId || t.transferToAccountId === selectedAccountId
      )
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
  }, [transactions, tab, selectedAccountId, selectedCategory, selectedMonth, searchText])

  const filteredSummary = useMemo(() => {
    let income = 0
    let expense = 0
    let transferOut = 0
    let transferIn = 0
    filteredTransactions.forEach((t) => {
      if (t.type === 'income') income += t.amount
      else if (t.type === 'expense') expense += t.amount
      else if (t.type === 'transfer') {
        transferOut += t.amount
        if (selectedAccountId && t.transferToAccountId === selectedAccountId) transferIn += t.amount
      }
    })
    return { income, expense, transferOut, transferIn, net: income - expense }
  }, [filteredTransactions, selectedAccountId])

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
    if (tab === 'transfer') return []
    const typeFilter = tab === 'all' ? null : (tab as 'income' | 'expense')
    return categories.filter((c) => !typeFilter || c.type === typeFilter)
  }, [categories, tab])

  const handleAdd = () => {
    Taro.navigateTo({
      url: `/pages/add-transaction/index?type=${tab === 'income' ? 'income' : 'expense'}`
    })
  }

  const handleTransfer = () => {
    Taro.navigateTo({ url: '/pages/transfer/index' })
  }

  const resetFilters = () => {
    setFilter({ ...defaultFilter, selectedMonth: getMonthKey() })
  }

  const hasActiveFilter =
    tab !== 'all' || selectedAccountId !== null || selectedCategory !== null

  return (
    <View className="pageContainer">
      <View className={styles.tabBar}>
        <View
          className={classnames(styles.tabItem, tab === 'all' && styles.active)}
          onClick={() => updateFilter({ tab: 'all', selectedCategory: null })}
        >全部</View>
        <View
          className={classnames(styles.tabItem, tab === 'income' && styles.active)}
          onClick={() => updateFilter({ tab: 'income', selectedCategory: null })}
        >收入</View>
        <View
          className={classnames(styles.tabItem, tab === 'expense' && styles.active)}
          onClick={() => updateFilter({ tab: 'expense', selectedCategory: null })}
        >支出</View>
        <View
          className={classnames(styles.tabItem, tab === 'transfer' && styles.active)}
          onClick={() => updateFilter({ tab: 'transfer', selectedCategory: null })}
        >转账</View>
      </View>

      <View className={styles.summaryCard}>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryLabel}>收入</Text>
          <Text className={classnames(styles.summaryValue, styles.income)}>
            +{formatMoney(filteredSummary.income)}
          </Text>
        </View>
        <View className={styles.summaryDivider} />
        <View className={styles.summaryItem}>
          <Text className={styles.summaryLabel}>支出</Text>
          <Text className={classnames(styles.summaryValue, styles.expense)}>
            -{formatMoney(filteredSummary.expense)}
          </Text>
        </View>
        <View className={styles.summaryDivider} />
        <View className={styles.summaryItem}>
          <Text className={styles.summaryLabel}>结余</Text>
          <Text className={classnames(styles.summaryValue, styles.net)}>
            {formatMoney(filteredSummary.net)}
          </Text>
        </View>
      </View>

      <View className={styles.filterPanel}>
        <Picker
          mode="selector"
          range={monthOptions}
          value={monthIndex >= 0 ? monthIndex : 0}
          onChange={(e: any) => updateFilter({ selectedMonth: monthOptions[e.detail.value] })}
        >
          <View className={styles.filterField}>
            <Text className={styles.filterIcon}>📅</Text>
            <Text className={styles.filterText}>{selectedMonth}</Text>
            <Text className={styles.pickerArrow}>›</Text>
          </View>
        </Picker>

        <Picker
          mode="selector"
          range={['全部账户', ...accountOptions]}
          value={accountIndex + 1}
          onChange={(e: any) => {
            const idx = e.detail.value
            updateFilter({ selectedAccountId: idx === 0 ? null : accounts[idx - 1].id })
          }}
        >
          <View className={styles.filterField}>
            <Text className={styles.filterIcon}>🏦</Text>
            <Text className={styles.filterText}>
              {accountIndex >= 0 ? accountOptions[accountIndex] : '全部账户'}
            </Text>
            <Text className={styles.pickerArrow}>›</Text>
          </View>
        </Picker>

        {hasActiveFilter && (
          <View className={styles.resetBtn} onClick={resetFilters}>
            <Text>重置</Text>
          </View>
        )}
      </View>

      <View className={styles.searchBar}>
        <Text className={styles.searchIcon}>🔍</Text>
        <Input
          className={styles.searchInput}
          placeholder="搜索交易描述、商户、备注"
          value={searchText}
          onInput={(e) => updateFilter({ searchText: e.detail.value })}
        />
      </View>

      {tab !== 'transfer' && categoryFilter.length > 0 && (
        <ScrollView scrollX className={styles.filterRow} enhanced showScrollbar={false}>
          <View
            className={classnames(styles.filterChip, !selectedCategory && styles.active)}
            onClick={() => updateFilter({ selectedCategory: null })}
          >全部分类</View>
          {categoryFilter.map((c) => (
            <View
              key={c.id}
              className={classnames(styles.filterChip, selectedCategory === c.id && styles.active)}
              onClick={() => updateFilter({ selectedCategory: c.id })}
            >{c.icon} {c.name}</View>
          ))}
        </ScrollView>
      )}

      <ScrollView scrollY className={styles.scrollContent} enhanced showScrollbar={false}>
        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon="📝"
            title="暂无记录"
            description={searchText || hasActiveFilter ? '没有找到匹配的交易记录' : '点击右下角按钮开始记账'}
            actionText={hasActiveFilter ? '清除筛选' : '记一笔'}
            onAction={hasActiveFilter ? resetFilters : handleAdd}
          />
        ) : (
          groupedTransactions.map(([date, txs]) => {
            const dayIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
            const dayExpense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
            const dayTransfer = txs.filter((t) => t.type === 'transfer').reduce((s, t) => s + t.amount, 0)

            return (
              <View key={date} className={styles.dateGroup}>
                <View className={styles.dateHeader}>
                  <Text className={styles.dateLabel}>{getRelativeDate(date)}（{date.slice(5)}）</Text>
                  <Text className={styles.dateSummary}>
                    {dayIncome > 0 && <Text>收 {formatMoney(dayIncome)} </Text>}
                    {dayExpense > 0 && <Text>支 {formatMoney(dayExpense)} </Text>}
                    {dayTransfer > 0 && <Text>转 {formatMoney(dayTransfer)}</Text>}
                  </Text>
                </View>
                <View className={styles.transactionList}>
                  {txs.map((tx) => (
                    <TransactionItem key={tx.id} transaction={tx} targetAccountId={selectedAccountId || undefined} />
                  ))}
                </View>
              </View>
            )
          })
        )}
      </ScrollView>

      <View className={styles.fabGroup}>
        <View className={styles.fabSecondary} onClick={handleTransfer}>
          <Text className={styles.fabIconSmall}>⇄</Text>
        </View>
        <View className={styles.fab} onClick={handleAdd}>
          <Text className={styles.fabIcon}>＋</Text>
        </View>
      </View>
    </View>
  )
}

export default RecordPage
