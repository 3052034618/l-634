import React, { useState, useMemo } from 'react'
import { View, Text, Input, Picker, useDidShow, navigateBack, showToast } from '@tarojs/components'
import { useAccountStore } from '@/store/accountStore'
import { useTransactionStore } from '@/store/transactionStore'
import dayjs from 'dayjs'
import styles from './index.module.scss'

const TransferPage: React.FC = () => {
  const accounts = useAccountStore((s) => s.accounts)
  const loadAccounts = useAccountStore((s) => s.loadAccounts)
  const addTransfer = useTransactionStore((s) => s.addTransfer)

  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [note, setNote] = useState('')

  useDidShow(() => {
    loadAccounts()
    if (accounts.length >= 2) {
      if (!fromAccountId) setFromAccountId(accounts[0].id)
      if (!toAccountId) setToAccountId(accounts[1]?.id || accounts[0].id)
    }
  })

  const fromAccount = useMemo(() => accounts.find((a) => a.id === fromAccountId), [accounts, fromAccountId])
  const toAccount = useMemo(() => accounts.find((a) => a.id === toAccountId), [accounts, toAccountId])

  const fromIndex = accounts.findIndex((a) => a.id === fromAccountId)
  const toIndex = accounts.findIndex((a) => a.id === toAccountId)
  const accountOptions = accounts.map((a) => `${a.icon} ${a.name} 余额¥${a.balance.toFixed(2)}`)

  const handleSubmit = () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }
    if (!fromAccountId || !toAccountId) {
      showToast({ title: '请选择转出和转入账户', icon: 'none' })
      return
    }
    if (fromAccountId === toAccountId) {
      showToast({ title: '转出和转入账户不能相同', icon: 'none' })
      return
    }
    if (fromAccount && fromAccount.balance < amt) {
      showToast({ title: `${fromAccount.name}余额不足`, icon: 'none' })
      return
    }

    try {
      addTransfer({
        fromAccountId,
        toAccountId,
        amount: amt,
        date,
        note: note.trim() || undefined
      })
      showToast({ title: '转账成功', icon: 'success' })
      setTimeout(() => navigateBack(), 500)
    } catch (e: any) {
      showToast({ title: e.message || '转账失败', icon: 'none' })
    }
  }

  const handleSwap = () => {
    const tmp = fromAccountId
    setFromAccountId(toAccountId)
    setToAccountId(tmp)
  }

  if (accounts.length < 2) {
    return (
      <View className="pageContainer">
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🏦</Text>
          <Text className={styles.emptyText}>至少需要2个账户才能使用转账功能</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="pageContainer">
      <View className={styles.card}>
        <View className={styles.row}>
          <Text className={styles.label}>转出账户</Text>
          <Picker
            mode="selector"
            range={accountOptions}
            value={fromIndex >= 0 ? fromIndex : 0}
            onChange={(e: any) => setFromAccountId(accounts[e.detail.value].id)}
          >
            <View className={styles.pickerValue}>
              <Text className={styles.accountIcon}>{fromAccount?.icon || '💳'}</Text>
              <View className={styles.accountInfo}>
                <Text className={styles.accountName}>{fromAccount?.name || '请选择'}</Text>
                <Text className={styles.accountBalance}>余额 ¥{fromAccount?.balance?.toFixed(2) || '0.00'}</Text>
              </View>
              <Text className={styles.pickerArrow}>›</Text>
            </View>
          </Picker>
        </View>

        <View className={styles.swapRow} onClick={handleSwap}>
          <View className={styles.swapBtn}>
            <Text>⇅ 交换</Text>
          </View>
        </View>

        <View className={styles.row}>
          <Text className={styles.label}>转入账户</Text>
          <Picker
            mode="selector"
            range={accountOptions}
            value={toIndex >= 0 ? toIndex : 1}
            onChange={(e: any) => setToAccountId(accounts[e.detail.value].id)}
          >
            <View className={styles.pickerValue}>
              <Text className={styles.accountIcon}>{toAccount?.icon || '💳'}</Text>
              <View className={styles.accountInfo}>
                <Text className={styles.accountName}>{toAccount?.name || '请选择'}</Text>
                <Text className={styles.accountBalance}>余额 ¥{toAccount?.balance?.toFixed(2) || '0.00'}</Text>
              </View>
              <Text className={styles.pickerArrow}>›</Text>
            </View>
          </Picker>
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.row}>
          <Text className={styles.label}>转账金额</Text>
          <View className={styles.amountInputWrap}>
            <Text className={styles.amountPrefix}>¥</Text>
            <Input
              className={styles.amountInput}
              type="digit"
              placeholder="0.00"
              value={amount}
              onInput={(e) => setAmount(e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.row}>
          <Text className={styles.label}>转账日期</Text>
          <Picker mode="date" value={date} onChange={(e: any) => setDate(e.detail.value)}>
            <View className={styles.pickerValue}>
              <Text>{date}</Text>
              <Text className={styles.pickerArrow}>›</Text>
            </View>
          </Picker>
        </View>

        <View className={styles.row}>
          <Text className={styles.label}>备注</Text>
          <Input
            className={styles.textInput}
            placeholder="可选，如：还信用卡、日常备用"
            value={note}
            onInput={(e) => setNote(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.confirmBtn} onClick={handleSubmit}>
        <Text>确认转账</Text>
      </View>
    </View>
  )
}

export default TransferPage
