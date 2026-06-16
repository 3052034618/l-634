import { create } from 'zustand'
import dayjs from 'dayjs'
import type { SavingGoal, GoalContribution, GoalMessage } from '@/types'
import { mockGoals } from '@/data/mockData'
import { getStorageSync, setStorageSync } from '@/utils/storage'
import { generateId } from '@/utils/id'

const GOAL_KEY = 'saving_goals'
const MSG_KEY = 'goal_messages'

const encouragingMessages = [
  '继续加油，距离目标又近了一步！💪',
  '存钱的习惯正在让你变得更富有！🌟',
  '每一分钱都是通向目标的砖石！🧱',
  '坚持就是胜利，你做得很好！🎉',
  '自律给你自由，财富正在向你招手！💰'
]

interface GoalState {
  goals: SavingGoal[]
  messages: GoalMessage[]
  loaded: boolean
  loadGoals: () => void
  addGoal: (data: {
    name: string
    targetAmount: number
    deadline?: string
    icon: string
    color: string
    note?: string
  }) => SavingGoal
  updateGoal: (id: string, data: Partial<SavingGoal>) => void
  deleteGoal: (id: string) => void
  contribute: (goalId: string, amount: number, note?: string) => void
  getGoalById: (id: string) => SavingGoal | undefined
  getActiveGoals: () => SavingGoal[]
  getCompletedGoals: () => SavingGoal[]
  getTotalSaved: () => number
  checkGoalMilestones: (goalId: string) => GoalMessage | null
  getEncourageMessage: () => GoalMessage | null
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  messages: [],
  loaded: false,

  loadGoals: () => {
    const storedGoals = getStorageSync<SavingGoal[]>(GOAL_KEY)
    const storedMsgs = getStorageSync<GoalMessage[]>(MSG_KEY, [])
    if (storedGoals && storedGoals.length > 0) {
      set({ goals: storedGoals, messages: storedMsgs || [], loaded: true })
    } else {
      setStorageSync(GOAL_KEY, mockGoals)
      setStorageSync(MSG_KEY, [])
      set({ goals: mockGoals, messages: [], loaded: true })
    }
    console.log('[GoalStore] Loaded', get().goals.length, 'goals')
  },

  addGoal: (data) => {
    const newGoal: SavingGoal = {
      id: generateId(),
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: 0,
      deadline: data.deadline,
      icon: data.icon,
      color: data.color,
      note: data.note,
      contributions: [],
      createdAt: dayjs().toISOString(),
      updatedAt: dayjs().toISOString(),
      completed: false
    }
    const updated = [...get().goals, newGoal]
    setStorageSync(GOAL_KEY, updated)
    set({ goals: updated })
    return newGoal
  },

  updateGoal: (id, data) => {
    const updated = get().goals.map((g) =>
      g.id === id ? { ...g, ...data, updatedAt: dayjs().toISOString() } : g
    )
    setStorageSync(GOAL_KEY, updated)
    set({ goals: updated })
  },

  deleteGoal: (id) => {
    const updated = get().goals.filter((g) => g.id !== id)
    setStorageSync(GOAL_KEY, updated)
    set({ goals: updated })
  },

  contribute: (goalId, amount, note) => {
    const contribution: GoalContribution = {
      id: generateId(),
      amount,
      date: dayjs().format('YYYY-MM-DD'),
      note
    }

    const updated = get().goals.map((g) => {
      if (g.id !== goalId) return g
      const newCurrent = g.currentAmount + amount
      const isComplete = newCurrent >= g.targetAmount
      return {
        ...g,
        currentAmount: Math.min(newCurrent, g.targetAmount),
        contributions: [contribution, ...g.contributions],
        completed: isComplete,
        completedAt: isComplete && !g.completed ? dayjs().toISOString() : g.completedAt,
        updatedAt: dayjs().toISOString()
      }
    })

    setStorageSync(GOAL_KEY, updated)
    set({ goals: updated })

    const milestone = get().checkGoalMilestones(goalId)
    if (milestone) {
      const msgs = [milestone, ...get().messages]
      setStorageSync(MSG_KEY, msgs)
      set({ messages: msgs })
    }
  },

  getGoalById: (id) => get().goals.find((g) => g.id === id),

  getActiveGoals: () => get().goals.filter((g) => !g.completed),

  getCompletedGoals: () => get().goals.filter((g) => g.completed),

  getTotalSaved: () => get().goals.reduce((sum, g) => sum + g.currentAmount, 0),

  checkGoalMilestones: (goalId) => {
    const goal = get().getGoalById(goalId)
    if (!goal) return null

    const percent = goal.currentAmount / goal.targetAmount
    const milestones = [0.25, 0.5, 0.75, 1]

    for (const m of milestones) {
      if (percent >= m && percent < m + 0.05) {
        return {
          id: generateId(),
          goalId,
          type: m === 1 ? 'complete' : 'milestone',
          message:
            m === 1
              ? `🎉 恭喜！"${goal.name}"目标已完成！`
              : `✨ 太棒了！"${goal.name}"已完成 ${(m * 100).toFixed(0)}%！`,
          triggeredAt: dayjs().toISOString()
        }
      }
    }
    return null
  },

  getEncourageMessage: () => {
    const activeGoals = get().getActiveGoals()
    if (activeGoals.length === 0) return null
    const goal = activeGoals[Math.floor(Math.random() * activeGoals.length)]
    const msg = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)]
    return {
      id: generateId(),
      goalId: goal.id,
      type: 'encourage',
      message: `关于"${goal.name}"：${msg}`,
      triggeredAt: dayjs().toISOString()
    }
  }
}))
