import React, { useState, useMemo } from 'react'
import { View, Text, useDidShow, showToast } from '@tarojs/taro'
import { useAppStore } from '@/store/appStore'
import { useTransactionStore } from '@/store/transactionStore'
import dayjs from 'dayjs'
import styles from './index.module.scss'

const CategoryManagePage: React.FC = () => {
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const categories = useAppStore((s) => s.categories)
  const loadCategories = useAppStore((s) => s.initApp)
  const transactions = useTransactionStore((s) => s.transactions)
  const loadTransactions = useTransactionStore((s) => s.loadTransactions)

  useDidShow(() => {
    loadCategories()
    loadTransactions()
  })

  const displayCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  )

  const categoryUsage = useMemo(() => {
    const usage: Record<string, number> = {}
    const currentMonth = dayjs().format('YYYY-MM')
    transactions
      .filter((t) => t.type === type && t.date.startsWith(currentMonth))
      .forEach((t) => {
        usage[t.categoryId] = (usage[t.categoryId] || 0) + 1
      })
    return usage
  }, [transactions, type])

  const handleCategoryClick = (name: string) => {
    showToast({ title: `${name}分类`, icon: 'none' })
  }

  return (
    <View className={styles.page}>
      <View className={styles.tabs}>
        <View
          className={`${styles.tab} ${type === 'expense' ? styles.tabActive : ''}`}
          onClick={() => setType('expense')}
        >
          支出分类
        </View>
        <View
          className={`${styles.tab} ${type === 'income' ? styles.tabActive : ''}`}
          onClick={() => setType('income')}
        >
          收入分类
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.categorySection}>
          <Text className={styles.sectionTitle}>本月使用</Text>
          <View className={styles.categoryGrid}>
            {displayCategories
              .filter((c) => (categoryUsage[c.id] || 0) > 0)
              .sort((a, b) => (categoryUsage[b.id] || 0) - (categoryUsage[a.id] || 0))
              .map((cat) => (
                <View
                  key={cat.id}
                  className={styles.categoryItem}
                  onClick={() => handleCategoryClick(cat.name)}
                >
                  <View className={styles.catIcon} style={{ background: `${cat.color}20` }}>
                    <Text>{cat.icon}</Text>
                  </View>
                  <Text className={styles.catName}>{cat.name}</Text>
                  <Text className={styles.catCount}>{categoryUsage[cat.id] || 0}笔</Text>
                </View>
              ))}
          </View>
        </View>

        <View className={styles.categorySection}>
          <Text className={styles.sectionTitle}>全部分类</Text>
          <View className={styles.categoryGrid}>
            {displayCategories.map((cat) => (
              <View
                key={cat.id}
                className={styles.categoryItem}
                onClick={() => handleCategoryClick(cat.name)}
              >
                <View className={styles.catIcon} style={{ background: `${cat.color}20` }}>
                  <Text>{cat.icon}</Text>
                </View>
                <Text className={styles.catName}>{cat.name}</Text>
                <Text className={styles.catCount}>
                  {cat.keywords?.length || 0}个关键词
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.tipCard}>
          <Text className={styles.tipTitle}>
            <Text>🤖</Text>
            <Text>智能分类说明</Text>
          </Text>
          <Text className={styles.tipText}>
            {'\n'}• 系统会根据交易描述和商户名称自动匹配分类
            {'\n'}• 当您手动调整分类时，系统会自动学习关键词
            {'\n'}• 使用越久，分类越准确
            {'\n'}• 每个分类内置多个关键词用于智能匹配
          </Text>
        </View>
      </View>
    </View>
  )
}

export default CategoryManagePage
