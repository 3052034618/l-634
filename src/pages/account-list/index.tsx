import React, { useMemo } from 'react'
import { View, Text, useDidShow, navigateTo } from '@tarojs/taro'
import { useAccountStore } from '@/store/accountStore'
import { formatMoney } from '@/utils/format'
import type { AccountType } from '@/types'
import styles from './index.module.scss'

const typeMap: Record<AccountType, string> = {
  cash: '现金',
  bank: '银行卡',
  credit: '信用卡'
}

const AccountListPage: React.FC = () => {
  const loadAccounts = useAccountStore((s) => s.loadAccounts)
  const accounts = useAccountStore((s) => s.accounts)

  useDidShow(() => {
    loadAccounts()
  })

  const handleAdd = () => {
    navigateTo({ url: '/pages/add-account/index' })
  }

  const handleClick = (id: string) => {
    navigateTo({ url: `/pages/account-detail/index?id=${id}` })
  }

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        {accounts.length > 0 ? (
          accounts.map((acc) => (
            <View
              key={acc.id}
              className={styles.accountCard}
              onClick={() => handleClick(acc.id)}
            >
              <View
                className={styles.accountIcon}
                style={{ background: `${acc.color}20` }}
              >
                <Text>{acc.icon}</Text>
              </View>
              <View className={styles.accountInfo}>
                <Text className={styles.accountName}>{acc.name}</Text>
                <Text className={styles.accountType}>{typeMap[acc.type]}</Text>
              </View>
              <Text className={styles.accountBalance}>
                ¥{formatMoney(acc.balance)}
              </Text>
              <Text className={styles.arrow}>›</Text>
            </View>
          ))
        ) : (
          <View className={styles.empty}>暂无账户，点击右下角添加</View>
        )}
      </View>
      <View className={styles.fab} onClick={handleAdd}>
        <Text>+</Text>
      </View>
    </View>
  )
}

export default AccountListPage
