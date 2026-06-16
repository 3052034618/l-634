import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'
import classnames from 'classnames'

interface CategoryTagProps {
  icon: string
  name: string
  color?: string
  active?: boolean
  onClick?: () => void
  size?: 'sm' | 'md'
}

const CategoryTag: React.FC<CategoryTagProps> = ({
  icon,
  name,
  color = '#10b981',
  active = false,
  onClick,
  size = 'md'
}) => {
  return (
    <View
      className={classnames(
        styles.tag,
        size === 'sm' && styles.sm,
        active && styles.active
      )}
      style={{
        backgroundColor: active ? `${color}15` : '#f8fafc',
        borderColor: active ? color : 'transparent'
      }}
      onClick={onClick}
    >
      <Text className={styles.icon}>{icon}</Text>
      <Text className={styles.name} style={{ color: active ? color : '#475569' }}>
        {name}
      </Text>
    </View>
  )
}

export default CategoryTag
