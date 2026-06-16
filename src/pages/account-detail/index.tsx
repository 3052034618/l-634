import React, { useMemo } from 'react'
import { View, Text, useDidShow, useRouter, navigateBack, showModal, showToast } from '@tarojs/taro'
import { useAccountStore } from '@/store/accountStore'
import { useTransactionStore } from '@/store/transactionStore'
import TransactionItem from '@/components/TransactionItem'
import { formatMoney, getMonthKey } from '@/utils/format'
import type { AccountType } from '@/types'
import dayjs from 'dayjs'
import styles from './index.module.scss'

const typeMap: Record<AccountType, string> = {
  cash: '现金',
  bank: '银行卡',
  credit: '信用卡'
}

const AccountDetailPage: React.FC = () => {
  const router = useRouter()
  const id = router.params.id as string
  const getAccountById = useAccountStore((s) => s.getAccountById)
  const deleteAccount = useAccountStore((s) => s.deleteAccount)
  const getMonthTransactions = useTransactionStore((s) => s.getMonthTransactions)

  const account = useMemo(() => getAccountById(id), [id, getAccountById])

  useDidShow(() => {
    if (!account) {
      showToast({ title: '账户不存在', icon: 'none' })
      setTimeout(() => navigateBack(), 1000)
    }
  })

  if (!account) return null

  const currentMonth = dayjs().format('YYYY-MM')
  const monthTx = getMonthTransactions(currentMonth).filter((t) => t.accountId === id)
  const creditUsed = account.type === 'credit' && account.creditLimit
    ? Math.abs(account.balance)
    : 0
  const creditPercent = account.creditLimit ? (creditUsed / account.creditLimit) * 100 : 0

  const handleDelete = () => {
    showModal({
      title: '确认删除',
      content: '确定要删除这个账户吗？相关交易记录将保留。',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          deleteAccount(account.id)
          showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => navigateBack(), 500)
        }
      }
    })
  }

  const handleEdit = () => {
    showToast({ title: '编辑功能开发中', icon: 'none' })
  }

  return (
    <View className={styles.page}>
      <View className={styles.accountHeader} style={{
        background: `linear-gradient(135deg, ${account.color}, ${account.color}cc)`
      }}>
        <View className={styles.accountInfo}>
          <View className={styles.accountIcon}>
            <Text>{account.icon}</Text>
          </View>
          <View>
            <Text className={styles.accountName}>{account.name}</Text>
            <Text className={styles.accountType}>{typeMap[account.type]}</Text>
          </View>
        </View>
        <View className={styles.balanceRow}>
          <Text className={styles.balanceLabel}>
            {account.type === 'credit' ? '当前欠款' : '账户余额'}
          </Text>
          <Text className={styles.balanceValue}>¥{formatMoney(account.balance)}</Text>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.infoCard}>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>账户类型</Text>
            <Text className={styles.infoValue}>{typeMap[account.type]}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>初始余额</Text>
            <Text className={styles.infoValue}>¥{formatMoney(account.initialBalance)}</Text>
          </View>
          {account.note && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>备注</Text>
              <Text className={styles.infoValue}>{account.note}</Text>
            </View>
          )}
        </View>

        {account.type === 'credit' && account.creditLimit && (
          <View className={styles.infoCard}>
            <View className={styles.creditProgress}>
              <View className={styles.infoLabel}>额度使用</View>
              <View className={styles.progressBar}>
                <View
                  className={styles.progressFill}
                  style={{ width: `${Math.min(creditPercent, 100)}%` }}
                />
              </View>
              <View className={styles.progressInfo}>
                <Text className={styles.progressInfoText}>
                  已用 ¥{formatMoney(creditUsed)}
                </Text>
                <Text className={styles.progressInfoText}>
                  总额度 ¥{formatMoney(account.creditLimit)}
                </Text>
              </View>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>账单日</Text>
              <Text className={styles.infoValue}>每月 {account.billingDay} 日</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>还款日</Text>
              <Text className={styles.infoValue}>每月 {account.repaymentDay} 日</Text>
            </View>
            {account.currentBill !== undefined && (
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>本期账单</Text>
                <Text className={styles.infoValue}>¥{formatMoney(account.currentBill)}</Text>
              </View>
            )}
          </View>
        )}

        <View className={styles.infoCard}>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>本月交易</Text>
            <Text className={styles.infoValue}>{monthTx.length} 笔</Text>
          </View>
        </View>

        {monthTx.length > 0 && (
          <View className={styles.txList}>
            {monthTx.slice(0, 10).map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))}
          </View>
        )}
      </View>

      <View className={styles.bottomBar}>
        <View className={`${styles.btn} ${styles.btnEdit}`} onClick={handleEdit}>
          <Text>编辑</Text>
        </View>
        <View className={`${styles.btn} ${styles.btnDelete}`} onClick={handleDelete}>
          <Text>删除</Text>
        </View>
      </View>
    </View>
  )
}

export default AccountDetailPage
