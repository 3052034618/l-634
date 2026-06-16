import { create } from 'zustand'
import dayjs from 'dayjs'
import type { CreditBill, CreditBillItem, CreditReminder } from '@/types'
import { getStorageSync, setStorageSync } from '@/utils/storage'
import { generateId } from '@/utils/id'
import { useAccountStore } from './accountStore'
import { useTransactionStore } from './transactionStore'

const BILL_KEY = 'credit_bills'
const REMINDER_KEY = 'credit_reminders'

const LATE_FEE_RATE = 0.0005

interface CreditState {
  bills: CreditBill[]
  reminders: CreditReminder[]
  loaded: boolean
  loadBills: () => void
  loadCredit: () => void
  getBillsByAccount: (accountId: string) => CreditBill[]
  getCurrentBill: (accountId: string) => CreditBill | undefined
  createBill: (data: {
    accountId: string
    billingMonth: string
    totalAmount: number
    billingDate: string
    dueDate: string
    items?: CreditBillItem[]
  }) => CreditBill
  parseBillText: (accountId: string, text: string) => {
    items: CreditBillItem[]
    totalAmount: number
  }
  importBillItems: (billId: string) => void
  markBillPaid: (billId: string, paidAmount: number) => void
  calculateLateFee: (billId: string) => number
  checkReminders: () => CreditReminder[]
  getUnreadReminderCount: () => number
  markReminderRead: (id: string) => void
}

