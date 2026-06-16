export interface BudgetCategory {
  categoryId: string
  categoryName: string
  limit: number
  warningThreshold: number
}

export interface BudgetAlert {
  id: string
  type: 'warning' | 'overdue'
  categoryId: string
  categoryName: string
  month?: string
  message: string
  triggeredAt: string
  read: boolean
}

export interface Budget {
  id: string
  month: string
  totalLimit: number
  categoryBudgets: BudgetCategory[]
  createdAt: string
  updatedAt: string
}
