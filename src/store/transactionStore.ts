import { create } from 'zustand'
import dayjs from 'dayjs'
import type { Transaction, TransactionAttachment, TransactionType } from '@/types'
import { mockTransactions } from '@/data/mockData'
import { getStorageSync, setStorageSync } from '@/utils/storage'
import { generateId } from '@/utils/id'
import { classifyTransaction, learnClassification } from '@/utils/classifier'
import { isSameMonth } from '@/utils/format'
import { useAccountStore } from './accountStore'
import { useAppStore } from './appStore'
import { useBudgetStore } from './budgetStore'

const TX_KEY = 'transactions'

interface TransactionState {
  transactions: Transaction[]
  loaded: boolean
  loadTransactions: () => void
  addTransaction: (data: {
    type: TransactionType
    amount: number
    accountId: string
    categoryId?: string
    categoryName?: string
    description: string
    merchant?: string
    note?: string
    attachments?: TransactionAttachment[]
    date?: string
  }) => Transaction
  addTransfer: (data: {
    fromAccountId: string
    toAccountId: string
    amount: number
    date?: string
    note?: string
  }) => Transaction
  updateTransaction: (id: string, data: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  getTransactionById: (id: string) => Transaction | undefined
  getMonthTransactions: (monthKey: string) => Transaction[]
  getMonthSummary: (monthKey: string) => {
    totalIncome: number
    totalExpense: number
    netIncome: number
    byCategory: Map<string, { name: string; amount: number; type: TransactionType }>
  }
  getCategorySpending: (monthKey: string, categoryId: string) => number
  predictNextMonth: () => { predicted: number; trend: 'up' | 'down' | 'stable'; suggestion: string }
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  loaded: false,

  loadTransactions: () => {
    const stored = getStorageSync<Transaction[]>(TX_KEY)
    if (stored && stored.length > 0) {
      set({ transactions: stored, loaded: true })
    } else {
      setStorageSync(TX_KEY, mockTransactions)
      set({ transactions: mockTransactions, loaded: true })
    }
    console.log('[TransactionStore] Loaded', get().transactions.length, 'transactions')
  },

  addTransaction: (data) => {
    const categories = useAppStore.getState().categories
    let categoryId = data.categoryId
    let categoryName = data.categoryName
    let isAuto = false

    if (!categoryId) {
      const result = classifyTransaction(data.description, data.merchant, categories)
      categoryId = result.categoryId
      categoryName = result.categoryName
      isAuto = result.isAuto
    } else {
      const cat = categories.find((c) => c.id === categoryId)
      if (cat) {
        categoryName = cat.name
        learnClassification(data.description, data.merchant, categoryId, categoryName)
      }
    }

    const newTx: Transaction = {
      id: generateId(),
      type: data.type,
      amount: data.amount,
      accountId: data.accountId,
      categoryId: categoryId || '',
      categoryName: categoryName || '未分类',
      description: data.description,
      merchant: data.merchant,
      note: data.note,
      attachments: data.attachments || [],
      date: data.date || dayjs().format('YYYY-MM-DD'),
      createdAt: dayjs().toISOString(),
      updatedAt: dayjs().toISOString(),
      isAutoClassified: isAuto
    }

    const accountStore = useAccountStore.getState()
    if (data.type !== 'transfer') {
      accountStore.adjustBalance(data.accountId, data.amount, data.type === 'income', {
        log: true,
        relatedTransactionId: newTx.id,
        reason: 'add_transaction',
        description: `${data.type === 'income' ? '新增收入' : '新增支出'} ¥${data.amount.toFixed(2)} - ${categoryName || '未分类'}`
      })
    }

    const updated = [newTx, ...get().transactions].sort(
      (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
    )
    setStorageSync(TX_KEY, updated)
    set({ transactions: updated })
    console.log('[TransactionStore] Added transaction:', newTx.id)

    if (data.type === 'expense') {
      setTimeout(() => {
        useBudgetStore.getState().checkBudgetAlerts()
      }, 100)
    }

    return newTx
  },

  addTransfer: (data) => {
    const accountStore = useAccountStore.getState()
    const fromAcc = accountStore.getAccountById(data.fromAccountId)
    const toAcc = accountStore.getAccountById(data.toAccountId)

    if (!fromAcc || !toAcc) {
      throw new Error('账户不存在')
    }
    if (data.fromAccountId === data.toAccountId) {
      throw new Error('转出和转入账户不能相同')
    }
    if (data.amount <= 0) {
      throw new Error('转账金额必须大于0')
    }

    const txId = generateId()
    const transferDate = data.date || dayjs().format('YYYY-MM-DD')
    const noteText = data.note ? `（${data.note}）` : ''

    // 第一步：从转出账户扣钱
    accountStore.adjustBalance(data.fromAccountId, data.amount, false, {
      log: true,
      relatedTransactionId: txId,
      reason: 'transfer_out',
      description: `转账到${toAcc.name} ¥${data.amount.toFixed(2)}${noteText}`
    })

    // 第二步：给转入账户加钱
    accountStore.adjustBalance(data.toAccountId, data.amount, true, {
      log: true,
      relatedTransactionId: txId,
      reason: 'transfer_in',
      description: `从${fromAcc.name}转入 ¥${data.amount.toFixed(2)}${noteText}`
    })

    // 第三步：生成一条transfer类型交易（只存转出账户视角，带transferToAccountId）
    const transferTx: Transaction = {
      id: txId,
      type: 'transfer',
      amount: data.amount,
      accountId: data.fromAccountId,
      transferToAccountId: data.toAccountId,
      categoryId: '_transfer',
      categoryName: '账户转账',
      description: `${fromAcc.name} → ${toAcc.name}`,
      note: data.note,
      attachments: [],
      date: transferDate,
      createdAt: dayjs().toISOString(),
      updatedAt: dayjs().toISOString(),
      isAutoClassified: false
    }

    const updated = [transferTx, ...get().transactions].sort(
      (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
    )
    setStorageSync(TX_KEY, updated)
    set({ transactions: updated })
    console.log('[TransactionStore] Added transfer:', txId, 'from', fromAcc.name, 'to', toAcc.name)

    return transferTx
  },

  updateTransaction: (id, data) => {
    const tx = get().getTransactionById(id)
    if (!tx) return

    if (data.categoryId && data.categoryId !== tx.categoryId) {
      const categories = useAppStore.getState().categories
      const cat = categories.find((c) => c.id === data.categoryId)
      if (cat) {
        learnClassification(tx.description, tx.merchant, cat.id, cat.name)
        data.categoryName = cat.name
        data.adjusted = true
      }
    }

    const accountStore = useAccountStore.getState()
    const oldAccountId = tx.accountId
    const oldAmount = tx.amount
    const oldType = tx.type

    const newAccountId = data.accountId || oldAccountId
    const newAmount = data.amount !== undefined ? data.amount : oldAmount
    const newType = data.type || oldType

    const accountChanged = newAccountId !== oldAccountId
    const amountChanged = newAmount !== oldAmount
    const typeChanged = newType !== oldType

    if (accountChanged || amountChanged || typeChanged) {
      // 撤销旧交易对旧账户的影响（仅非transfer类型需要记账）
      if (oldType !== 'transfer') {
        accountStore.adjustBalance(oldAccountId, oldAmount, oldType === 'expense', {
          log: true,
          relatedTransactionId: id,
          reason: 'update_transaction',
          description: `[撤销旧] ${oldType === 'income' ? '收入' : '支出'} ¥${oldAmount.toFixed(2)}`
        })
      }

      // 应用新交易对新账户的影响（仅非transfer类型需要记账）
      if (newType !== 'transfer') {
        accountStore.adjustBalance(newAccountId, newAmount, newType === 'income', {
          log: true,
          relatedTransactionId: id,
          reason: 'update_transaction',
          description: `[应用新] ${newType === 'income' ? '收入' : '支出'} ¥${newAmount.toFixed(2)}`
        })
      }
    }

    const updated = get().transactions.map((t) =>
      t.id === id ? { ...t, ...data, updatedAt: dayjs().toISOString() } : t
    )
    setStorageSync(TX_KEY, updated)
    set({ transactions: updated })

    const finalType = data.type || tx.type
    if (finalType === 'expense') {
      setTimeout(() => {
        useBudgetStore.getState().checkBudgetAlerts()
      }, 100)
    }
  },

  deleteTransaction: (id) => {
    const tx = get().getTransactionById(id)
    if (tx && tx.type !== 'transfer') {
      const accountStore = useAccountStore.getState()
      accountStore.adjustBalance(tx.accountId, tx.amount, tx.type !== 'income', {
        log: true,
        relatedTransactionId: id,
        reason: 'delete_transaction',
        description: `删除${tx.type === 'income' ? '收入' : '支出'} ¥${tx.amount.toFixed(2)}`
      })
    }
    const updated = get().transactions.filter((t) => t.id !== id)
    setStorageSync(TX_KEY, updated)
    set({ transactions: updated })

    if (tx?.type === 'expense') {
      setTimeout(() => {
        useBudgetStore.getState().checkBudgetAlerts()
      }, 100)
    }
  },

  getTransactionById: (id) => get().transactions.find((t) => t.id === id),

  getMonthTransactions: (monthKey) => {
    return get().transactions.filter((t) => isSameMonth(t.date, monthKey + '-01'))
  },

  getMonthSummary: (monthKey) => {
    const monthTxs = get().getMonthTransactions(monthKey)
    const byCategory = new Map<string, { name: string; amount: number; type: TransactionType }>()
    let totalIncome = 0
    let totalExpense = 0

    monthTxs.forEach((tx) => {
      // 转账不计入收支汇总和预算
      if (tx.type === 'transfer') return

      if (tx.type === 'income') totalIncome += tx.amount
      else if (tx.type === 'expense') totalExpense += tx.amount

      const existing = byCategory.get(tx.categoryId)
      if (existing) {
        existing.amount += tx.amount
      } else {
        byCategory.set(tx.categoryId, {
          name: tx.categoryName,
          amount: tx.amount,
          type: tx.type
        })
      }
    })

    return {
      totalIncome,
      totalExpense,
      netIncome: totalIncome - totalExpense,
      byCategory
    }
  },

  getCategorySpending: (monthKey, categoryId) => {
    return get()
      .getMonthTransactions(monthKey)
      .filter((t) => t.categoryId === categoryId && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  },

  predictNextMonth: () => {
    const now = dayjs()
    const last3Months: number[] = []

    for (let i = 1; i <= 3; i++) {
      const monthKey = now.subtract(i, 'month').format('YYYY-MM')
      const summary = get().getMonthSummary(monthKey)
      last3Months.push(summary.totalExpense)
    }

    const validMonths = last3Months.filter((v) => v > 0)
    if (validMonths.length === 0) {
      return {
        predicted: 5000,
        trend: 'stable',
        suggestion: '数据不足，建议先记录至少一个月的支出'
      }
    }

    const avg = validMonths.reduce((a, b) => a + b, 0) / validMonths.length
    let trend: 'up' | 'down' | 'stable' = 'stable'
    let suggestion = ''

    if (validMonths.length >= 2) {
      const latest = validMonths[0]
      const prev = validMonths[validMonths.length - 1]
      const diff = (latest - prev) / prev
      if (diff > 0.1) {
        trend = 'up'
        suggestion = '近月支出呈上升趋势，建议控制非必要消费'
      } else if (diff < -0.1) {
        trend = 'down'
        suggestion = '近月支出控制良好，继续保持'
      } else {
        suggestion = '支出水平稳定，按当前预算规划即可'
      }
    }

    return {
      predicted: Math.round(avg),
      trend,
      suggestion
    }
  }
}))
