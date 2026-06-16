import type { Category } from '@/types'
import { getStorageSync, setStorageSync } from './storage'

interface LearnedPattern {
  keyword: string
  categoryId: string
  categoryName: string
  count: number
}

const LEARNED_KEY = 'learned_patterns'

const loadLearnedPatterns = (): LearnedPattern[] => {
  return getStorageSync<LearnedPattern[]>(LEARNED_KEY, []) || []
}

const saveLearnedPatterns = (patterns: LearnedPattern[]): void => {
  setStorageSync(LEARNED_KEY, patterns)
}

export const learnClassification = (
  description: string,
  merchant: string | undefined,
  categoryId: string,
  categoryName: string
): void => {
  const patterns = loadLearnedPatterns()
  const tokens = extractKeywords(description, merchant)

  tokens.forEach((token) => {
    if (token.length < 2) return
    const existing = patterns.find(
      (p) => p.keyword.toLowerCase() === token.toLowerCase() && p.categoryId === categoryId
    )
    if (existing) {
      existing.count += 1
    } else {
      patterns.push({
        keyword: token.toLowerCase(),
        categoryId,
        categoryName,
        count: 1
      })
    }
  })

  saveLearnedPatterns(patterns)
}

const extractKeywords = (description: string, merchant?: string): string[] => {
  const text = `${description || ''} ${merchant || ''}`.trim()
  if (!text) return []
  return text
    .split(/[\s,，.。!！?？、\/\\()（）\-_【】\[\]:：;；]+/)
    .filter((t) => t.length >= 2)
    .slice(0, 10)
}

export const classifyTransaction = (
  description: string,
  merchant: string | undefined,
  categories: Category[]
): { categoryId: string; categoryName: string; confidence: number; isAuto: boolean } => {
  const tokens = extractKeywords(description, merchant)
  const learned = loadLearnedPatterns()

  let bestMatch: { categoryId: string; categoryName: string; score: number } | null = null

  tokens.forEach((token) => {
    const lowerToken = token.toLowerCase()

    const learnedMatch = learned
      .filter((p) => lowerToken.includes(p.keyword) || p.keyword.includes(lowerToken))
      .sort((a, b) => b.count - a.count)[0]

    if (learnedMatch) {
      const score = Math.min(learnedMatch.count * 0.3, 0.9)
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          categoryId: learnedMatch.categoryId,
          categoryName: learnedMatch.categoryName,
          score
        }
      }
    }

    categories.forEach((cat) => {
      cat.keywords.forEach((kw) => {
        if (lowerToken.includes(kw.toLowerCase()) || kw.toLowerCase().includes(lowerToken)) {
          const score = 0.85
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = {
              categoryId: cat.id,
              categoryName: cat.name,
              score
            }
          }
        }
      })
    })
  })

  if (bestMatch) {
    return {
      categoryId: bestMatch.categoryId,
      categoryName: bestMatch.categoryName,
      confidence: bestMatch.score,
      isAuto: true
    }
  }

  const defaultExpense = categories.find((c) => c.type === 'expense' && c.name === '其他')
  const defaultCategory = defaultExpense || categories.find((c) => c.type === 'expense')
  if (defaultCategory) {
    return {
      categoryId: defaultCategory.id,
      categoryName: defaultCategory.name,
      confidence: 0.3,
      isAuto: true
    }
  }

  return {
    categoryId: '',
    categoryName: '未分类',
    confidence: 0,
    isAuto: false
  }
}
