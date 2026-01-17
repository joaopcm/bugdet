import {
  DATE_PRESETS,
  type DatePreset,
  getActivePreset,
  getDateRangeFromPreset,
} from '@/components/logged-in/shared/date-range-filter'
import { parseAsLocalDate } from '@/lib/utils'
import { useQueryStates } from 'nuqs'
import { useCallback, useEffect, useRef } from 'react'

export {
  DATE_PRESETS,
  type DatePreset,
  getActivePreset,
  getDateRangeFromPreset,
}

const STORAGE_KEY = 'dashboard-date-preset'
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

export function useDashboardFilters() {
  const initializedRef = useRef(false)

  const [filters, setQueryFilters] = useQueryStates({
    from: parseAsLocalDate,
    to: parseAsLocalDate,
  })

  // Initialize from localStorage on first render if URL has no dates
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    if (!filters.from && !filters.to) {
      const storedPreset = getStoredPreset()
      const range = getDateRangeFromPreset(storedPreset)
      setQueryFilters({ from: range.from, to: range.to })
    }
  }, [filters.from, filters.to, setQueryFilters])

  // Persist active preset to localStorage when dates change
  const prevPresetRef = useRef<DatePreset | null>(null)
  useEffect(() => {
    if (!filters.from || !filters.to) return

    const activePreset = getActivePreset(filters.from, filters.to)
    if (activePreset !== 'custom' && activePreset !== prevPresetRef.current) {
      setStoredPreset(activePreset)
      prevPresetRef.current = activePreset
    }
  }, [filters.from, filters.to])

  const setFilters = useCallback(
    (updates: { from: Date; to: Date }) => {
      return setQueryFilters(updates)
    },
    [setQueryFilters],
  )

  return { filters, setFilters }
}

export function getGroupByFromPreset(
  preset: DatePreset,
): 'day' | 'week' | 'month' {
  switch (preset) {
    case '7d':
    case '30d':
      return 'day'
    case '3m':
      return 'week'
    case '6m':
    case 'ytd':
    case 'custom':
      return 'month'
  }
}
