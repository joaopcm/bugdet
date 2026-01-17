import {
  DATE_PRESETS,
  type DatePreset,
} from '@/components/logged-in/shared/date-range-filter'
import { parseAsLocalDate } from '@/lib/utils'
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs'
import { useCallback, useEffect, useRef } from 'react'

const STORAGE_KEY = 'transactions-date-preset'
const DEFAULT_PRESET: DatePreset = '30d'

function getStoredPreset(): DatePreset {
  if (typeof window === 'undefined') return DEFAULT_PRESET

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_PRESET

    if (DATE_PRESETS.includes(stored as DatePreset)) {
      return stored as DatePreset
    }
  } catch {
    // localStorage unavailable or blocked, fall through to default
  }

  return DEFAULT_PRESET
}

function setStoredPreset(preset: DatePreset): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, preset)
  } catch {
    // localStorage unavailable or blocked, silently fail
  }
}

export function useTransactionsFilters() {
  const initialPreset = getStoredPreset()
  const storedPresetRef = useRef<DatePreset>(initialPreset)

  const [transactionFilters, setQueryFilters] = useQueryStates({
    category: parseAsString.withDefault('all'),
    preset: parseAsStringLiteral(DATE_PRESETS).withDefault(initialPreset),
    from: parseAsLocalDate,
    to: parseAsLocalDate,
    query: parseAsString.withDefault(''),
    ids: parseAsArrayOf(parseAsString).withDefault([]),
    uploadId: parseAsString.withDefault('all'),
  })

  // Sync external URL changes (browser navigation) to localStorage
  useEffect(() => {
    if (transactionFilters.preset !== storedPresetRef.current) {
      setStoredPreset(transactionFilters.preset)
      storedPresetRef.current = transactionFilters.preset
    }
  }, [transactionFilters.preset])

  const setTransactionFilters = useCallback(
    (
      updates: Partial<{
        category: string | null
        preset: DatePreset
        from: Date | null
        to: Date | null
        query: string | null
        ids: string[] | null
        uploadId: string | null
      }>,
    ) => {
      if (updates.preset !== undefined) {
        setStoredPreset(updates.preset)
        storedPresetRef.current = updates.preset
      }
      return setQueryFilters(updates)
    },
    [setQueryFilters],
  )

  return {
    transactionFilters,
    setTransactionFilters,
  }
}
