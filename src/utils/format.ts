import dayjs from 'dayjs'

export const formatAmount = (amount: number, withSign = false): string => {
  const formatted = Math.abs(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  if (!withSign) return formatted
  return amount >= 0 ? `+${formatted}` : `-${formatted}`
}

export const formatMoney = (amount: number): string => {
  return `¥${formatAmount(amount)}`
}

export const formatDate = (date: string, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format)
}

export const formatDateTime = (date: string): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

export const formatMonth = (date: string): string => {
  return dayjs(date).format('YYYY年MM月')
}

export const getMonthKey = (date: string = new Date().toISOString()): string => {
  return dayjs(date).format('YYYY-MM')
}

export const getDaysInMonth = (date: string): number => {
  return dayjs(date).daysInMonth()
}

export const getCurrentMonthStart = (): string => {
  return dayjs().startOf('month').format('YYYY-MM-DD')
}

export const getCurrentMonthEnd = (): string => {
  return dayjs().endOf('month').format('YYYY-MM-DD')
}

export const isSameMonth = (d1: string, d2: string): boolean => {
  return dayjs(d1).format('YYYY-MM') === dayjs(d2).format('YYYY-MM')
}

export const isSameDay = (d1: string, d2: string): boolean => {
  return dayjs(d1).format('YYYY-MM-DD') === dayjs(d2).format('YYYY-MM-DD')
}

export const getRelativeDate = (date: string): string => {
  const d = dayjs(date)
  const today = dayjs()
  if (d.format('YYYY-MM-DD') === today.format('YYYY-MM-DD')) return '今天'
  if (d.format('YYYY-MM-DD') === today.subtract(1, 'day').format('YYYY-MM-DD')) return '昨天'
  if (d.format('YYYY-MM-DD') === today.add(1, 'day').format('YYYY-MM-DD')) return '明天'
  return d.format('MM月DD日')
}

export const formatPercent = (value: number, decimals = 0): string => {
  return `${(value * 100).toFixed(decimals)}%`
}
