import {
  DATE_PRESETS,
  type DatePreset,
  getActivePreset,
  getDateRangeFromPreset,
} from '@/components/logged-in/shared/date-range-filter'
import { parseAsLocalDate } from '@/lib/utils'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useRef } from 'react'

const STORAGE_KEY = 'transactions-date-preset'
const DEFAULT_PRESET: Exclude<DatePreset, 'custom'> = '30d'

function getStoredPreset(): Exclude<DatePreset, 'custom'> {
  if (typeof window === 'undefined') return DEFAULT_PRESET

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_PRESET

    const validPresets = DATE_PRESETS.filter((p) => p !== 'custom')
    if (validPresets.includes(stored as Exclude<DatePreset, 'custom'>)) {
      return stored as Exclude<DatePreset, 'custom'>
    }
  } catch {
    // localStorage unavailable or blocked
  }

  return DEFAULT_PRESET
}

function setStoredPreset(preset: Exclude<DatePreset, 'custom'>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, preset)
  } catch {
    // localStorage unavailable or blocked
  }
}

export function useTransactionsFilters() {
  const initializedRef = useRef(false)

  const [transactionFilters, setQueryFilters] = useQueryStates({
    category: parseAsString.withDefault('all'),
    from: parseAsLocalDate,
    to: parseAsLocalDate,
    query: parseAsString.withDefault(''),
    ids: parseAsArrayOf(parseAsString).withDefault([]),
    uploadId: parseAsString.withDefault('all'),
  })

  // Initialize from localStorage on first render if URL has no dates
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    if (!transactionFilters.from && !transactionFilters.to) {
      const storedPreset = getStoredPreset()
      const range = getDateRangeFromPreset(storedPreset)
      setQueryFilters({ from: range.from, to: range.to })
    }
  }, [transactionFilters.from, transactionFilters.to, setQueryFilters])

  // Persist active preset to localStorage when dates change
  const prevPresetRef = useRef<DatePreset | null>(null)
  useEffect(() => {
    if (!transactionFilters.from || !transactionFilters.to) return

    const activePreset = getActivePreset(
      transactionFilters.from,
      transactionFilters.to,
    )
    if (activePreset !== 'custom' && activePreset !== prevPresetRef.current) {
      setStoredPreset(activePreset)
      prevPresetRef.current = activePreset
    }
  }, [transactionFilters.from, transactionFilters.to])

  const setTransactionFilters = useCallback(
    (
      updates: Partial<{
        category: string | null
        from: Date | null
        to: Date | null
        query: string | null
        ids: string[] | null
        uploadId: string | null
      }>,
    ) => {
      return setQueryFilters(updates)
    },
    [setQueryFilters],
  )

  return {
    transactionFilters,
    setTransactionFilters,
  }
}
