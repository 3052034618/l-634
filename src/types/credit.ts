export interface CreditBillItem {
  id: string
  date: string
  description: string
  merchant: string
  amount: number
  categoryId: string
  categoryName: string
  imported: boolean
}

export interface CreditBill {
  id: string
  accountId: string
  billingMonth: string
  totalAmount: number
  minPayment: number
  billingDate: string
  dueDate: string
  items: CreditBillItem[]
  status: 'pending' | 'paid' | 'overdue'
  paidAmount?: number
  paidDate?: string
  lateFee?: number
}

export interface CreditReminder {
  id: string
  accountId: string
  billId: string
  billingMonth?: string
  type: 'billing' | 'repayment' | 'overdue'
  message: string
  triggeredAt: string
  read: boolean
}
