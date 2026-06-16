import { create } from 'zustand'
import type { Category } from '@/types'
import { defaultCategories } from '@/data/categories'
import { getStorageSync, setStorageSync } from '@/utils/storage'

const CAT_KEY = 'categories'

interface AppState {
  categories: Category[]
  initialized: boolean
  initApp: () => void
  getCategoriesByType: (type: 'income' | 'expense') => Category[]
  getCategoryById: (id: string) => Category | undefined
  addCategory: (category: Category) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  categories: [],
  initialized: false,

  initApp: () => {
    const stored = getStorageSync<Category[]>(CAT_KEY)
    if (stored && stored.length > 0) {
      set({ categories: stored, initialized: true })
    } else {
      setStorageSync(CAT_KEY, defaultCategories)
      set({ categories: defaultCategories, initialized: true })
    }
    console.log('[AppStore] Initialized with', get().categories.length, 'categories')
  },

  getCategoriesByType: (type) => {
    return get().categories.filter((c) => c.type === type)
  },

  getCategoryById: (id) => {
    return get().categories.find((c) => c.id === id)
  },

  addCategory: (category) => {
    const updated = [...get().categories, category]
    setStorageSync(CAT_KEY, updated)
    set({ categories: updated })
  }
}))
