import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'
import classnames from 'classnames'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon?: string
  color?: 'primary' | 'income' | 'expense' | 'warning' | 'info'
  onClick?: () => void
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  onClick
}) => {
  return (
    <View
      className={classnames(styles.statCard, styles[`color${color.charAt(0).toUpperCase() + color.slice(1)}`])}
      onClick={onClick}
    >
      <View className={styles.header}>
        <Text className={styles.title}>{title}</Text>
        {icon && <Text className={styles.icon}>{icon}</Text>}
      </View>
      <Text className={styles.value}>{value}</Text>
      {subtitle && <Text className={styles.subtitle}>{subtitle}</Text>}
    </View>
  )
}

export default StatCard
