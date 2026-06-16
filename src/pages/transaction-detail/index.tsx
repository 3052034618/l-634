import React, { useState, useMemo } from 'react'
import { View, Text, Input, Picker, useDidShow, useRouter, navigateBack, showModal, showToast } from '@tarojs/taro'
import { useTransactionStore } from '@/store/transactionStore'
import { useAccountStore } from '@/store/accountStore'
import { useAppStore } from '@/store/appStore'
import { useBudgetStore } from '@/store/budgetStore'
import { formatMoney, formatDateTime, getMonthKey } from '@/utils/format'
import dayjs from 'dayjs'
import type { TransactionType } from '@/types'
import styles from './index.module.scss'

const TransactionDetailPage: React.FC = () => {
  const router = useRouter()
  const id = router.params.id as string

  const getTransactionById = useTransactionStore((s) => s.getTransactionById)
  const updateTransaction = useTransactionStore((s) => s.updateTransaction)
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction)

  const getAccountById = useAccountStore((s) => s.getAccountById)
  const accounts = useAccountStore((s) => s.accounts)
  const loadAccounts = useAccountStore((s) => s.loadAccounts)

  const categories = useAppStore((s) => s.categories)
  const loadCategories = useAppStore((s) => s.initApp)

  const checkBudgetAlerts = useBudgetStore((s) => s.checkBudgetAlerts)
  const loadBudgets = useBudgetStore((s) => s.loadBudgets)

  const [isEditing, setIsEditing] = useState(false)
  const [editAmount, setEditAmount] = useState('')
  const [editAccountId, setEditAccountId] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editMerchant, setEditMerchant] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editType, setEditType] = useState<TransactionType>('expense')

  const transaction = useMemo(() => getTransactionById(id), [id, getTransactionById])

  useDidShow(() => {
    loadCategories()
    loadAccounts()
    loadBudgets()
    if (!transaction) {
      showToast({ title: '交易不存在', icon: 'none' })
      setTimeout(() => navigateBack(), 1000)
    }
  })

  if (!transaction) return null

  const account = getAccountById(transaction.accountId)
  const category = categories.find((c) => c.id === transaction.categoryId)
  const editCategory = categories.find((c) => c.id === editCategoryId)

  const accountOptions = accounts.map((a) => `${a.icon} ${a.name}`)
  const categoryOptions = categories
    .filter((c) => c.type === editType)
    .map((c) => `${c.icon} ${c.name}`)
  const categoryIds = categories.filter((c) => c.type === editType).map((c) => c.id)

  const handleEnterEdit = () => {
    setEditAmount(transaction.amount.toString())
    setEditAccountId(transaction.accountId)
    setEditCategoryId(transaction.categoryId)
    setEditDate(transaction.date)
    setEditMerchant(transaction.merchant || '')
    setEditNote(transaction.note || '')
    setEditType(transaction.type)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleSaveEdit = () => {
    const amount = parseFloat(editAmount)
    if (!amount || amount <= 0) {
      showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }
    if (!editAccountId) {
      showToast({ title: '请选择账户', icon: 'none' })
      return
    }
    if (!editCategoryId) {
      showToast({ title: '请选择分类', icon: 'none' })
      return
    }
    if (!editDate) {
      showToast({ title: '请选择日期', icon: 'none' })
      return
    }

    const categoryName = categories.find((c) => c.id === editCategoryId)?.name || ''

    updateTransaction(transaction.id, {
      amount,
      accountId: editAccountId,
      categoryId: editCategoryId,
      categoryName,
      date: editDate,
      merchant: editMerchant.trim() || undefined,
      note: editNote.trim() || undefined,
      type: editType
    })

    setTimeout(() => {
      checkBudgetAlerts()
    }, 200)

    setIsEditing(false)
    showToast({ title: '保存成功', icon: 'success' })
  }

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

  const handleAccountChange = (e: any) => {
    const idx = e.detail.value
    setEditAccountId(accounts[idx].id)
  }

  const handleCategoryChange = (e: any) => {
    const idx = e.detail.value
    setEditCategoryId(categoryIds[idx])
  }

  const handleDateChange = (e: any) => {
    setEditDate(e.detail.value)
  }

  const accountIndex = accounts.findIndex((a) => a.id === editAccountId)
  const categoryIndex = categoryIds.findIndex((c) => c === editCategoryId)

  const displayTransaction = isEditing
    ? {
        ...transaction,
        amount: parseFloat(editAmount) || transaction.amount,
        accountId: editAccountId || transaction.accountId,
        categoryId: editCategoryId || transaction.categoryId,
        categoryName: editCategory?.name || transaction.categoryName,
        date: editDate || transaction.date,
        merchant: editMerchant,
        note: editNote,
        type: editType
      }
    : transaction

  const displayAccount = getAccountById(displayTransaction.accountId)
  const displayCategory = categories.find((c) => c.id === displayTransaction.categoryId)

  return (
    <View className={styles.page}>
      <View className={`${styles.amountHeader} ${displayTransaction.type === 'income' ? styles.headerIncome : styles.headerExpense}`}>
        <Text className={styles.amountLabel}>
          {displayTransaction.type === 'income' ? '收入金额' : '支出金额'}
        </Text>
        {isEditing ? (
          <View className={styles.editAmountWrap}>
            <Text className={styles.editAmountSign}>
              {displayTransaction.type === 'income' ? '+' : '-'}
            </Text>
            <Text className={styles.editAmountCurrency}>¥</Text>
            <Input
              className={styles.editAmountInput}
              type="digit"
              value={editAmount}
              onInput={(e) => setEditAmount(e.detail.value)}
              autoFocus
            />
          </View>
        ) : (
          <Text className={styles.amountValue}>
            {displayTransaction.type === 'income' ? '+' : '-'}¥{formatMoney(displayTransaction.amount)}
          </Text>
        )}
      </View>

      <View className={styles.infoCard}>
        {isEditing && (
          <View className={styles.editTypeRow}>
            <View
              className={`${styles.editTypeBtn} ${editType === 'expense' ? styles.editTypeExpense : ''}`}
              onClick={() => {
                setEditType('expense')
                const expenseCat = categories.find((c) => c.type === 'expense')
                if (expenseCat) setEditCategoryId(expenseCat.id)
              }}
            >
              <Text>支出</Text>
            </View>
            <View
              className={`${styles.editTypeBtn} ${editType === 'income' ? styles.editTypeIncome : ''}`}
              onClick={() => {
                setEditType('income')
                const incomeCat = categories.find((c) => c.type === 'income')
                if (incomeCat) setEditCategoryId(incomeCat.id)
              }}
            >
              <Text>收入</Text>
            </View>
          </View>
        )}

        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>分类</Text>
          {isEditing ? (
            <Picker
              mode="selector"
              range={categoryOptions}
              value={categoryIndex >= 0 ? categoryIndex : 0}
              onChange={handleCategoryChange}
            >
              <View className={styles.pickerValue}>
                {editCategory?.icon} {editCategory?.name || '请选择'}
                <Text className={styles.pickerArrow}>›</Text>
              </View>
            </Picker>
          ) : (
            <View className={styles.infoValueWrap}>
              <View className={styles.categoryTag}>
                <Text>{displayCategory?.icon || '📊'}</Text>
                <Text>{displayTransaction.categoryName}</Text>
              </View>
              {displayTransaction.isAutoClassified && !displayTransaction.adjusted && (
                <View className={styles.autoTag}>
                  <Text>🤖</Text>
                  <Text>智能分类</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>账户</Text>
          {isEditing ? (
            <Picker
              mode="selector"
              range={accountOptions}
              value={accountIndex >= 0 ? accountIndex : 0}
              onChange={handleAccountChange}
            >
              <View className={styles.pickerValue}>
                {displayAccount?.icon} {displayAccount?.name || '请选择'}
                <Text className={styles.pickerArrow}>›</Text>
              </View>
            </Picker>
          ) : (
            <Text className={styles.infoValue}>
              {displayAccount?.icon} {displayAccount?.name || '未知账户'}
            </Text>
          )}
        </View>

        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>日期</Text>
          {isEditing ? (
            <Picker mode="date" value={editDate} onChange={handleDateChange}>
              <View className={styles.pickerValue}>
                {editDate || '请选择'}
                <Text className={styles.pickerArrow}>›</Text>
              </View>
            </Picker>
          ) : (
            <Text className={styles.infoValue}>{displayTransaction.date}</Text>
          )}
        </View>

        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>商户</Text>
          {isEditing ? (
            <Input
              className={styles.editInput}
              placeholder="请输入商户名称"
              value={editMerchant}
              onInput={(e) => setEditMerchant(e.detail.value)}
            />
          ) : (
            <Text className={styles.infoValue}>
              {displayTransaction.merchant || '未填写'}
            </Text>
          )}
        </View>

        {displayTransaction.description && !isEditing && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>描述</Text>
            <Text className={`${styles.infoValue} ${styles.infoValueMultiline}`}>
              {displayTransaction.description}
            </Text>
          </View>
        )}

        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>备注</Text>
          {isEditing ? (
            <Input
              className={styles.editInput}
              placeholder="请输入备注（可选）"
              value={editNote}
              onInput={(e) => setEditNote(e.detail.value)}
            />
          ) : (
            <Text className={`${styles.infoValue} ${styles.infoValueMultiline}`}>
              {displayTransaction.note || '未填写'}
            </Text>
          )}
        </View>

        {displayTransaction.attachments && displayTransaction.attachments.length > 0 && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>附件</Text>
            <View className={styles.attachments}>
              {displayTransaction.attachments.map((att, i) => (
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
        {isEditing ? (
          <>
            <View className={`${styles.btn} ${styles.btnCancel}`} onClick={handleCancelEdit}>
              <Text>取消</Text>
            </View>
            <View className={`${styles.btn} ${styles.btnSave}`} onClick={handleSaveEdit}>
              <Text>保存</Text>
            </View>
          </>
        ) : (
          <>
            <View className={`${styles.btn} ${styles.btnEdit}`} onClick={handleEnterEdit}>
              <Text>编辑</Text>
            </View>
            <View className={`${styles.btn} ${styles.btnDelete}`} onClick={handleDelete}>
              <Text>删除</Text>
            </View>
          </>
        )}
      </View>
    </View>
  )
}

export default TransactionDetailPage