export const useCreditStore = create<CreditState>((set, get) => ({
  bills: [],
  reminders: [],
  loaded: false,

  loadBills: () => {
    const storedBills = getStorageSync<CreditBill[]>(BILL_KEY, [])
    const storedReminders = getStorageSync<CreditReminder[]>(REMINDER_KEY, [])
    set({
      bills: storedBills || [],
      reminders: storedReminders || [],
      loaded: true
    })
    console.log('[CreditStore] Loaded', get().bills.length, 'bills')
  },

  loadCredit: () => {
    get().loadBills()
  },

  getBillsByAccount: (accountId) =>
    get()
      .bills.filter((b) => b.accountId === accountId)
      .sort((a, b) => dayjs(b.billingDate).valueOf() - dayjs(a.billingDate).valueOf()),

  getCurrentBill: (accountId) => {
    const currentMonth = dayjs().format('YYYY-MM')
    return get().bills.find((b) => b.accountId === accountId && b.billingMonth === currentMonth)
  },

  createBill: (data) => {
    const newBill: CreditBill = {
      id: generateId(),
      accountId: data.accountId,
      billingMonth: data.billingMonth,
      totalAmount: data.totalAmount,
      minPayment: data.totalAmount * 0.1,
      billingDate: data.billingDate,
      dueDate: data.dueDate,
      items: data.items || [],
      status: 'pending',
      lateFee: 0
    }
    const updated = [...get().bills, newBill]
    setStorageSync(BILL_KEY, updated)
    set({ bills: updated })

    const accountStore = useAccountStore.getState()
    accountStore.updateAccount(data.accountId, {
      currentBill: data.totalAmount,
      minPayment: data.totalAmount * 0.1
    })

    return newBill
  },

  parseBillText: (_accountId, text) => {
    const lines = text.split(/[\n\r]+/)
    const items: CreditBillItem[] = []
    let totalAmount = 0
    const categories = useAppStore.getState().categories

    lines.forEach((line) => {
      if (!line.trim()) return
      const amountMatch = line.match(/(\d+\.?\d*)\s*(?:元|RMB|￥|¥)/)
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1])
        if (amount > 0 && amount < 100000) {
          const desc = line.replace(amountMatch[0], '').trim() || '信用卡消费'
          const dateMatch = line.match(/(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/)
          const merchantMatch = desc.match(/(?:消费于|交易|商户|收款方|支付给)\s*([^\s，。,]+)/)
          const merchant = merchantMatch ? merchantMatch[1] : desc.substring(0, 20)
          
          const classification = classifyTransaction(desc, merchant, categories)
          
          items.push({
            id: generateId(),
            date: dateMatch ? dateMatch[1].replace(/\//g, '-') : dayjs().format('YYYY-MM-DD'),
            description: desc.substring(0, 50),
            merchant: merchant.substring(0, 20),
            amount,
            categoryId: classification.categoryId,
            categoryName: classification.categoryName,
            imported: false
          })
          totalAmount += amount
        }
      }
    })

    return { items, totalAmount: Math.round(totalAmount * 100) / 100 }
  },

  importBillItems: (billId) => {
    const bill = get().bills.find((b) => b.id === billId)
    if (!bill) return

    const txStore = useTransactionStore.getState()
    const account = useAccountStore.getState().getAccountById(bill.accountId)
    if (!account) return

    bill.items
      .filter((item) => !item.imported)
      .forEach((item) => {
        txStore.addTransaction({
          type: 'expense',
          amount: item.amount,
          accountId: bill.accountId,
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          description: item.description,
          merchant: item.merchant,
          date: item.date
        })
      })

    const updatedBills = get().bills.map((b) =>
      b.id === billId
        ? { ...b, items: b.items.map((i) => ({ ...i, imported: true })) }
        : b
    )
    setStorageSync(BILL_KEY, updatedBills)
    set({ bills: updatedBills })
  },

  markBillPaid: (billId, paidAmount) => {
    const bill = get().bills.find((b) => b.id === billId)
    if (!bill) return

    const updatedBills = get().bills.map((b) =>
      b.id === billId
        ? {
            ...b,
            status: paidAmount >= b.totalAmount ? 'paid' : 'pending',
            paidAmount,
            paidDate: dayjs().format('YYYY-MM-DD')
          }
        : b
    )
    setStorageSync(BILL_KEY, updatedBills)
    set({ bills: updatedBills })

    const accountStore = useAccountStore.getState()
    accountStore.adjustBalance(bill.accountId, paidAmount, true)
  },

  calculateLateFee: (billId) => {
    const bill = get().bills.find((b) => b.id === billId)
    if (!bill || bill.status === 'paid') return 0

    const dueDate = dayjs(bill.dueDate)
    const today = dayjs()
    if (!today.isAfter(dueDate)) return 0

    const overdueDays = today.diff(dueDate, 'day')
    const unpaidAmount = bill.totalAmount - (bill.paidAmount || 0)
    return Math.round(unpaidAmount * LATE_FEE_RATE * overdueDays * 100) / 100
  },

  checkReminders: () => {
    const newReminders: CreditReminder[] = []
    const accounts = useAccountStore.getState().accounts.filter((a) => a.type === 'credit')
    const existingIds = new Set(
      get().reminders.map((r) => `${r.accountId}_${r.billingMonth || ''}_${r.type}`)
    )

    accounts.forEach((acc) => {
      const bills = get().getBillsByAccount(acc.id)
      const pendingBill = bills.find((b) => b.status === 'pending')

      if (pendingBill) {
        const dueDate = dayjs(pendingBill.dueDate)
        const today = dayjs()
        const daysUntilDue = dueDate.diff(today, 'day')
        const lateFee = get().calculateLateFee(pendingBill.id)

        if (lateFee > 0 && !existingIds.has(`${acc.id}_${pendingBill.billingMonth}_overdue`)) {
          newReminders.push({
            id: generateId(),
            accountId: acc.id,
            billId: pendingBill.id,
            type: 'overdue',
            message: `${acc.name}已逾期${Math.abs(daysUntilDue)}天，滞纳金¥${lateFee.toFixed(2)}`,
            triggeredAt: dayjs().toISOString(),
            read: false
          })
        } else if (
          daysUntilDue >= 0 &&
          daysUntilDue <= 7 &&
          !existingIds.has(`${acc.id}_${pendingBill.billingMonth}_repayment`)
        ) {
          newReminders.push({
            id: generateId(),
            accountId: acc.id,
            billId: pendingBill.id,
            type: 'repayment',
            message: `${acc.name}还有${daysUntilDue}天到期，应还¥${pendingBill.totalAmount.toFixed(2)}`,
            triggeredAt: dayjs().toISOString(),
            read: false
          })
        }
      }
    })

    if (newReminders.length > 0) {
      const updated = [...newReminders, ...get().reminders]
      setStorageSync(REMINDER_KEY, updated)
      set({ reminders: updated })
    }

    return newReminders
  },

  getUnreadReminderCount: () => get().reminders.filter((r) => !r.read).length,

  markReminderRead: (id) => {
    const updated = get().reminders.map((r) => (r.id === id ? { ...r, read: true } : r))
    setStorageSync(REMINDER_KEY, updated)
    set({ reminders: updated })
  }
}))
