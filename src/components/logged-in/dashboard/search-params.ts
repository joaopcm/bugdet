import {
  DATE_PRESETS,
  type DatePreset,
} from '@/components/logged-in/shared/date-range-filter'
import { parseAsLocalDate } from '@/lib/utils'
import { startOfYear, subDays, subMonths } from 'date-fns'
import { parseAsStringLiteral, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useRef } from 'react'

export { DATE_PRESETS, type DatePreset }
export { getPresetLabel } from '@/components/logged-in/shared/date-range-filter'

const STORAGE_KEY = 'dashboard-date-preset'
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

export function useDashboardFilters() {
  const initialPreset = getStoredPreset()
  const storedPresetRef = useRef<DatePreset>(initialPreset)

  const [filters, setQueryFilters] = useQueryStates({
    preset: parseAsStringLiteral(DATE_PRESETS).withDefault(initialPreset),
    from: parseAsLocalDate,
    to: parseAsLocalDate,
  })

  // Sync external URL changes (browser navigation) to localStorage
  useEffect(() => {
    if (filters.preset !== storedPresetRef.current) {
      setStoredPreset(filters.preset)
      storedPresetRef.current = filters.preset
    }
  }, [filters.preset])

  const setFilters = useCallback(
    (updates: {
      preset?: DatePreset
      from?: Date | null
      to?: Date | null
    }) => {
      if (updates.preset !== undefined) {
        setStoredPreset(updates.preset)
        storedPresetRef.current = updates.preset
      }
      return setQueryFilters(updates)
    },
    [setQueryFilters],
  )

  return { filters, setFilters }
}

export function getDateRangeFromPreset(
  preset: DatePreset,
  customFrom?: Date | null,
  customTo?: Date | null,
): { from: Date; to: Date } {
  const now = new Date()

  switch (preset) {
    case '7d':
      return { from: subDays(now, 7), to: now }
    case '30d':
      return { from: subDays(now, 30), to: now }
    case '3m':
      return { from: subMonths(now, 3), to: now }
    case '6m':
      return { from: subMonths(now, 6), to: now }
    case 'ytd':
      return { from: startOfYear(now), to: now }
    case 'custom':
      return {
        from: customFrom ?? subDays(now, 30),
        to: customTo ?? now,
      }
  }
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
