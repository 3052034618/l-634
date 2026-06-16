import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'

interface ProgressRingProps {
  percent: number
  size?: number
  strokeWidth?: number
  color?: string
  bgColor?: string
  label?: string
  value?: string
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  percent,
  size = 160,
  strokeWidth = 12,
  color = '#10b981',
  bgColor = '#f1f5f9',
  label,
  value
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const displayPercent = Math.min(Math.max(percent, 0), 1)
  const offset = circumference * (1 - displayPercent)

  return (
    <View className={styles.wrap} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <View className={styles.center}>
        {label && <Text className={styles.label}>{label}</Text>}
        {value && <Text className={styles.value} style={{ color }}>{value}</Text>}
      </View>
    </View>
  )
}

export default ProgressRing
