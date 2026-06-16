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
    accountStore.adjustBalance(data.accountId, data.amount, data.type === 'income')

    const updated = [newTx, ...get().transactions].sort(
      (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
    )
    setStorageSync(TX_KEY, updated)
    set({ transactions: updated })
    console.log('[TransactionStore] Added transaction:', newTx.id)
    return newTx
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

    if (data.amount !== undefined && (data.amount !== tx.amount || data.type !== tx.type)) {
      const accountStore = useAccountStore.getState()
      accountStore.adjustBalance(tx.accountId, tx.amount, tx.type !== 'income')
      const newAccountId = data.accountId || tx.accountId
      const newType = data.type || tx.type
      const newAmount = data.amount || tx.amount
      accountStore.adjustBalance(newAccountId, newAmount, newType === 'income')
    }

    const updated = get().transactions.map((t) =>
      t.id === id ? { ...t, ...data, updatedAt: dayjs().toISOString() } : t
    )
    setStorageSync(TX_KEY, updated)
    set({ transactions: updated })
  },

  deleteTransaction: (id) => {
    const tx = get().getTransactionById(id)
    if (tx) {
      const accountStore = useAccountStore.getState()
      accountStore.adjustBalance(tx.accountId, tx.amount, tx.type !== 'income')
    }
    const updated = get().transactions.filter((t) => t.id !== id)
    setStorageSync(TX_KEY, updated)
    set({ transactions: updated })
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
      if (tx.type === 'income') totalIncome += tx.amount
      else totalExpense += tx.amount

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
