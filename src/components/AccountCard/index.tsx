import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import type { Account } from '@/types'
import { formatMoney } from '@/utils/format'

interface AccountCardProps {
  account: Account
  onClick?: () => void
  compact?: boolean
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onClick, compact }) => {
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      Taro.navigateTo({
        url: `/pages/account-detail/index?id=${account.id}`
      })
    }
  }

  const isCredit = account.type === 'credit'
  const usedPercent = isCredit && account.creditLimit
    ? Math.min(Math.abs(account.balance) / account.creditLimit, 1)
    : 0

  return (
    <View
      className={classnames(styles.card, compact && styles.compact)}
      style={{ background: `linear-gradient(135deg, ${account.color}dd 0%, ${account.color}99 100%)` }}
      onClick={handleClick}
    >
      <View className={styles.header}>
        <Text className={styles.icon}>{account.icon}</Text>
        <Text className={styles.name}>{account.name}</Text>
        {account.type === 'cash' && <View className={styles.badge}>现金</View>}
        {account.type === 'bank' && <View className={styles.badge}>储蓄卡</View>}
        {account.type === 'credit' && <View className={classnames(styles.badge, styles.badgeCredit)}>信用卡</View>}
      </View>

      <View className={styles.balanceRow}>
        <Text className={styles.balanceLabel}>余额</Text>
        <Text className={styles.balanceValue} style={{ color: account.balance < 0 ? '#fecaca' : '#ffffff' }}>
          {formatMoney(account.balance)}
        </Text>
      </View>

      {isCredit && account.creditLimit && !compact && (
        <View className={styles.creditInfo}>
          <View className={styles.creditRow}>
            <Text className={styles.creditLabel}>额度</Text>
            <Text className={styles.creditValue}>{formatMoney(account.creditLimit)}</Text>
          </View>
          <View className={styles.progressBar}>
            <View
              className={styles.progressFill}
              style={{ width: `${usedPercent * 100}%` }}
            />
          </View>
          <View className={styles.creditRow}>
            <Text className={styles.creditLabel}>已用 {(usedPercent * 100).toFixed(0)}%</Text>
            {account.nextRepaymentDate && (
              <Text className={styles.creditValue}>还款日 {account.nextRepaymentDate.slice(5)}</Text>
            )}
          </View>
        </View>
      )}

      {!isCredit && !compact && account.note && (
        <Text className={styles.note}>{account.note}</Text>
      )}
    </View>
  )
}

export default AccountCard
