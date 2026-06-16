import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'
import classnames from 'classnames'
import { formatMoney, formatPercent } from '@/utils/format'

interface BudgetProgressProps {
  label: string
  spent: number
  limit: number
  showAmount?: boolean
  size?: 'sm' | 'md'
}

const BudgetProgress: React.FC<BudgetProgressProps> = ({
  label,
  spent,
  limit,
  showAmount = true,
  size = 'md'
}) => {
  const percent = limit > 0 ? Math.min(spent / limit, 1.5) : 0
  const displayPercent = Math.min(percent, 1)
  let status: 'normal' | 'warning' | 'over' = 'normal'
  if (percent >= 1) status = 'over'
  else if (percent >= 0.8) status = 'warning'

  return (
    <View className={classnames(styles.wrap, size === 'sm' && styles.sm)}>
      <View className={styles.header}>
        <Text className={styles.label}>{label}</Text>
        {showAmount && (
          <Text className={classnames(styles.amount, styles[status])}>
            {formatMoney(spent)} / {formatMoney(limit)}
          </Text>
        )}
      </View>
      <View className={styles.bar}>
        <View
          className={classnames(styles.fill, styles[status])}
          style={{ width: `${displayPercent * 100}%` }}
        />
        {percent > 1 && (
          <View
            className={styles.overFill}
            style={{ left: '100%', width: `${Math.min((percent - 1) * 100, 50)}%` }}
          />
        )}
      </View>
      <View className={styles.footer}>
        <Text className={classnames(styles.percent, styles[status])}>
          {formatPercent(Math.min(percent, 1.5), 0)}
        </Text>
        {status === 'warning' && <Text className={styles.statusWarn}>⚠️ 接近预警线</Text>}
        {status === 'over' && <Text className={styles.statusOver}>🚨 已超支</Text>}
      </View>
    </View>
  )
}

export default BudgetProgress
