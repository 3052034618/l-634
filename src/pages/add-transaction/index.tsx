import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, Input, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import CategoryTag from '@/components/CategoryTag'
import { useTransactionStore } from '@/store/transactionStore'
import { useAccountStore } from '@/store/accountStore'
import { useAppStore } from '@/store/appStore'
import { classifyTransaction } from '@/utils/classifier'
import { formatMoney } from '@/utils/format'
import type { TransactionType, TransactionAttachment } from '@/types'
import { generateId } from '@/utils/id'
import dayjs from 'dayjs'

const AddTransactionPage: React.FC = () => {
  const router = useRouter()
  const addTransaction = useTransactionStore((s) => s.addTransaction)
  const accounts = useAccountStore((s) => s.accounts)
  const getCategoriesByType = useAppStore((s) => s.getCategoriesByType)
  const categories = useAppStore((s) => s.categories)

  const [type, setType] = useState<TransactionType>((router.params.type as TransactionType) || 'expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [merchant, setMerchant] = useState('')
  const [note, setNote] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [attachments, setAttachments] = useState<TransactionAttachment[]>([])
  const [autoClassified, setAutoClassified] = useState(false)

  const typeCategories = useMemo(() => getCategoriesByType(type), [getCategoriesByType, type])

  useEffect(() => {
    if (!categoryId && typeCategories.length > 0) {
      setCategoryId(typeCategories[0].id)
      setCategoryName(typeCategories[0].name)
    }
  }, [type, typeCategories])

  useEffect(() => {
    if (description || merchant) {
      const result = classifyTransaction(description, merchant, categories)
      if (result.isAuto && result.categoryId) {
        const targetCat = categories.find((c) => c.id === result.categoryId && c.type === type)
        if (targetCat) {
          setCategoryId(targetCat.id)
          setCategoryName(targetCat.name)
          setAutoClassified(true)
        }
      }
    }
  }, [description, merchant, categories, type])

  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 3 - attachments.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })
      const newAttachments: TransactionAttachment[] = res.tempFilePaths.map((path, i) => ({
        id: generateId(),
        name: `发票_${Date.now()}_${i}`,
        path,
        size: 0,
        type: 'image',
        uploadedAt: dayjs().toISOString()
      }))
      setAttachments([...attachments, ...newAttachments])
    } catch (e) {
      console.error('[AddTx] Choose image error:', e)
    }
  }

  const handleSubmit = () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      Taro.showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }
    if (!accountId) {
      Taro.showToast({ title: '请选择账户', icon: 'none' })
      return
    }
    if (!description && !merchant) {
      Taro.showToast({ title: '请输入描述或商户', icon: 'none' })
      return
    }

    try {
      addTransaction({
        type,
        amount: numAmount,
        accountId,
        categoryId,
        categoryName,
        description: description || merchant || categoryName,
        merchant: merchant || undefined,
        note: note || undefined,
        attachments,
        date
      })
      Taro.showToast({ title: '记录成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 500)
    } catch (e) {
      console.error('[AddTx] Submit error:', e)
      Taro.showToast({ title: '记录失败', icon: 'none' })
    }
  }

  const accountOptions = accounts.map((a) => `${a.name} (${formatMoney(a.balance)})`)

  return (
    <View className="pageContainer" style={{ paddingBottom: 180 }}>
      <View className={styles.typeTabs}>
        <View
          className={classnames(styles.typeTab, type === 'expense' && styles.expenseActive)}
          onClick={() => { setType('expense'); setCategoryId(''); setAutoClassified(false) }}
        >支出</View>
        <View
          className={classnames(styles.typeTab, type === 'income' && styles.incomeActive)}
          onClick={() => { setType('income'); setCategoryId(''); setAutoClassified(false) }}
        >收入</View>
      </View>

      <View className={styles.amountSection}>
        <Text className={styles.amountLabel}>金额（元）</Text>
        <Input
          className={styles.amountInput}
          type="digit"
          placeholder="0.00"
          value={amount}
          onInput={(e) => setAmount(e.detail.value)}
          focus
        />
      </View>

      <Text className={styles.sectionTitle}>选择分类</Text>
      <View className={styles.categoryGrid}>
        {typeCategories.map((c) => (
          <CategoryTag
            key={c.id}
            icon={c.icon}
            name={c.name}
            color={c.color}
            active={categoryId === c.id}
            onClick={() => {
              setCategoryId(c.id)
              setCategoryName(c.name)
              setAutoClassified(false)
            }}
          />
        ))}
      </View>
      {autoClassified && (
        <View>
          <Text className={styles.autoTag}>🤖 智能分类</Text>
        </View>
      )}

      <Picker
        mode="selector"
        range={accountOptions}
        value={accounts.findIndex((a) => a.id === accountId)}
        onChange={(e) => setAccountId(accounts[parseInt(e.detail.value)].id)}
      >
        <View className={styles.fieldRow}>
          <Text className={styles.fieldLabel}>账户</Text>
          <Text className={styles.fieldValue}>
            {accounts.find((a) => a.id === accountId)?.name || '请选择'}
          </Text>
          <Text className={styles.fieldArrow}>›</Text>
        </View>
      </Picker>

      <Picker
        mode="date"
        value={date}
        onChange={(e) => setDate(e.detail.value)}
      >
        <View className={styles.fieldRow}>
          <Text className={styles.fieldLabel}>日期</Text>
          <Text className={styles.fieldValue}>{date}</Text>
          <Text className={styles.fieldArrow}>›</Text>
        </View>
      </Picker>

      <View className={styles.fieldRow}>
        <Text className={styles.fieldLabel}>商户</Text>
        <Input
          className={styles.fieldInput}
          placeholder="如：星巴克、美团"
          value={merchant}
          onInput={(e) => setMerchant(e.detail.value)}
        />
      </View>

      <View className={styles.fieldRow}>
        <Text className={styles.fieldLabel}>描述</Text>
        <Input
          className={styles.fieldInput}
          placeholder="交易描述"
          value={description}
          onInput={(e) => setDescription(e.detail.value)}
        />
      </View>

      <View className={styles.fieldRow}>
        <Text className={styles.fieldLabel}>备注</Text>
        <Input
          className={styles.fieldInput}
          placeholder="可选备注信息"
          value={note}
          onInput={(e) => setNote(e.detail.value)}
        />
      </View>

      <View className={styles.attachmentSection}>
        <Text className={styles.sectionTitle} style={{ margin: 0 }}>📎 发票/附件</Text>
        <View className={styles.attachments}>
          {attachments.map((att) => (
            <View key={att.id} className={styles.attachmentItem}>
              <Text className={styles.attachmentIcon}>🖼️</Text>
            </View>
          ))}
          {attachments.length < 3 && (
            <View className={classnames(styles.attachmentItem, styles.addAttachment)} onClick={handleChooseImage}>
              <Text className={styles.attachmentIcon}>＋</Text>
              <Text className={styles.attachmentText}>添加</Text>
            </View>
          )}
        </View>
      </View>

      <View className={classnames(styles.submitBtn, type === 'expense' && styles.expense)} onClick={handleSubmit}>
        保存记录
      </View>
    </View>
  )
}

export default AddTransactionPage
