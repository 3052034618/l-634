export type TransactionType = 'income' | 'expense' | 'transfer'

export interface Category {
  id: string
  name: string
  type: TransactionType
  icon: string
  color: string
  keywords: string[]
}
