import type { Category } from '@/types'
import { getStorageSync, setStorageSync } from './storage'

interface LearnedPattern {
  keyword: string
  categoryId: string
  categoryName: string
  count: number
  lastUsed: number
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
    
    const lowerToken = token.toLowerCase()
    
    const existing = patterns.find(
      (p) => p.keyword.toLowerCase() === lowerToken && p.categoryId === categoryId
    )
    
    if (existing) {
      existing.count += 1
      existing.lastUsed = Date.now()
    } else {
      patterns.push({
        keyword: lowerToken,
        categoryId,
        categoryName,
        count: 1,
        lastUsed: Date.now()
      })
    }
  })

  const sortedPatterns = patterns
    .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed)
    .slice(0, 500)

  saveLearnedPatterns(sortedPatterns)
}

const extractKeywords = (description: string, merchant?: string): string[] => {
  const text = `${description || ''} ${merchant || ''}`.trim()
  if (!text) return []
  
  const tokens = text
    .split(/[\s,，.。!！?？、\/\\()（）\-_【】\[\]:：;；]+/)
    .filter((t) => t.length >= 2)
    .slice(0, 10)
  
  const ngrams: string[] = []
  tokens.forEach((token) => {
    if (token.length >= 4) {
      ngrams.push(token.substring(0, 4))
    }
    ngrams.push(token)
  })
  
  return [...new Set(ngrams)]
}

export const classifyTransaction = (
  description: string,
  merchant: string | undefined,
  categories: Category[]
): { categoryId: string; categoryName: string; confidence: number; isAuto: boolean } => {
  const tokens = extractKeywords(description, merchant)
  const learned = loadLearnedPatterns()

  let bestMatch: { categoryId: string; categoryName: string; score: number; fromLearned: boolean } | null = null

  tokens.forEach((token) => {
    const lowerToken = token.toLowerCase()

    const learnedMatches = learned
      .filter((p) => lowerToken.includes(p.keyword) || p.keyword.includes(lowerToken))
      .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed)

    if (learnedMatches.length > 0) {
      const topMatch = learnedMatches[0]
      const baseScore = 0.95
      const countBonus = Math.min(topMatch.count * 0.02, 0.05)
      const score = baseScore + countBonus
      
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          categoryId: topMatch.categoryId,
          categoryName: topMatch.categoryName,
          score,
          fromLearned: true
        }
      }
    }

    if (!bestMatch || !bestMatch.fromLearned) {
      categories.forEach((cat) => {
        cat.keywords.forEach((kw) => {
          const lowerKw = kw.toLowerCase()
          if (lowerToken.includes(lowerKw) || lowerKw.includes(lowerToken)) {
            const score = 0.85
            if (!bestMatch || score > bestMatch.score) {
              bestMatch = {
                categoryId: cat.id,
                categoryName: cat.name,
                score,
                fromLearned: false
              }
            }
          }
        })
      })
    }
  })

  if (bestMatch) {
    return {
      categoryId: bestMatch.categoryId,
      categoryName: bestMatch.categoryName,
      confidence: Math.min(bestMatch.score, 1.0),
      isAuto: true
    }
  }

  const defaultCategory = categories.find((c) => c.type === 'expense' && c.name === '其他')
    || categories.find((c) => c.type === 'expense' && c.name.toLowerCase().includes('其他'))
    || categories.find((c) => c.type === 'expense')

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
