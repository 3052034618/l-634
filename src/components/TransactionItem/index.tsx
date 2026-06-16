import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import type { Transaction } from '@/types'
import { formatMoney, getRelativeDate } from '@/utils/format'
import { useAppStore } from '@/store/appStore'

interface TransactionItemProps {
  transaction: Transaction
  showDate?: boolean
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, showDate }) => {
  const getCategoryById = useAppStore((s) => s.getCategoryById)
  const cat = getCategoryById(transaction.categoryId)

  const handleClick = () => {
    Taro.navigateTo({
      url: `/pages/transaction-detail/index?id=${transaction.id}`
    })
  }

  return (
    <View className={styles.item} onClick={handleClick}>
      <View className={styles.iconWrap} style={{ backgroundColor: `${cat?.color || '#94a3b8'}20` }}>
        <Text className={styles.icon}>{cat?.icon || '📝'}</Text>
      </View>
      <View className={styles.content}>
        <View className={styles.topRow}>
          <Text className={styles.category}>{transaction.categoryName}</Text>
          <Text
            className={styles.amount}
            style={{ color: transaction.type === 'income' ? '#10b981' : '#ef4444' }}
          >
            {transaction.type === 'income' ? '+' : '-'}
            {formatMoney(transaction.amount)}
          </Text>
        </View>
        <View className={styles.bottomRow}>
          <Text className={styles.desc}>
            {transaction.merchant || transaction.description || '无描述'}
          </Text>
          {showDate && <Text className={styles.date}>{getRelativeDate(transaction.date)}</Text>}
        </View>
      </View>
    </View>
  )
}

export default TransactionItem
