import React, { useState, useMemo } from 'react'
import { View, Text, useDidShow, useRouter, navigateBack, showModal, showToast } from '@tarojs/taro'
import { useTransactionStore } from '@/store/transactionStore'
import { useAccountStore } from '@/store/accountStore'
import { formatMoney, formatDateTime } from '@/utils/format'
import styles from './index.module.scss'

const TransactionDetailPage: React.FC = () => {
  const router = useRouter()
  const id = router.params.id as string
  const getTransactionById = useTransactionStore((s) => s.getTransactionById)
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction)
  const getAccountById = useAccountStore((s) => s.getAccountById)

  const transaction = useMemo(() => getTransactionById(id), [id, getTransactionById])

  useDidShow(() => {
    if (!transaction) {
      showToast({ title: '交易不存在', icon: 'none' })
      setTimeout(() => navigateBack(), 1000)
    }
  })

  if (!transaction) return null

  const account = getAccountById(transaction.accountId)

  const handleDelete = () => {
    showModal({
      title: '确认删除',
      content: '确定要删除这笔交易吗？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          deleteTransaction(transaction.id)
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
      <View className={`${styles.amountHeader} ${transaction.type === 'income' ? styles.headerIncome : styles.headerExpense}`}>
        <Text className={styles.amountLabel}>
          {transaction.type === 'income' ? '收入金额' : '支出金额'}
        </Text>
        <Text className={styles.amountValue}>
          {transaction.type === 'income' ? '+' : '-'}¥{formatMoney(transaction.amount)}
        </Text>
      </View>

      <View className={styles.infoCard}>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>分类</Text>
          <View className={styles.infoValueWrap}>
            <View className={styles.categoryTag}>
              <Text>📊</Text>
              <Text>{transaction.categoryName}</Text>
            </View>
            {transaction.isAutoClassified && !transaction.adjusted && (
              <View className={styles.autoTag}>
              <Text>🤖</Text>
              <Text>智能分类</Text>
            </View>
            )}
          </View>
        </View>

        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>账户</Text>
          <Text className={styles.infoValue}>
            {account?.icon} {account?.name || '未知账户'}
          </Text>
        </View>

        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>日期</Text>
          <Text className={styles.infoValue}>{transaction.date}</Text>
        </View>

        {transaction.merchant && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>商户</Text>
            <Text className={styles.infoValue}>{transaction.merchant}</Text>
          </View>
        )}

        {transaction.description && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>描述</Text>
            <Text className={`${styles.infoValue} ${styles.infoValueMultiline}`}>
              {transaction.description}
            </Text>
          </View>
        )}

        {transaction.note && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>备注</Text>
            <Text className={`${styles.infoValue} ${styles.infoValueMultiline}`}>
              {transaction.note}
            </Text>
          </View>
        )}

        {transaction.attachments && transaction.attachments.length > 0 && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>附件</Text>
            <View className={styles.attachments}>
              {transaction.attachments.map((att, i) => (
                <View key={i} className={styles.attachmentItem}>
                  {att.type === 'image' ? (
                    <Text className={styles.attachmentImage}>🖼️</Text>
                  ) : (
                    <Text className={styles.attachmentPlaceholder}>📄</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>创建时间</Text>
          <Text className={styles.infoValue}>{formatDateTime(transaction.createdAt)}</Text>
        </View>
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

export default TransactionDetailPage
