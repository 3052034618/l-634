import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'

export interface LineDataPoint {
  label: string
  value: number
}

interface LineChartProps {
  data: LineDataPoint[]
  height?: number
  color?: string
  showArea?: boolean
  yAxisCount?: number
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 280,
  color = '#10b981',
  showArea = true,
  yAxisCount = 4
}) => {
  const width = 686
  const padding = { top: 20, right: 20, bottom: 36, left: 48 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const values = data.map((d) => d.value)
  const maxV = Math.max(...values, 1) * 1.1
  const minV = 0

  const points = data.map((d, i) => {
    const x = padding.left + (chartW * i) / Math.max(data.length - 1, 1)
    const y = padding.top + chartH - ((d.value - minV) / (maxV - minV)) * chartH
    return { x, y, ...d }
  })

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')

  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${padding.top + chartH} L ${points[0].x.toFixed(2)} ${padding.top + chartH} Z`
      : ''

  const yTicks = Array.from({ length: yAxisCount + 1 }, (_, i) => {
    const v = (maxV * i) / yAxisCount
    const y = padding.top + chartH - (chartH * i) / yAxisCount
    return { value: v, y }
  })

  return (
    <View className={styles.wrap}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={t.y}
              x2={width - padding.right}
              y2={t.y}
              stroke="#f1f5f9"
              strokeWidth={1}
            />
            <text
              x={padding.left - 8}
              y={t.y + 4}
              textAnchor="end"
              fontSize={10}
              fill="#94a3b8"
            >
              {t.value >= 1000 ? `${(t.value / 1000).toFixed(0)}k` : t.value.toFixed(0)}
            </text>
          </g>
        ))}

        {showArea && areaPath && (
          <path
            d={areaPath}
            fill={color}
            opacity={0.12}
          />
        )}

        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={5} fill="#fff" stroke={color} strokeWidth={2.5} />
            <text
              x={p.x}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              fontSize={10}
              fill="#94a3b8"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </View>
  )
}

export default LineChart
