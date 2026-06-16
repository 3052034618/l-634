import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'

interface SectionHeaderProps {
  title: string
  actionText?: string
  onAction?: () => void
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, actionText, onAction }) => {
  return (
    <View className={styles.wrap}>
      <Text className={styles.title}>{title}</Text>
      {actionText && (
        <Text className={styles.action} onClick={onAction}>
          {actionText} ›
        </Text>
      )}
    </View>
  )
}

export default SectionHeader
