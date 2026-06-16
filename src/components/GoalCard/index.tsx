import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import type { SavingGoal } from '@/types'
import { formatMoney } from '@/utils/format'

interface GoalCardProps {
  goal: SavingGoal
  onClick?: () => void
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onClick }) => {
  const percent = Math.min(goal.currentAmount / goal.targetAmount, 1)

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      Taro.navigateTo({
        url: `/pages/goal-detail/index?id=${goal.id}`
      })
    }
  }

  return (
    <View
      className={classnames(styles.card, goal.completed && styles.completed)}
      onClick={handleClick}
    >
      <View className={styles.header}>
        <View
          className={styles.iconWrap}
          style={{ backgroundColor: `${goal.color}20` }}
        >
          <Text className={styles.icon}>{goal.icon}</Text>
        </View>
        <View className={styles.info}>
          <Text className={styles.name}>{goal.name}</Text>
          {goal.completed ? (
            <Text className={styles.completeText}>🎉 已完成</Text>
          ) : goal.deadline ? (
            <Text className={styles.deadline}>目标日期：{goal.deadline}</Text>
          ) : null}
        </View>
      </View>

      <View className={styles.progressRow}>
        <Text className={styles.current}>{formatMoney(goal.currentAmount)}</Text>
        <Text className={styles.target}>/ {formatMoney(goal.targetAmount)}</Text>
      </View>

      <View className={styles.bar}>
        <View
          className={styles.fill}
          style={{ width: `${percent * 100}%`, backgroundColor: goal.color }}
        />
      </View>

      <View className={styles.footer}>
        <Text className={styles.percent} style={{ color: goal.color }}>
          {(percent * 100).toFixed(0)}%
        </Text>
        <Text className={styles.remaining}>
          还差 {formatMoney(Math.max(goal.targetAmount - goal.currentAmount, 0))}
        </Text>
      </View>
    </View>
  )
}

export default GoalCard
