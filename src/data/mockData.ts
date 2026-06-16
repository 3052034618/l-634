import dayjs from 'dayjs'
import type { Account, Transaction, Budget, SavingGoal, Category } from '@/types'
import { defaultCategories } from './categories'
import { generateId } from '@/utils/id'

export const mockAccounts: Account[] = [
  {
    id: 'acc_cash',
    name: '现金钱包',
    type: 'cash',
    balance: 2580.5,
    initialBalance: 3000,
    icon: '💵',
    color: '#10b981',
    createdAt: dayjs().subtract(3, 'month').toISOString(),
    updatedAt: dayjs().toISOString()
  },
  {
    id: 'acc_bank_1',
    name: '招商银行储蓄卡',
    type: 'bank',
    balance: 58620.88,
    initialBalance: 50000,
    icon: '🏦',
    color: '#dc2626',
    note: '工资卡',
    createdAt: dayjs().subtract(6, 'month').toISOString(),
    updatedAt: dayjs().toISOString()
  },
  {
    id: 'acc_bank_2',
    name: '支付宝余额',
    type: 'bank',
    balance: 3450.2,
    initialBalance: 1000,
    icon: '💳',
    color: '#1677ff',
    createdAt: dayjs().subtract(4, 'month').toISOString(),
    updatedAt: dayjs().toISOString()
  },
  {
    id: 'acc_credit_1',
    name: '招商银行信用卡',
    type: 'credit',
    balance: -8450,
    initialBalance: 0,
    icon: '💳',
    color: '#ef4444',
    creditLimit: 30000,
    billingDay: 5,
    repaymentDay: 25,
    currentBill: 8450,
    minPayment: 845,
    nextRepaymentDate: dayjs().add(8, 'day').format('YYYY-MM-DD'),
    createdAt: dayjs().subtract(8, 'month').toISOString(),
    updatedAt: dayjs().toISOString()
  }
]

const merchants = [
  { name: '星巴克咖啡', category: 'cat_food' },
  { name: '肯德基餐厅', category: 'cat_food' },
  { name: '美团外卖', category: 'cat_food' },
  { name: '海底捞火锅', category: 'cat_food' },
  { name: '滴滴出行', category: 'cat_transport' },
  { name: '地铁充值', category: 'cat_transport' },
  { name: '中石化加油', category: 'cat_transport' },
  { name: '淘宝购物', category: 'cat_shopping' },
  { name: '京东商城', category: 'cat_shopping' },
  { name: '全家便利店', category: 'cat_shopping' },
  { name: '万达影城', category: 'cat_entertainment' },
  { name: '网易云音乐', category: 'cat_entertainment' },
  { name: '物业费', category: 'cat_house' },
  { name: '电费缴纳', category: 'cat_house' },
  { name: '中国移动', category: 'cat_communication' },
  { name: '药店买药', category: 'cat_medical' }
]

export const generateMockTransactions = (): Transaction[] => {
  const transactions: Transaction[] = []
  const now = dayjs()
  const catMap = new Map(defaultCategories.map((c) => [c.id, c]))

  for (let i = 0; i < 40; i++) {
    const date = now.subtract(Math.floor(Math.random() * 30), 'day')
    const isIncome = Math.random() < 0.15

    if (isIncome) {
      const incomeCats = defaultCategories.filter((c) => c.type === 'income')
      const cat = incomeCats[Math.floor(Math.random() * incomeCats.length)]
      transactions.push({
        id: generateId(),
        type: 'income',
        amount: Math.round((Math.random() * 8000 + 1000) * 100) / 100,
        accountId: mockAccounts[1].id,
        categoryId: cat.id,
        categoryName: cat.name,
        description: cat.name + '收入',
        merchant: cat.name,
        date: date.format('YYYY-MM-DD'),
        attachments: [],
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
        isAutoClassified: true
      })
    } else {
      const merchant = merchants[Math.floor(Math.random() * merchants.length)]
      const cat = catMap.get(merchant.category) as Category
      const acc = mockAccounts[Math.floor(Math.random() * mockAccounts.length)]
      transactions.push({
        id: generateId(),
        type: 'expense',
        amount: Math.round((Math.random() * 500 + 20) * 100) / 100,
        accountId: acc.id,
        categoryId: cat.id,
        categoryName: cat.name,
        description: merchant.name + '消费',
        merchant: merchant.name,
        date: date.format('YYYY-MM-DD'),
        attachments: [],
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
        isAutoClassified: true
      })
    }
  }

  return transactions.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
}

export const mockTransactions: Transaction[] = generateMockTransactions()

export const mockBudget: Budget = {
  id: 'budget_current',
  month: dayjs().format('YYYY-MM'),
  totalLimit: 10000,
  categoryBudgets: [
    { categoryId: 'cat_food', categoryName: '餐饮', limit: 2500, warningThreshold: 0.8 },
    { categoryId: 'cat_transport', categoryName: '交通', limit: 1000, warningThreshold: 0.8 },
    { categoryId: 'cat_shopping', categoryName: '购物', limit: 2000, warningThreshold: 0.8 },
    { categoryId: 'cat_entertainment', categoryName: '娱乐', limit: 1000, warningThreshold: 0.8 },
    { categoryId: 'cat_house', categoryName: '居家', limit: 2500, warningThreshold: 0.8 },
    { categoryId: 'cat_other_expense', categoryName: '其他', limit: 1000, warningThreshold: 0.8 }
  ],
  createdAt: dayjs().startOf('month').toISOString(),
  updatedAt: dayjs().toISOString()
}

export const mockGoals: SavingGoal[] = [
  {
    id: 'goal_1',
    name: '日本旅行基金',
    targetAmount: 20000,
    currentAmount: 12500,
    deadline: dayjs().add(6, 'month').format('YYYY-MM-DD'),
    icon: '✈️',
    color: '#6366f1',
    note: '东京+大阪自由行',
    contributions: [
      { id: 'c1', amount: 5000, date: dayjs().subtract(3, 'month').format('YYYY-MM-DD'), note: '初始存入' },
      { id: 'c2', amount: 3500, date: dayjs().subtract(2, 'month').format('YYYY-MM-DD'), note: '奖金存入' },
      { id: 'c3', amount: 4000, date: dayjs().subtract(1, 'month').format('YYYY-MM-DD') }
    ],
    createdAt: dayjs().subtract(3, 'month').toISOString(),
    updatedAt: dayjs().toISOString(),
    completed: false
  },
  {
    id: 'goal_2',
    name: '新款MacBook',
    targetAmount: 15000,
    currentAmount: 9800,
    icon: '💻',
    color: '#94a3b8',
    contributions: [
      { id: 'c1', amount: 5000, date: dayjs().subtract(2, 'month').format('YYYY-MM-DD') },
      { id: 'c2', amount: 4800, date: dayjs().subtract(1, 'month').format('YYYY-MM-DD') }
    ],
    createdAt: dayjs().subtract(2, 'month').toISOString(),
    updatedAt: dayjs().toISOString(),
    completed: false
  },
  {
    id: 'goal_3',
    name: '应急储备金',
    targetAmount: 50000,
    currentAmount: 50000,
    icon: '🛡️',
    color: '#10b981',
    note: '6个月生活费',
    contributions: [],
    createdAt: dayjs().subtract(12, 'month').toISOString(),
    updatedAt: dayjs().subtract(1, 'month').toISOString(),
    completed: true,
    completedAt: dayjs().subtract(1, 'month').toISOString()
  }
]
