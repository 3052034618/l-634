import React, { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import { useAccountStore } from './store/accountStore'
import { useTransactionStore } from './store/transactionStore'
import { useBudgetStore } from './store/budgetStore'
import { useGoalStore } from './store/goalStore'
import { useCreditStore } from './store/creditStore'
import './app.scss'

function App({ children }: { children: React.ReactNode }) {
  const initApp = useAppStore((s) => s.initApp)
  const loadAccounts = useAccountStore((s) => s.loadAccounts)
  const loadTransactions = useTransactionStore((s) => s.loadTransactions)
  const loadBudgets = useBudgetStore((s) => s.loadBudgets)
  const loadGoals = useGoalStore((s) => s.loadGoals)
  const loadBills = useCreditStore((s) => s.loadBills)
  const checkBudgetAlerts = useBudgetStore((s) => s.checkBudgetAlerts)
  const checkReminders = useCreditStore((s) => s.checkReminders)

  useEffect(() => {
    console.log('[App] Initializing...')
    initApp()
    loadAccounts()
    loadTransactions()
    loadBudgets()
    loadGoals()
    loadBills()

    setTimeout(() => {
      checkBudgetAlerts()
      checkReminders()
    }, 500)
  }, [])

  return <>{children}</>
}

export default App
