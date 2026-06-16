import React, { useState, useMemo } from 'react'
import { View, Text, Textarea, useDidShow, navigateTo, showToast, showActionSheet } from '@tarojs/taro'
import { useAccountStore } from '@/store/accountStore'
import { useCreditStore } from '@/store/creditStore'
import { formatMoney } from '@/utils/format'
import dayjs from 'dayjs'
import styles from './index.module.scss'

const CreditPage: React.FC = () => {
  const loadAccounts = useAccountStore((s) => s.loadAccounts)
  const accounts = useAccountStore((s) => s.accounts)
  const loadCredit = useCreditStore((s) => s.loadCredit)
  const reminders = useCreditStore((s) => s.reminders)
  const checkReminders = useCreditStore((s) => s.checkReminders)
  const parseBillText = useCreditStore((s) => s.parseBillText)
  const createBill = useCreditStore((s) => s.createBill)
  const importBillItems = useCreditStore((s) => s.importBillItems)
  const markBillPaid = useCreditStore((s) => s.markBillPaid)
  const calculateLateFee = useCreditStore((s) => s.calculateLateFee)
  const getBillsByAccount = useCreditStore((s) => s.getBillsByAccount)
  const markReminderRead = useCreditStore((s) => s.markReminderRead)

  const [parseText, setParseText] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)

  useDidShow(() => {
    Promise.all([
      new Promise<void>((resolve) => {
        loadAccounts()
        setTimeout(resolve, 50)
      }),
      new Promise<void>((resolve) => {
        loadCredit()
        setTimeout(resolve, 50)
      })
    ]).then(() => {
      setTimeout(() => {
        const credits = useAccountStore.getState().accounts.filter((a) => a.type === 'credit')
        if (credits.length > 0 && !selectedAccountId) {
          setSelectedAccountId(credits[0].id)
        }
        checkReminders()
      }, 100)
    })
  })

  const creditAccounts = useMemo(
    () => accounts.filter((a) => a.type === 'credit'),
    [accounts]
  )

  const unreadReminders = useMemo(
    () => reminders.filter((r) => !r.read).slice(0, 5),
    [reminders]
  )

  const handleReminderClick = (id: string) => {
    markReminderRead(id)
  }

  const handleAddCard = () => {
    navigateTo({ url: '/pages/add-account/index' })
  }

  const handleCardAction = (accountId: string) => {
    setSelectedAccountId(accountId)
    showActionSheet({
      itemList: ['导入账单明细', '标记已还款', '查看账单记录'],
      success: (res) => {
        if (res.tapIndex === 0) {
          showToast({ title: '请在下方粘贴账单文本', icon: 'none' })
        } else if (res.tapIndex === 1) {
          handleMarkPaid(accountId)
        } else if (res.tapIndex === 2) {
          showToast({ title: '账单记录开发中', icon: 'none' })
        }
      }
    })
  }

  const handleMarkPaid = (accountId: string) => {
    const bills = getBillsByAccount(accountId)
    const pendingBill = bills.find((b) => b.status === 'pending')
    if (!pendingBill) {
      showToast({ title: '暂无待还账单', icon: 'none' })
      return
    }
    markBillPaid(pendingBill.id, pendingBill.totalAmount)
    showToast({ title: '已标记还款', icon: 'success' })
  }

  const handleParseBill = () => {
    if (!parseText.trim()) {
      showToast({ title: '请先粘贴账单内容', icon: 'none' })
      return
    }
    if (!selectedAccountId && creditAccounts.length > 0) {
      setSelectedAccountId(creditAccounts[0].id)
    }
    if (!selectedAccountId) {
      showToast({ title: '请先添加信用卡账户', icon: 'none' })
      return
    }

    const account = accounts.find((a) => a.id === selectedAccountId)
    if (!account) {
      showToast({ title: '账户不存在', icon: 'none' })
      return
    }

    const result = parseBillText(selectedAccountId, parseText)
    if (result.items.length === 0) {
      showToast({ title: '未解析到有效数据', icon: 'none' })
      return
    }

    const now = dayjs()
    const billingMonth = now.format('YYYY-MM')
    const billingDate = now.format('YYYY-MM-DD')
    
    let dueDate: string
    if (account.repaymentDay) {
      if (now.date() > account.repaymentDay) {
        dueDate = now.add(1, 'month').date(account.repaymentDay).format('YYYY-MM-DD')
      } else {
        dueDate = now.date(account.repaymentDay).format('YYYY-MM-DD')
      }
    } else {
      dueDate = now.add(20, 'day').format('YYYY-MM-DD')
    }

    const bill = createBill({
      accountId: selectedAccountId,
      billingMonth,
      totalAmount: result.totalAmount,
      billingDate,
      dueDate,
      items: result.items
    })

    importBillItems(bill.id)
    
    setTimeout(() => {
      checkReminders()
    }, 200)
    
    setParseText('')
    showToast({ title: `成功导入${result.items.length}条记录`, icon: 'success' })
  }

  return (
    <View className={styles.page}>
      {unreadReminders.length > 0 && (
        <View className={styles.reminderCard}>
          <Text className={styles.reminderTitle}>
            <Text>⏰</Text>
            <Text>还款提醒</Text>
          </Text>
          <View className={styles.reminderList}>
            {unreadReminders.map((r) => {
              const acc = accounts.find((a) => a.id === r.accountId)
              return (
                <View
                  key={r.id}
                  className={styles.reminderItem}
                  onClick={() => handleReminderClick(r.id)}
                >
                  <Text className={styles.reminderText}>{r.message}</Text>
                  <View
                    className={`${styles.reminderBadge} ${r.type === 'overdue' ? styles.badgeOverdue : styles.badgeSoon}`}
                  >
                    {r.type === 'overdue' ? '已逾期' : '即将到期'}
                  </View>
                </View>
              )
            })}
          </View>
        </View>
      )}

      <View className={styles.content}>
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>我的信用卡</Text>
          {creditAccounts.length > 0 ? (
            <View className={styles.cardList}>
              {creditAccounts.map((acc) => {
                const bills = getBillsByAccount(acc.id)
                const pendingBill = bills.find((b) => b.status === 'pending')
                const lateFee = pendingBill ? calculateLateFee(pendingBill.id) : 0
                return (
                  <View key={acc.id} className={styles.creditCard}>
                    <View className={styles.cardTop}>
                      <View>
                        <Text className={styles.cardName}>{acc.name}</Text>
                        <Text className={styles.cardBank}>信用额度 ¥{formatMoney(acc.creditLimit || 0)}</Text>
                      </View>
                      <Text className={styles.cardChip}>💳</Text>
                    </View>
                    <View className={styles.cardAmount}>
                      <Text className={styles.cardAmountLabel}>
                        {pendingBill ? '本期账单金额' : '当前欠款'}
                      </Text>
                      <Text className={styles.cardAmountValue}>
                        ¥{formatMoney(pendingBill?.totalAmount || Math.abs(acc.balance))}
                      </Text>
                    </View>
                    <View className={styles.cardBottom}>
                      <Text>账单日 {acc.billingDay}日</Text>
                      <Text>还款日 {acc.repaymentDay}日</Text>
                      {lateFee > 0 && <Text style={{ color: '#fca5a5' }}>滞纳金 ¥{formatMoney(lateFee)}</Text>}
                    </View>
                    <View className={styles.cardActions}>
                      <View className={styles.actionBtn} onClick={() => handleCardAction(acc.id)}>
                        <Text>账单操作</Text>
                      </View>
                      <View className={styles.actionBtn} onClick={() => handleMarkPaid(acc.id)}>
                        <Text>标记还款</Text>
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          ) : (
            <View className={styles.empty}>暂无信用卡，点击右下角添加</View>
          )}
        </View>

        <View className={styles.parseCard}>
          <Text className={styles.parseTitle}>📋 账单解析导入</Text>
          <Text className={styles.parseDesc}>
            粘贴银行发送的信用卡账单短信或邮件内容，系统将自动解析并导入交易明细。
          </Text>
          <Textarea
            className={styles.parseTextarea}
            placeholder="粘贴账单内容..."
            value={parseText}
            onInput={(e) => setParseText(e.detail.value)}
          />
          <View className={styles.parseSubmit} onClick={handleParseBill}>
            <Text>解析并导入</Text>
          </View>
        </View>
      </View>

      <View className={styles.fab} onClick={handleAddCard}>
        <Text>+</Text>
      </View>
    </View>
  )
}

export default CreditPage
