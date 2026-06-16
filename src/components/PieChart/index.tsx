import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'

export interface PieDataItem {
  name: string
  value: number
  color: string
}

interface PieChartProps {
  data: PieDataItem[]
  size?: number
  centerLabel?: string
  centerValue?: string
}

const PieChart: React.FC<PieChartProps> = ({ data, size = 320, centerLabel, centerValue }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const radius = size / 2 - 20
  const innerRadius = radius * 0.55
  const cx = size / 2
  const cy = size / 2

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  const describeArc = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
    const startOuter = polarToCartesian(cx, cy, outerR, endAngle)
    const endOuter = polarToCartesian(cx, cy, outerR, startAngle)
    const startInner = polarToCartesian(cx, cy, innerR, startAngle)
    const endInner = polarToCartesian(cx, cy, innerR, endAngle)
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1

    return [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
      'Z'
    ].join(' ')
  }

  let currentAngle = 0
  const paths = data.map((d) => {
    const angle = total > 0 ? (d.value / total) * 360 : 0
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle
    return {
      ...d,
      path: angle >= 360
        ? describeArc(0.1, 359.9, radius, innerRadius)
        : describeArc(startAngle, endAngle, radius, innerRadius),
      percent: total > 0 ? (d.value / total) * 100 : 0
    }
  })

  return (
    <View className={styles.wrap}>
      <View className={styles.chartWrap} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {paths.map((p, i) => (
            <path key={i} d={p.path} fill={p.color} opacity={0.9} />
          ))}
        </svg>
        <View className={styles.centerText}>
          {centerLabel && <Text className={styles.centerLabel}>{centerLabel}</Text>}
          {centerValue && <Text className={styles.centerValue}>{centerValue}</Text>}
        </View>
      </View>
      <View className={styles.legend}>
        {data.map((d, i) => (
          <View key={i} className={styles.legendItem}>
            <View className={styles.dot} style={{ backgroundColor: d.color }} />
            <Text className={styles.legendName}>{d.name}</Text>
            <Text className={styles.legendValue}>
              {paths[i]?.percent.toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export default PieChart
