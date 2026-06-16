import Taro from '@tarojs/taro'
import type { Transaction, Account, Budget, SavingGoal } from '@/types'
import { formatDate, formatAmount } from './format'
import { generateId } from './id'

export const exportToCSV = (
  transactions: Transaction[],
  accounts: Account[],
  period: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const accountMap = new Map(accounts.map((a) => [a.id, a.name]))
      const headers = ['日期', '类型', '金额', '分类', '账户', '商户', '备注']
      const rows = transactions.map((t) => [
        formatDate(t.date),
        t.type === 'income' ? '收入' : '支出',
        formatAmount(t.amount),
        t.categoryName,
        accountMap.get(t.accountId) || '未知',
        t.merchant || '',
        t.note || ''
      ])

      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
      const utf8Bom = '\uFEFF'
      const content = utf8Bom + csv

      const fs = Taro.getFileSystemManager()
      const filePath = `${Taro.env.USER_DATA_PATH}/transactions_${period}_${generateId()}.csv`

      fs.writeFile({
        filePath,
        data: content,
        encoding: 'utf8',
        success: () => resolve(filePath),
        fail: (err) => reject(err)
      })
    } catch (e) {
      console.error('[Export] CSV export error:', e)
      reject(e)
    }
  })
}

export const exportSummaryToText = (
  summary: {
    period: string
    totalIncome: number
    totalExpense: number
    netIncome: number
    categoryBreakdown: { name: string; amount: number; percent: number }[]
    accounts: Account[]
    goals: SavingGoal[]
    budget?: Budget
  }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      let text = `========== 个人财务报告 ==========\n`
      text += `报告期间：${summary.period}\n\n`
      text += `--- 收支概览 ---\n`
      text += `总收入：¥${formatAmount(summary.totalIncome)}\n`
      text += `总支出：¥${formatAmount(summary.totalExpense)}\n`
      text += `净收入：¥${formatAmount(summary.netIncome)}\n\n`

      if (summary.budget) {
        text += `--- 预算执行 ---\n`
        text += `月度预算：¥${formatAmount(summary.budget.totalLimit)}\n`
        text += `已支出：¥${formatAmount(summary.totalExpense)}\n`
        text += `预算使用率：${((summary.totalExpense / summary.budget.totalLimit) * 100).toFixed(1)}%\n\n`
      }

      text += `--- 支出分类 ---\n`
      summary.categoryBreakdown.forEach((item) => {
        text += `${item.name}：¥${formatAmount(item.amount)} (${(item.percent * 100).toFixed(1)}%)\n`
      })
      text += `\n`

      text += `--- 账户余额 ---\n`
      summary.accounts.forEach((acc) => {
        text += `${acc.name}：¥${formatAmount(acc.balance)}\n`
      })
      text += `\n`

      if (summary.goals.length > 0) {
        text += `--- 存钱目标 ---\n`
        summary.goals.forEach((g) => {
          const percent = ((g.currentAmount / g.targetAmount) * 100).toFixed(1)
          text += `${g.name}：¥${formatAmount(g.currentAmount)} / ¥${formatAmount(g.targetAmount)} (${percent}%)\n`
        })
      }

      text += `\n生成时间：${new Date().toLocaleString('zh-CN')}\n`
      text += `====================================\n`

      const fs = Taro.getFileSystemManager()
      const filePath = `${Taro.env.USER_DATA_PATH}/report_${Date.now()}.txt`

      fs.writeFile({
        filePath,
        data: text,
        encoding: 'utf8',
        success: () => resolve(filePath),
        fail: (err) => reject(err)
      })
    } catch (e) {
      console.error('[Export] Text export error:', e)
      reject(e)
    }
  })
}
