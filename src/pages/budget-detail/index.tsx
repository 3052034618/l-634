import React, { useState, useMemo } from 'react'
import { View, Text, Input, useDidShow, useRouter, showToast, navigateBack } from '@tarojs/taro'
import { useBudgetStore } from '@/store/budgetStore'
import { useAppStore } from '@/store/appStore'
import type { BudgetCategory } from '@/types'
import styles from './index.module.scss'

const BudgetDetailPage: React.FC = () => {
  const router = useRouter()
  const month = (router.params.month as string) || new Date().toISOString().slice(0, 7)
  const getBudgetByMonth = useBudgetStore((s) => s.getBudgetByMonth)
  const setBudget = useBudgetStore((s) => s.setBudget)
  const categories = useAppStore((s) => s.categories)

  const existingBudget = useMemo(() => getBudgetByMonth(month), [month, getBudgetByMonth])

  const [totalLimit, setTotalLimit] = useState(
    existingBudget?.totalLimit?.toString() || ''
  )

  const expenseCats = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  )

  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    if (existingBudget) {
      existingBudget.categoryBudgets.forEach((cb) => {
        init[cb.categoryId] = cb.limit.toString()
      })
    }
    return init
  })

  const handleSave = () => {
    const totalNum = parseFloat(totalLimit) || 0
    if (totalNum <= 0) {
      showToast({ title: '请输入总预算金额', icon: 'none' })
      return
    }

    const catBudgets: BudgetCategory[] = expenseCats
      .filter((c) => {
        const v = parseFloat(categoryBudgets[c.id] || '0')
        return v > 0
      })
      .map((c) => ({
        categoryId: c.id,
        categoryName: c.name,
        limit: parseFloat(categoryBudgets[c.id]),
        warningThreshold: 0.8
      }))

    const catTotal = catBudgets.reduce((sum, cb) => sum + cb.limit, 0)
    if (catTotal > totalNum) {
      showToast({ title: '分类预算之和不能超过总预算', icon: 'none' })
      return
    }

    setBudget(month, totalNum, catBudgets)
    showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => navigateBack(), 500)
  }

  return (
    <View className={styles.page}>
      <View className={styles.totalCard}>
        <Text className={styles.totalLabel}>月度总预算</Text>
        <View className={styles.totalInput}>
          <Text className={styles.currency}>¥</Text>
          <Input
            className={styles.totalAmount}
            type="digit"
            placeholder="0.00"
            value={totalLimit}
            onInput={(e) => setTotalLimit(e.detail.value)}
          />
        </View>
        <Text className={styles.tip}>设置本月可支配总金额</Text>
      </View>

      <View className={styles.categorySection}>
        <View className={styles.sectionHeader}>分类预算（可选）</View>
        {expenseCats.map((cat) => (
          <View key={cat.id} className={styles.categoryRow}>
            <View className={styles.catIcon} style={{ background: `${cat.color}20` }}>
              <Text>{cat.icon}</Text>
            </View>
            <View className={styles.catInfo}>
              <Text className={styles.catName}>{cat.name}</Text>
            </View>
            <Input
              className={styles.catInput}
              type="digit"
              placeholder="不设置"
              value={categoryBudgets[cat.id] || ''}
              onInput={(e) =>
                setCategoryBudgets((prev) => ({ ...prev, [cat.id]: e.detail.value }))
              }
            />
          </View>
        ))}
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.saveBtn} onClick={handleSave}>
          <Text>保存预算</Text>
        </View>
      </View>
    </View>
  )
}

export default BudgetDetailPage
