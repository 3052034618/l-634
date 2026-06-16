import { create } from 'zustand'
import dayjs from 'dayjs'
import type { AccountBalanceLog, BalanceChangeReason } from '@/types'
import { getStorageSync, setStorageSync } from '@/utils/storage'
import { generateId } from '@/utils/id'

const LOG_KEY = 'account_balance_logs'

interface LogState {
  logs: AccountBalanceLog[]
  loaded: boolean
  loadLogs: () => void
  addLog: (data: {
    accountId: string
    relatedTransactionId?: string
    relatedBillId?: string
    reason: BalanceChangeReason
    oldBalance: number
    newBalance: number
    delta: number
    description: string
  }) => void
  getLogsByAccount: (accountId: string) => AccountBalanceLog[]
  clearLogs: () => void
}

export const useBalanceLogStore = create<LogState>((set, get) => ({
  logs: [],
  loaded: false,

  loadLogs: () => {
    const stored = getStorageSync<AccountBalanceLog[]>(LOG_KEY, [])
    set({ logs: stored || [], loaded: true })
    console.log('[BalanceLogStore] Loaded', get().logs.length, 'logs')
  },

  addLog: (data) => {
    const newLog: AccountBalanceLog = {
      id: generateId(),
      ...data,
      createdAt: dayjs().toISOString()
    }
    const updated = [newLog, ...get().logs].slice(0, 2000)
    setStorageSync(LOG_KEY, updated)
    set({ logs: updated })
  },

  getLogsByAccount: (accountId) => {
    return get().logs
      .filter((l) => l.accountId === accountId)
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
  },

  clearLogs: () => {
    setStorageSync(LOG_KEY, [])
    set({ logs: [] })
  }
}))
