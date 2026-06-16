export interface GoalContribution {
  id: string
  amount: number
  date: string
  note?: string
}

export interface SavingGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  icon: string
  color: string
  note?: string
  contributions: GoalContribution[]
  createdAt: string
  updatedAt: string
  completed: boolean
  completedAt?: string
}

export interface GoalMessage {
  id: string
  goalId: string
  type: 'encourage' | 'milestone' | 'complete'
  message: string
  triggeredAt: string
}
