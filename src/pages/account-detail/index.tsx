import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, useDidShow, useRouter, navigateBack, showModal, showToast } from '@tarojs/taro'
import { useAccountStore } from '@/store/accountStore'
import { useTransactionStore } from '@/store/transactionStore'
import { useBalanceLogStore } from '@/store/balanceLogStore'
import TransactionItem from '@/components/TransactionItem'
import { formatMoney, getMonthKey } from '@/utils/format'
import type { AccountType, BalanceChangeReason } from '@/types'
import dayjs from 'dayjs'
import classnames from 'classnames'
import styles from './index.module.scss'

const typeMap: Record<AccountType, string> = {
  cash: '现金',
  bank: '银行卡',
  credit: '信用卡'
}

const reasonMap: Record<BalanceChangeReason, { label: string; icon: string; color: string }> = {
  add_transaction: { label: '新增交易', icon: '➕', color: '#3b82f6' },
  update_transaction: { label: '编辑交易', icon: '✏️', color: '#f59e0b' },
  delete_transaction: { label: '删除交易', icon: '🗑️', color: '#ef4444' },
  transfer_out: { label: '转出', icon: '↗️', color: '#f59e0b' },
  transfer_in: { label: '转入', icon: '↙️', color: '#10b981' },
  mark_paid: { label: '标记还款', icon: '✅', color: '#10b981' },
  manual_adjust: { label: '手动调整', icon: '⚙️', color: '#6366f1' }
}

const AccountDetailPage: React.FC = () => {
  const router = useRouter()
  const id = router.params.id as string

  const accounts = useAccountStore((s) => s.accounts)
  const deleteAccount = useAccountStore((s) => s.deleteAccount)
  const transactions = useTransactionStore((s) => s.transactions)
  const balanceLogs = useBalanceLogStore((s) => s.logs)
  const loadLogs = useBalanceLogStore((s) => s.loadLogs)

  const [tab, setTab] = useState<'tx' | 'log'>('tx')

  const account = useMemo(() => accounts.find((a) => a.id === id), [id, accounts])

  useDidShow(() => {
    loadLogs()
    if (!account) {
      showToast({ title: '账户不存在', icon: 'none' })
      setTimeout(() => navigateBack(), 1000)
    }
  })

  if (!account) return null

  const currentMonth = dayjs().format('YYYY-MM')
  const accountTxs = useMemo(() => {
    return transactions
      .filter((t) => t.accountId === id || t.transferToAccountId === id)
      .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
  }, [transactions, id])

  const monthTx = accountTxs.filter((t) => dayjs(t.date).format('YYYY-MM') === currentMonth)

  const logs = useMemo(() => {
    return balanceLogs
      .filter((l) => l.accountId === id)
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
  }, [balanceLogs, id])

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
        <View className={styles.tabBar}>
          <View
            className={classnames(styles.tabItem, tab === 'tx' && styles.active)}
            onClick={() => setTab('tx')}
          >
            <Text>交易记录（{accountTxs.length}）</Text>
          </View>
          <View
            className={classnames(styles.tabItem, tab === 'log' && styles.active)}
            onClick={() => setTab('log')}
          >
            <Text>余额流水（{logs.length}）</Text>
          </View>
        </View>

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
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>本月交易</Text>
            <Text className={styles.infoValue}>{monthTx.length} 笔</Text>
          </View>
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

        <ScrollView scrollY className={styles.tabContent} enhanced showScrollbar={false}>
          {tab === 'tx' ? (
            <View className={styles.listBlock}>
              {accountTxs.length === 0 ? (
                <View className={styles.emptyBlock}>
                  <Text className={styles.emptyIcon}>📝</Text>
                  <Text className={styles.emptyText}>暂无交易记录</Text>
                </View>
              ) : (
                <View className={styles.txList}>
                  {accountTxs.slice(0, 50).map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      targetAccountId={id}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View className={styles.listBlock}>
              {logs.length === 0 ? (
                <View className={styles.emptyBlock}>
                  <Text className={styles.emptyIcon}>📒</Text>
                  <Text className={styles.emptyText}>暂无余额流水记录</Text>
                </View>
              ) : (
                <View className={styles.logList}>
                  {logs.slice(0, 100).map((log) => {
                    const reasonInfo = reasonMap[log.reason] || {
                      label: log.reason,
                      icon: '📌',
                      color: '#64748b'
                    }
                    return (
                      <View key={log.id} className={styles.logItem}>
                        <View
                          className={styles.logIcon}
                          style={{ backgroundColor: `${reasonInfo.color}15` }}
                        >
                          <Text>{reasonInfo.icon}</Text>
                        </View>
                        <View className={styles.logContent}>
                          <View className={styles.logTop}>
                            <Text className={styles.logReason}>{reasonInfo.label}</Text>
                            <Text
                              className={styles.logDelta}
                              style={{ color: log.delta >= 0 ? '#10b981' : '#ef4444' }}
                            >
                              {log.delta >= 0 ? '+' : ''}{formatMoney(log.delta)}
                            </Text>
                          </View>
                          <View className={styles.logBottom}>
                            <Text className={styles.logDesc}>{log.description}</Text>
                            <Text className={styles.logDate}>
                              {dayjs(log.createdAt).format('MM-DD HH:mm')}
                            </Text>
                          </View>
                          <View className={styles.logBalance}>
                            <Text className={styles.logBalanceText}>
                              余额变动: {formatMoney(log.oldBalance)} → {formatMoney(log.newBalance)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          )}
        </ScrollView>
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
