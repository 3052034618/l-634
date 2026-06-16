import React, { useState } from 'react'
import { View, Text, Input, showToast, navigateBack } from '@tarojs/taro'
import { useAccountStore } from '@/store/accountStore'
import type { AccountType } from '@/types'
import styles from './index.module.scss'

const AddAccountPage: React.FC = () => {
  const addAccount = useAccountStore((s) => s.addAccount)
  const [type, setType] = useState<AccountType>('bank')
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [note, setNote] = useState('')
  const [creditLimit, setCreditLimit] = useState('10000')
  const [billingDay, setBillingDay] = useState('1')
  const [repaymentDay, setRepaymentDay] = useState('20')

  const handleSave = () => {
    if (!name.trim()) {
      showToast({ title: '请输入账户名称', icon: 'none' })
      return
    }
    const balanceNum = parseFloat(balance) || 0
    const account = addAccount({
      name: name.trim(),
      type,
      balance: balanceNum,
      note: note.trim() || undefined,
      ...(type === 'credit' && {
        creditLimit: parseFloat(creditLimit) || 10000,
        billingDay: parseInt(billingDay) || 1,
        repaymentDay: parseInt(repaymentDay) || 20
      })
    })
    showToast({ title: '添加成功', icon: 'success' })
    setTimeout(() => navigateBack(), 500)
  }

  const typeOptions: { type: AccountType; icon: string; name: string }[] = [
    { type: 'cash', icon: '💵', name: '现金' },
    { type: 'bank', icon: '🏦', name: '银行卡' },
    { type: 'credit', icon: '💳', name: '信用卡' }
  ]

  return (
    <View className={styles.page}>
      <View className={styles.typeSection}>
        <Text className={styles.sectionTitle}>账户类型</Text>
        <View className={styles.typeOptions}>
          {typeOptions.map((opt) => (
            <View
              key={opt.type}
              className={`${styles.typeOption} ${type === opt.type ? styles.typeOptionActive : ''}`}
              onClick={() => setType(opt.type)}
            >
              <Text className={styles.typeIcon}>{opt.icon}</Text>
              <Text className={styles.typeName}>{opt.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.formCard}>
        <View className={styles.formRow}>
          <Text className={styles.formLabel}>账户名称</Text>
          <Input
            className={styles.formInput}
            placeholder="请输入名称"
            value={name}
            onInput={(e) => setName(e.detail.value)}
          />
        </View>
        <View className={styles.formRow}>
          <Text className={styles.formLabel}>
            {type === 'credit' ? '当前欠款' : '初始余额'}
          </Text>
          <Input
            className={styles.formInput}
            type="digit"
            placeholder="0.00"
            value={balance}
            onInput={(e) => setBalance(e.detail.value)}
          />
        </View>
        <View className={styles.formRow}>
          <Text className={styles.formLabel}>备注</Text>
          <Input
            className={styles.formInput}
            placeholder="选填"
            value={note}
            onInput={(e) => setNote(e.detail.value)}
          />
        </View>
      </View>

      {type === 'credit' && (
        <View className={styles.creditFields}>
          <View className={styles.formRow}>
            <Text className={styles.formLabel}>信用额度</Text>
            <Input
              className={styles.formInput}
              type="digit"
              placeholder="10000"
              value={creditLimit}
              onInput={(e) => setCreditLimit(e.detail.value)}
            />
          </View>
          <View className={styles.formRow}>
            <Text className={styles.formLabel}>账单日</Text>
            <Input
              className={styles.formInput}
              type="number"
              placeholder="1-31"
              value={billingDay}
              onInput={(e) => setBillingDay(e.detail.value)}
            />
          </View>
          <View className={styles.formRow}>
            <Text className={styles.formLabel}>还款日</Text>
            <Input
              className={styles.formInput}
              type="number"
              placeholder="1-31"
              value={repaymentDay}
              onInput={(e) => setRepaymentDay(e.detail.value)}
            />
          </View>
        </View>
      )}

      <View className={styles.bottomBar}>
        <View className={styles.saveBtn} onClick={handleSave}>
          <Text>保存账户</Text>
        </View>
      </View>
    </View>
  )
}

export default AddAccountPage
