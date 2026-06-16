import Taro from '@tarojs/taro'
import type { Transaction, Account } from '@/types'
import { formatDate, formatAmount } from './format'
import dayjs from 'dayjs'

interface CategoryBreakdownItem {
  name: string
  amount: number
  type: 'income' | 'expense'
}

interface MonthSummary {
  totalIncome: number
  totalExpense: number
  netIncome: number
  byCategory: Map<string, { name: string; amount: number; type: 'income' | 'expense' }>
}

interface BudgetProgress {
  limit: number
  spent: number
  percent: number
  status: 'normal' | 'warning' | 'over'
}

const getAccountName = (accountId: string, accounts: Account[]): string => {
  const acc = accounts.find((a) => a.id === accountId)
  return acc ? acc.name : '未知账户'
}

export const exportToCSV = async (
  transactions: Transaction[],
  accounts: Account[],
  filename?: string
): Promise<boolean> => {
  if (!transactions || transactions.length === 0) {
    Taro.showToast({ title: '暂无数据可导出', icon: 'none' })
    return false
  }

  const validTransactions = transactions.filter((t) => t.amount > 0)
  if (validTransactions.length === 0) {
    Taro.showToast({ title: '暂无有效数据可导出', icon: 'none' })
    return false
  }

  try {
    const headers = ['日期', '类型', '金额', '分类', '账户', '商户', '描述', '备注']
    const rows = transactions.map((t) => [
      formatDate(t.date),
      t.type === 'income' ? '收入' : '支出',
      formatAmount(t.amount),
      t.categoryName || '未分类',
      getAccountName(t.accountId, accounts),
      (t.merchant || '').replace(/,/g, '，'),
      (t.description || '').replace(/,/g, '，'),
      (t.note || '').replace(/,/g, '，')
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')
    
    const utf8Bom = '\uFEFF'
    const content = utf8Bom + csvContent

    const fileBaseName = filename || `交易明细_${dayjs().format('YYYYMMDD_HHmmss')}`
    const safeFileName = fileBaseName.endsWith('.csv') ? fileBaseName : `${fileBaseName}.csv`
    
    const fs = Taro.getFileSystemManager()
    const filePath = `${Taro.env.USER_DATA_PATH}/${safeFileName}`

    return new Promise((resolve) => {
      fs.writeFile({
        filePath,
        data: content,
        encoding: 'utf8',
        success: () => {
          console.log('[Export] CSV saved to:', filePath)
          Taro.showToast({ title: '导出成功', icon: 'success' })
          
          setTimeout(() => {
            Taro.openDocument({
              filePath,
              showMenu: true,
              fail: (err) => {
                console.log('[Export] Open document failed:', err)
              }
            })
          }, 500)
          
          resolve(true)
        },
        fail: (err) => {
          console.error('[Export] CSV write failed:', err)
          Taro.showToast({ title: '导出失败，请重试', icon: 'none' })
          resolve(false)
        }
      })
    })
  } catch (e) {
    console.error('[Export] CSV export error:', e)
    Taro.showToast({ title: '导出失败，请重试', icon: 'none' })
    return false
  }
}

export const exportSummaryToText = async (
  month: string,
  summary: MonthSummary,
  budgetProgress?: BudgetProgress,
  accounts?: Account[]
): Promise<boolean> => {
  try {
    const monthLabel = dayjs(month + '-01').format('YYYY年M月')
    
    const hasData = summary.totalIncome > 0 || summary.totalExpense > 0
    const hasCategories = summary.byCategory && summary.byCategory.size > 0

    if (!hasData && !hasCategories) {
      Taro.showToast({ title: '暂无数据可导出', icon: 'none' })
      return false
    }
    
    let text = `====================================\n`
    text += `           ${monthLabel}财务报告\n`
    text += `====================================\n\n`
    
    text += `【一、收支概览】\n`
    text += `-----------------------------\n`
    text += `总收入：¥${formatAmount(summary.totalIncome)}\n`
    text += `总支出：¥${formatAmount(summary.totalExpense)}\n`
    text += `净结余：${summary.netIncome >= 0 ? '+' : ''}¥${formatAmount(summary.netIncome)}\n`
    text += `结余率：${summary.totalIncome > 0 ? ((summary.netIncome / summary.totalIncome) * 100).toFixed(1) : '0.0'}%\n\n`
    
    if (budgetProgress && budgetProgress.limit > 0) {
      text += `【二、预算执行情况】\n`
      text += `-----------------------------\n`
      text += `月度预算：¥${formatAmount(budgetProgress.limit)}\n`
      text += `实际支出：¥${formatAmount(budgetProgress.spent)}\n`
      text += `预算使用：${(budgetProgress.percent * 100).toFixed(1)}%\n`
      text += `预算状态：${
        budgetProgress.status === 'over' ? '⚠️ 已超支' :
        budgetProgress.status === 'warning' ? '⚡ 接近预算' : '✅ 正常'
      }\n`
      if (budgetProgress.status !== 'over') {
        text += `剩余可用：¥${formatAmount(Math.max(budgetProgress.limit - budgetProgress.spent, 0))}\n`
      } else {
        text += `超支金额：¥${formatAmount(budgetProgress.spent - budgetProgress.limit)}\n`
      }
      text += `\n`
    }
    
    const expenseCategories = Array.from(summary.byCategory.entries())
      .filter(([, v]) => v.type === 'expense')
      .sort((a, b) => b[1].amount - a[1].amount)
    
    if (expenseCategories.length > 0) {
      text += `【三、支出分类明细】\n`
      text += `-----------------------------\n`
      expenseCategories.forEach(([, v], i) => {
        const percent = summary.totalExpense > 0 ? ((v.amount / summary.totalExpense) * 100).toFixed(1) : '0.0'
        text += `${i + 1}. ${v.name}：¥${formatAmount(v.amount)} (${percent}%)\n`
      })
      text += `\n`
    }
    
    const incomeCategories = Array.from(summary.byCategory.entries())
      .filter(([, v]) => v.type === 'income')
      .sort((a, b) => b[1].amount - a[1].amount)
    
    if (incomeCategories.length > 0) {
      text += `【四、收入分类明细】\n`
      text += `-----------------------------\n`
      incomeCategories.forEach(([, v], i) => {
        const percent = summary.totalIncome > 0 ? ((v.amount / summary.totalIncome) * 100).toFixed(1) : '0.0'
        text += `${i + 1}. ${v.name}：¥${formatAmount(v.amount)} (${percent}%)\n`
      })
      text += `\n`
    }
    
    if (accounts && accounts.length > 0) {
      text += `【五、账户余额】\n`
      text += `-----------------------------\n`
      accounts.forEach((acc) => {
        text += `${acc.icon} ${acc.name}：¥${formatAmount(acc.balance)}\n`
      })
      text += `\n`
    }
    
    text += `====================================\n`
    text += `生成时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n`
    text += `个人记账APP 自动生成\n`
    text += `====================================\n`

    const fs = Taro.getFileSystemManager()
    const filePath = `${Taro.env.USER_DATA_PATH}/财务报告_${month}.txt`

    return new Promise((resolve) => {
      fs.writeFile({
        filePath,
        data: text,
        encoding: 'utf8',
        success: () => {
          console.log('[Export] Report saved to:', filePath)
          Taro.showToast({ title: '报告已生成', icon: 'success' })
          
          setTimeout(() => {
            Taro.openDocument({
              filePath,
              showMenu: true,
              fail: (err) => {
                console.log('[Export] Open document failed:', err)
              }
            })
          }, 500)
          
          resolve(true)
        },
        fail: (err) => {
          console.error('[Export] Report write failed:', err)
          Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
          resolve(false)
        }
      })
    })
  } catch (e) {
    console.error('[Export] Report export error:', e)
    Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
    return false
  }
}
