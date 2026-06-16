import React, { useState, useMemo } from 'react'
import { View, Text, Input, useDidShow, navigateTo, showToast } from '@tarojs/taro'
import { useGoalStore } from '@/store/goalStore'
import { formatMoney } from '@/utils/format'
import dayjs from 'dayjs'
import styles from './index.module.scss'

const GOAL_ICONS = ['🏠', '🚗', '🎓', '💍', '✈️', '📱', '💻', '🎮', '💰', '🎯', '🏖️', '🎁']
const GOAL_COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#06b6d4']

const GoalListPage: React.FC = () => {
  const loadGoals = useGoalStore((s) => s.loadGoals)
  const goals = useGoalStore((s) => s.goals)
  const addGoal = useGoalStore((s) => s.addGoal)
  const contribute = useGoalStore((s) => s.contribute)
  const getTotalSaved = useGoalStore((s) => s.getTotalSaved)
  const getActiveGoals = useGoalStore((s) => s.getActiveGoals)
  const getCompletedGoals = useGoalStore((s) => s.getCompletedGoals)

  const [tab, setTab] = useState<'active' | 'completed'>('active')
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [icon, setIcon] = useState('🎯')
  const [color, setColor] = useState(GOAL_COLORS[0])

  useDidShow(() => {
    loadGoals()
  })

  const totalSaved = useMemo(() => getTotalSaved(), [goals, getTotalSaved])
  const activeGoals = useMemo(() => getActiveGoals(), [goals, getActiveGoals])
  const completedGoals = useMemo(() => getCompletedGoals(), [goals, getCompletedGoals])
  const displayGoals = tab === 'active' ? activeGoals : completedGoals

  const totalTarget = useMemo(
    () => activeGoals.reduce((sum, g) => sum + g.targetAmount, 0),
    [activeGoals]
  )

  const handleGoalClick = (id: string) => {
    navigateTo({ url: `/pages/goal-detail/index?id=${id}` })
  }

  const handleOpenModal = () => {
    setName('')
    setTargetAmount('')
    setDeadline('')
    setIcon('🎯')
    setColor(GOAL_COLORS[0])
    setShowModal(true)
  }

  const handleSaveGoal = () => {
    if (!name.trim()) {
      showToast({ title: '请输入目标名称', icon: 'none' })
      return
    }
    const target = parseFloat(targetAmount)
    if (!target || target <= 0) {
      showToast({ title: '请输入目标金额', icon: 'none' })
      return
    }
    addGoal({
      name: name.trim(),
      targetAmount: target,
      deadline: deadline || undefined,
      icon,
      color
    })
    setShowModal(false)
    showToast({ title: '目标创建成功', icon: 'success' })
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>存钱目标</Text>
        <View className={styles.statsRow}>
          <View className={styles.stat}>
            <Text className={styles.statLabel}>已存款</Text>
            <Text className={styles.statValue}>¥{formatMoney(totalSaved)}</Text>
          </View>
          <View className={styles.stat}>
            <Text className={styles.statLabel}>总目标</Text>
            <Text className={styles.statValue}>¥{formatMoney(totalTarget)}</Text>
          </View>
          <View className={styles.stat}>
            <Text className={styles.statLabel}>完成数</Text>
            <Text className={styles.statValue}>{completedGoals.length}</Text>
          </View>
        </View>
        <View className={styles.tabs}>
          <View
            className={`${styles.tab} ${tab === 'active' ? styles.tabActive : ''}`}
            onClick={() => setTab('active')}
          >
            进行中 ({activeGoals.length})
          </View>
          <View
            className={`${styles.tab} ${tab === 'completed' ? styles.tabActive : ''}`}
            onClick={() => setTab('completed')}
          >
            已完成 ({completedGoals.length})
          </View>
        </View>
      </View>

      <View className={styles.content}>
        {displayGoals.length > 0 ? (
          displayGoals.map((goal) => {
            const percent = (goal.currentAmount / goal.targetAmount) * 100
            return (
              <View
                key={goal.id}
                className={styles.goalCard}
                onClick={() => handleGoalClick(goal.id)}
              >
                <View className={styles.goalTop}>
                  <View
                    className={styles.goalIcon}
                    style={{ background: `${goal.color}20` }}
                  >
                    <Text>{goal.icon}</Text>
                  </View>
                  <View className={styles.goalInfo}>
                    <Text className={styles.goalName}>{goal.name}</Text>
                    {goal.deadline && (
                      <Text className={styles.goalDeadline}>
                        目标日期: {goal.deadline}
                      </Text>
                    )}
                  </View>
                  <View className={styles.goalAmount}>
                    <Text className={styles.currentAmount}>
                      ¥{formatMoney(goal.currentAmount)}
                    </Text>
                    <Text className={styles.targetAmount}>
                      / ¥{formatMoney(goal.targetAmount)}
                    </Text>
                  </View>
                </View>
                <View className={styles.progressWrap}>
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
                    <Text>{percent.toFixed(1)}%</Text>
                    <Text>
                      还差 ¥{formatMoney(Math.max(goal.targetAmount - goal.currentAmount, 0))}
                    </Text>
                  </View>
                </View>
              </View>
            )
          })
        ) : (
          <View className={styles.empty}>
            {tab === 'active' ? '暂无进行中的目标，点击右下角创建' : '暂无已完成的目标'}
          </View>
        )}
      </View>

      <View className={styles.fab} onClick={handleOpenModal}>
        <Text>+</Text>
      </View>

      {showModal && (
        <View className={styles.modalMask} onClick={() => setShowModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>创建存钱目标</Text>
            <View className={styles.modalRow}>
              <Text className={styles.modalLabel}>目标名称</Text>
              <Input
                className={styles.modalInput}
                placeholder="例如：买一辆车"
                value={name}
                onInput={(e) => setName(e.detail.value)}
              />
            </View>
            <View className={styles.modalRow}>
              <Text className={styles.modalLabel}>目标金额</Text>
              <Input
                className={styles.modalInput}
                type="digit"
                placeholder="0.00"
                value={targetAmount}
                onInput={(e) => setTargetAmount(e.detail.value)}
              />
            </View>
            <View className={styles.modalRow}>
              <Text className={styles.modalLabel}>目标日期（可选）</Text>
              <Input
                className={styles.modalInput}
                placeholder="例如：2025-12-31"
                value={deadline}
                onInput={(e) => setDeadline(e.detail.value)}
              />
            </View>
            <View className={styles.modalRow}>
              <Text className={styles.modalLabel}>选择图标</Text>
              <View className={styles.iconPicker}>
                {GOAL_ICONS.map((i) => (
                  <View
                    key={i}
                    className={`${styles.iconOption} ${icon === i ? styles.iconOptionActive : ''}`}
                    onClick={() => setIcon(i)}
                  >
                    <Text>{i}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View className={styles.modalRow}>
              <Text className={styles.modalLabel}>选择颜色</Text>
              <View className={styles.iconPicker}>
                {GOAL_COLORS.map((c) => (
                  <View
                    key={c}
                    className={`${styles.iconOption} ${color === c ? styles.iconOptionActive : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  >
                    <Text style={{ color: '#fff' }}>✓</Text>
                  </View>
                ))}
              </View>
            </View>
            <View className={styles.modalActions}>
              <View className={`${styles.modalBtn} ${styles.btnCancel}`} onClick={() => setShowModal(false)}>
                <Text>取消</Text>
              </View>
              <View className={`${styles.modalBtn} ${styles.btnConfirm}`} onClick={handleSaveGoal}>
                <Text>创建</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default GoalListPage
