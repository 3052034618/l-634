export type AccountType = 'cash' | 'bank' | 'credit'

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  initialBalance: number
  icon: string
  color: string
  note?: string
  createdAt: string
  updatedAt: string

  creditLimit?: number
  billingDay?: number
  repaymentDay?: number
  currentBill?: number
  minPayment?: number
  lastBillDate?: string
  nextRepaymentDate?: string
  annualFee?: number
  isOverdue?: boolean
  overdueDays?: number
  overdueAmount?: number
}
