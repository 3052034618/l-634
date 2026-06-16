import type { TransactionType } from './category'

export interface TransactionAttachment {
  id: string
  name: string
  path: string
  size: number
  type: 'image' | 'pdf'
  uploadedAt: string
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  accountId: string
  categoryId: string
  categoryName: string
  description: string
  merchant?: string
  note?: string
  attachments: TransactionAttachment[]
  date: string
  createdAt: string
  updatedAt: string
  isAutoClassified: boolean
  adjusted?: boolean
  transferToAccountId?: string
}

export type BalanceChangeReason =
  | 'add_transaction'
  | 'update_transaction'
  | 'delete_transaction'
  | 'transfer_out'
  | 'transfer_in'
  | 'mark_paid'
  | 'manual_adjust'

export interface AccountBalanceLog {
  id: string
  accountId: string
  relatedTransactionId?: string
  relatedBillId?: string
  reason: BalanceChangeReason
  oldBalance: number
  newBalance: number
  delta: number
  description: string
  createdAt: string
}
