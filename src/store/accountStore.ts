import { create } from 'zustand'
import dayjs from 'dayjs'
import type { Account, AccountType, BalanceChangeReason } from '@/types'
import { mockAccounts } from '@/data/mockData'
import { getStorageSync, setStorageSync } from '@/utils/storage'
import { generateId } from '@/utils/id'
import { useBalanceLogStore } from './balanceLogStore'

const ACC_KEY = 'accounts'

interface AccountState {
  accounts: Account[]
  loaded: boolean
  loadAccounts: () => void
  addAccount: (data: Partial<Account> & { name: string; type: AccountType; balance: number }) => Account
  updateAccount: (id: string, data: Partial<Account>) => void
  deleteAccount: (id: string) => void
  adjustBalance: (
    id: string,
    amount: number,
    isAdd: boolean,
    logOptions?: {
      log: boolean
      relatedTransactionId?: string
      relatedBillId?: string
      reason: BalanceChangeReason
      description?: string
    }
  ) => { oldBalance: number; newBalance: number; delta: number }
  getAccountById: (id: string) => Account | undefined
  getTotalAssets: () => number
  getTotalLiabilities: () => number
  getNetWorth: () => number
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  loaded: false,

  loadAccounts: () => {
    const stored = getStorageSync<Account[]>(ACC_KEY)
    if (stored && stored.length > 0) {
      set({ accounts: stored, loaded: true })
    } else {
      setStorageSync(ACC_KEY, mockAccounts)
      set({ accounts: mockAccounts, loaded: true })
    }
    useBalanceLogStore.getState().loadLogs()
    console.log('[AccountStore] Loaded', get().accounts.length, 'accounts')
  },

  addAccount: (data) => {
    const colorMap: Record<AccountType, string> = {
      cash: '#10b981',
      bank: '#3b82f6',
      credit: '#ef4444'
    }
    const iconMap: Record<AccountType, string> = {
      cash: '💵',
      bank: '🏦',
      credit: '💳'
    }
    const newAccount: Account = {
      id: generateId(),
      name: data.name,
      type: data.type,
      balance: data.balance,
      initialBalance: data.balance,
      icon: data.icon || iconMap[data.type],
      color: data.color || colorMap[data.type],
      note: data.note,
      createdAt: dayjs().toISOString(),
      updatedAt: dayjs().toISOString(),
      ...(data.type === 'credit' && {
        creditLimit: data.creditLimit || 10000,
        billingDay: data.billingDay || 1,
        repaymentDay: data.repaymentDay || 20,
        currentBill: 0,
        minPayment: 0
      })
    }
    const updated = [...get().accounts, newAccount]
    setStorageSync(ACC_KEY, updated)
    set({ accounts: updated })
    return newAccount
  },

  updateAccount: (id, data) => {
    const updated = get().accounts.map((a) =>
      a.id === id ? { ...a, ...data, updatedAt: dayjs().toISOString() } : a
    )
    setStorageSync(ACC_KEY, updated)
    set({ accounts: updated })
  },

  deleteAccount: (id) => {
    const updated = get().accounts.filter((a) => a.id !== id)
    setStorageSync(ACC_KEY, updated)
    set({ accounts: updated })
  },

  adjustBalance: (id, amount, isAdd, logOptions) => {
    const account = get().accounts.find((a) => a.id === id)
    const oldBalance = account?.balance || 0
    const delta = isAdd ? amount : -amount
    const newBalance = oldBalance + delta

    const updated = get().accounts.map((a) => {
      if (a.id !== id) return a
      return { ...a, balance: newBalance, updatedAt: dayjs().toISOString() }
    })
    setStorageSync(ACC_KEY, updated)
    set({ accounts: updated })

    if (logOptions && logOptions.log) {
      useBalanceLogStore.getState().addLog({
        accountId: id,
        relatedTransactionId: logOptions.relatedTransactionId,
        relatedBillId: logOptions.relatedBillId,
        reason: logOptions.reason,
        oldBalance,
        newBalance,
        delta,
        description:
          logOptions.description ||
          `${logOptions.reason}: ${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`
      })
    }

    return { oldBalance, newBalance, delta }
  },

  getAccountById: (id) => get().accounts.find((a) => a.id === id),

  getTotalAssets: () => {
    return get().accounts.filter((a) => a.balance >= 0).reduce((sum, a) => sum + a.balance, 0)
  },

  getTotalLiabilities: () => {
    return Math.abs(get().accounts.filter((a) => a.balance < 0).reduce((sum, a) => sum + a.balance, 0))
  },

  getNetWorth: () => get().getTotalAssets() - get().getTotalLiabilities()
}))

