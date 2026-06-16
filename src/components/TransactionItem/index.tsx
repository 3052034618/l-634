import React, { useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import type { Transaction } from '@/types'
import { formatMoney, getRelativeDate } from '@/utils/format'
import { useAppStore } from '@/store/appStore'
import { useAccountStore } from '@/store/accountStore'
import classnames from 'classnames'

interface TransactionItemProps {
  transaction: Transaction
  showDate?: boolean
  targetAccountId?: string
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, showDate, targetAccountId }) => {
  const getCategoryById = useAppStore((s) => s.getCategoryById)
  const getAccountById = useAccountStore((s) => s.getAccountById)
  const cat = getCategoryById(transaction.categoryId)

  const isTransfer = transaction.type === 'transfer'
  const fromAccount = isTransfer ? getAccountById(transaction.accountId) : undefined
  const toAccount = isTransfer && transaction.transferToAccountId
    ? getAccountById(transaction.transferToAccountId)
    : undefined

  const { isIncomingView, effectiveAmount, labelText, subText } = useMemo(() => {
    if (!isTransfer) {
      return {
        isIncomingView: transaction.type === 'income',
        effectiveAmount: transaction.amount,
        labelText: transaction.categoryName,
        subText: transaction.merchant || transaction.description || '无描述'
      }
    }

    // 转账逻辑：选了账户筛选时按视角显示
    if (targetAccountId) {
      const isIncoming = transaction.transferToAccountId === targetAccountId
      const account = isIncoming ? fromAccount : toAccount
      return {
        isIncomingView: isIncoming,
        effectiveAmount: transaction.amount,
        labelText: isIncoming ? `从${fromAccount?.name || '账户'}转入` : `转账到${toAccount?.name || '账户'}`,
        subText: isIncoming
          ? `${toAccount?.icon || '💳'} +¥${formatMoney(transaction.amount)}`
          : `${fromAccount?.icon || '💳'} → ${toAccount?.icon || '💳'}`
      }
    }

    // 全局视角：默认显示转出方视角
    return {
      isIncomingView: false,
      effectiveAmount: transaction.amount,
      labelText: `转账：${fromAccount?.name || ''} → ${toAccount?.name || ''}`,
      subText: `${fromAccount?.icon || '💳'} ${toAccount?.icon || '💳'}  ${transaction.date}`
    }
  }, [isTransfer, targetAccountId, transaction, fromAccount, toAccount])

  const displayIcon = isTransfer
    ? '⇄'
    : (cat?.icon || '📝')

  const displayColor = isTransfer
    ? '#f59e0b'
    : (isIncomingView ? '#10b981' : '#ef4444')

  const handleClick = () => {
    Taro.navigateTo({
      url: `/pages/transaction-detail/index?id=${transaction.id}`
    })
  }

  return (
    <View className={styles.item} onClick={handleClick}>
      <View
        className={classnames(styles.iconWrap, isTransfer && styles.iconWrapTransfer)}
        style={{ backgroundColor: `${displayColor}20` }}
      >
        <Text className={styles.icon}>{displayIcon}</Text>
      </View>
      <View className={styles.content}>
        <View className={styles.topRow}>
          <Text className={classnames(styles.category, isTransfer && styles.categoryTransfer)}>
            {labelText}
          </Text>
          <Text
            className={styles.amount}
            style={{ color: displayColor }}
          >
            {isTransfer
              ? (isIncomingView ? `+${formatMoney(effectiveAmount)}` : `-${formatMoney(effectiveAmount)}`)
              : `${isIncomingView ? '+' : '-'}${formatMoney(effectiveAmount)}`}
          </Text>
        </View>
        <View className={styles.bottomRow}>
          <Text className={styles.desc}>{subText}</Text>
          {showDate && <Text className={styles.date}>{getRelativeDate(transaction.date)}</Text>}
        </View>
      </View>
    </View>
  )
}

export default TransactionItem
