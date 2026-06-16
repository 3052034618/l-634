import { create } from 'zustand'
import dayjs from 'dayjs'
import type { Budget, BudgetAlert, BudgetCategory } from '@/types'
import { mockBudget } from '@/data/mockData'
import { getStorageSync, setStorageSync } from '@/utils/storage'
import { generateId } from '@/utils/id'
import { useTransactionStore } from './transactionStore'

const BUDGET_KEY = 'budgets'
const ALERT_KEY = 'budget_alerts'

interface BudgetState {
  budgets: Budget[]
  alerts: BudgetAlert[]
  loaded: boolean
  loadBudgets: () => void
  getCurrentBudget: () => Budget | undefined
  getBudgetByMonth: (month: string) => Budget | undefined
  setBudget: (month: string, totalLimit: number, categoryBudgets: BudgetCategory[]) => Budget
  checkBudgetAlerts: () => BudgetAlert[]
  markAlertRead: (id: string) => void
  getUnreadAlertCount: () => number
  getCategoryProgress: (month: string, categoryId: string) => {
    limit: number
    spent: number
    percent: number
    status: 'normal' | 'warning' | 'over'
  }
  getTotalProgress: (month: string) => {
    limit: number
    spent: number
    percent: number
    status: 'normal' | 'warning' | 'over'
  }
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  alerts: [],
  loaded: false,

  loadBudgets: () => {
    const storedBudgets = getStorageSync<Budget[]>(BUDGET_KEY)
    const storedAlerts = getStorageSync<BudgetAlert[]>(ALERT_KEY, [])
    if (storedBudgets && storedBudgets.length > 0) {
      set({ budgets: storedBudgets, alerts: storedAlerts || [], loaded: true })
    } else {
      setStorageSync(BUDGET_KEY, [mockBudget])
      setStorageSync(ALERT_KEY, [])
      set({ budgets: [mockBudget], alerts: [], loaded: true })
    }
    console.log('[BudgetStore] Loaded', get().budgets.length, 'budgets')
  },

  getCurrentBudget: () => {
    const currentMonth = dayjs().format('YYYY-MM')
    return get().budgets.find((b) => b.month === currentMonth)
  },

  getBudgetByMonth: (month) => get().budgets.find((b) => b.month === month),

  setBudget: (month, totalLimit, categoryBudgets) => {
    const existing = get().budgets.find((b) => b.month === month)
    let budget: Budget

    if (existing) {
      budget = {
        ...existing,
        totalLimit,
        categoryBudgets,
        updatedAt: dayjs().toISOString()
      }
      const updated = get().budgets.map((b) => (b.month === month ? budget : b))
      setStorageSync(BUDGET_KEY, updated)
      set({ budgets: updated })
    } else {
      budget = {
        id: generateId(),
        month,
        totalLimit,
        categoryBudgets,
        createdAt: dayjs().toISOString(),
        updatedAt: dayjs().toISOString()
      }
      const updated = [...get().budgets, budget]
      setStorageSync(BUDGET_KEY, updated)
      set({ budgets: updated })
    }
    return budget
  },

  checkBudgetAlerts: () => {
    const currentMonth = dayjs().format('YYYY-MM')
    const budget = get().getBudgetByMonth(currentMonth)
    if (!budget) return []

    const txStore = useTransactionStore.getState()
    const newAlerts: BudgetAlert[] = []
    const existingIds = new Set(get().alerts.map((a) => `${a.categoryId}_${a.type}`))

    budget.categoryBudgets.forEach((cb) => {
      const spent = txStore.getCategorySpending(currentMonth, cb.categoryId)
      const percent = spent / cb.limit
      const threshold = cb.warningThreshold || 0.8

      if (percent >= 1 && !existingIds.has(`${cb.categoryId}_overdue`)) {
        newAlerts.push({
          id: generateId(),
          type: 'overdue',
          categoryId: cb.categoryId,
          categoryName: cb.categoryName,
          message: `${cb.categoryName}支出已超支 ¥${(spent - cb.limit).toFixed(2)}！`,
          triggeredAt: dayjs().toISOString(),
          read: false
        })
      } else if (percent >= threshold && percent < 1 && !existingIds.has(`${cb.categoryId}_warning`)) {
        newAlerts.push({
          id: generateId(),
          type: 'warning',
          categoryId: cb.categoryId,
          categoryName: cb.categoryName,
          message: `${cb.categoryName}已使用预算的 ${(percent * 100).toFixed(0)}%，请注意控制`,
          triggeredAt: dayjs().toISOString(),
          read: false
        })
      }
    })

    if (newAlerts.length > 0) {
      const updated = [...newAlerts, ...get().alerts]
      setStorageSync(ALERT_KEY, updated)
      set({ alerts: updated })
    }

    return newAlerts
  },

  markAlertRead: (id) => {
    const updated = get().alerts.map((a) => (a.id === id ? { ...a, read: true } : a))
    setStorageSync(ALERT_KEY, updated)
    set({ alerts: updated })
  },

  getUnreadAlertCount: () => get().alerts.filter((a) => !a.read).length,

  getCategoryProgress: (month, categoryId) => {
    const budget = get().getBudgetByMonth(month)
    const cb = budget?.categoryBudgets.find((b) => b.categoryId === categoryId)
    if (!cb) return { limit: 0, spent: 0, percent: 0, status: 'normal' }

    const spent = useTransactionStore.getState().getCategorySpending(month, categoryId)
    const percent = cb.limit > 0 ? spent / cb.limit : 0
    const threshold = cb.warningThreshold || 0.8
    let status: 'normal' | 'warning' | 'over' = 'normal'
    if (percent >= 1) status = 'over'
    else if (percent >= threshold) status = 'warning'

    return { limit: cb.limit, spent, percent, status }
  },

  getTotalProgress: (month) => {
    const budget = get().getBudgetByMonth(month)
    if (!budget) return { limit: 0, spent: 0, percent: 0, status: 'normal' }

    const summary = useTransactionStore.getState().getMonthSummary(month)
    const percent = budget.totalLimit > 0 ? summary.totalExpense / budget.totalLimit : 0
    let status: 'normal' | 'warning' | 'over' = 'normal'
    if (percent >= 1) status = 'over'
    else if (percent >= 0.8) status = 'warning'

    return { limit: budget.totalLimit, spent: summary.totalExpense, percent, status }
  }
}))
