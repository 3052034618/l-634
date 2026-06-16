import React, { useState, useMemo } from 'react'
import { View, Text, Input, useDidShow, useRouter, navigateBack, showToast, showModal } from '@tarojs/taro'
import { useGoalStore } from '@/store/goalStore'
import { formatMoney, formatDateTime } from '@/utils/format'
import dayjs from 'dayjs'
import styles from './index.module.scss'

const GoalDetailPage: React.FC = () => {
  const router = useRouter()
  const id = router.params.id as string
  const loadGoals = useGoalStore((s) => s.loadGoals)
  const getGoalById = useGoalStore((s) => s.getGoalById)
  const contribute = useGoalStore((s) => s.contribute)
  const deleteGoal = useGoalStore((s) => s.deleteGoal)
  const messages = useGoalStore((s) => s.messages)

  const [showContribute, setShowContribute] = useState(false)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  useDidShow(() => {
    loadGoals()
  })

  const goal = useMemo(() => getGoalById(id), [id, getGoalById])

  if (!goal) {
    return (
      <View className={styles.page}>
        <View className={styles.empty}>目标不存在</View>
      </View>
    )
  }

  const percent = (goal.currentAmount / goal.targetAmount) * 100
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0)

  const goalMessages = useMemo(
    () => messages.filter((m) => m.goalId === id).slice(0, 10),
    [messages, id]
  )

  const handleContribute = () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }
    if (amt > remaining) {
      showModal({
        title: '超过目标金额',
        content: `存款将超出目标 ¥${formatMoney(amt - remaining)}，是否继续？`,
        success: (res) => {
          if (res.confirm) {
            doContribute(amt)
          }
        }
      })
      return
    }
    doContribute(amt)
  }

  const doContribute = (amt: number) => {
    contribute(goal.id, amt, note.trim() || undefined)
    setShowContribute(false)
    setAmount('')
    setNote('')
    showToast({ title: '存款成功', icon: 'success' })
  }

  const handleDelete = () => {
    showModal({
      title: '确认删除',
      content: '确定要删除这个存钱目标吗？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          deleteGoal(goal.id)
          showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => navigateBack(), 500)
        }
      }
    })
  }

  return (
    <View className={styles.page}>
      <View
        className={styles.header}
        style={{ background: `linear-gradient(135deg, ${goal.color}, ${goal.color}cc)` }}
      >
        <View className={styles.goalIconWrap}>
          <Text>{goal.icon}</Text>
        </View>
        <Text className={styles.goalName}>{goal.name}</Text>
        {goal.deadline && (
          <Text className={styles.goalDeadline}>目标日期: {goal.deadline}</Text>
        )}
        <View className={styles.amountRow}>
          <Text className={styles.currentAmount}>¥{formatMoney(goal.currentAmount)}</Text>
          <Text className={styles.separator}>/</Text>
          <Text className={styles.targetAmount}>¥{formatMoney(goal.targetAmount)}</Text>
        </View>
        <View className={styles.percentWrap}>
          <View className={styles.percentBadge}>{percent.toFixed(1)}%</View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.progressCard}>
          <View className={styles.progressBar}>
            <View
              className={styles.progressFill}
              style={{
                width: `${Math.min(percent, 100)}%`,
                background: `linear-gradient(90deg, ${goal.color}, ${goal.color}cc)`
              }}
            />
          </View>
          <View className={styles.progressInfo}>
            <Text>还差 ¥{formatMoney(remaining)}</Text>
            <Text>{goal.contributions?.length || 0} 笔存款</Text>
          </View>
        </View>

        {goalMessages.length > 0 && (
          <View className={styles.messagesCard}>
            <View className={styles.cardHeader}>鼓励与里程碑</View>
            {goalMessages.map((msg) => (
              <View key={msg.id} className={styles.messageItem}>
                <Text className={styles.messageIcon}>
                  {msg.type === 'complete' ? '🎉' : msg.type === 'milestone' ? '✨' : '💪'}
                </Text>
                <View className={styles.messageContent}>
                  <Text className={styles.messageText}>{msg.message}</Text>
                  <Text className={styles.messageTime}>
                    {formatDateTime(msg.triggeredAt)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View className={styles.contributionsCard}>
          <View className={styles.cardHeader}>存款记录</View>
          {goal.contributions && goal.contributions.length > 0 ? (
            goal.contributions.map((c) => (
              <View key={c.id} className={styles.contributionItem}>
                <View className={styles.contributionInfo}>
                  <Text className={styles.contributionDate}>{c.date}</Text>
                  {c.note && <Text className={styles.contributionNote}>{c.note}</Text>}
                </View>
                <Text className={styles.contributionAmount}>+¥{formatMoney(c.amount)}</Text>
              </View>
            ))
          ) : (
            <View className={styles.empty}>暂无存款记录</View>
          )}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={`${styles.btn} ${styles.btnContribute}`} onClick={() => setShowContribute(true)}>
          <Text>存入金额</Text>
        </View>
        <View className={`${styles.btn} ${styles.btnDelete}`} onClick={handleDelete}>
          <Text>删除</Text>
        </View>
      </View>

      {showContribute && (
        <View className={styles.modalMask} onClick={() => setShowContribute(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>存入金额</Text>
            <View className={styles.modalRow}>
              <Text className={styles.modalLabel}>存款金额</Text>
              <Input
                className={styles.modalInput}
                type="digit"
                placeholder="0.00"
                value={amount}
                onInput={(e) => setAmount(e.detail.value)}
              />
            </View>
            <View className={styles.modalRow}>
              <Text className={styles.modalLabel}>备注（可选）</Text>
              <Input
                className={styles.modalInput}
                placeholder="例如：发工资啦"
                value={note}
                onInput={(e) => setNote(e.detail.value)}
              />
            </View>
            <View className={styles.modalActions}>
              <View
                className={`${styles.modalBtn} ${styles.btnCancel}`}
                onClick={() => setShowContribute(false)}
              >
                <Text>取消</Text>
              </View>
              <View
                className={`${styles.modalBtn} ${styles.btnConfirm}`}
                onClick={handleContribute}
              >
                <Text>确认存入</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default GoalDetailPage
