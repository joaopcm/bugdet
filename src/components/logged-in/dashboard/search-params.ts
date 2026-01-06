import { parseAsLocalDate } from '@/lib/utils'
import { endOfYear, startOfYear, subDays, subMonths } from 'date-fns'
import { parseAsStringLiteral, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useMemo } from 'react'

export const DATE_PRESETS = ['7d', '30d', '3m', '6m', 'ytd', 'custom'] as const
export type DatePreset = (typeof DATE_PRESETS)[number]

const STORAGE_KEY = 'dashboard-date-preset'
const DEFAULT_PRESET: DatePreset = '30d'

function getStoredPreset(): DatePreset {
  if (typeof window === 'undefined') return DEFAULT_PRESET

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return DEFAULT_PRESET

  if (DATE_PRESETS.includes(stored as DatePreset)) {
    return stored as DatePreset
  }

  return DEFAULT_PRESET
}

function setStoredPreset(preset: DatePreset): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, preset)
}

export function useDashboardFilters() {
  const storedPreset = useMemo(() => getStoredPreset(), [])

  const [filters, setQueryFilters] = useQueryStates({
    preset: parseAsStringLiteral(DATE_PRESETS).withDefault(storedPreset),
    from: parseAsLocalDate,
    to: parseAsLocalDate,
  })

  // Sync preset changes to localStorage
  useEffect(() => {
    if (filters.preset !== storedPreset) {
      setStoredPreset(filters.preset)
    }
  }, [filters.preset, storedPreset])

  const setFilters = useCallback(
    (updates: {
      preset?: DatePreset
      from?: Date | null
      to?: Date | null
    }) => {
      // If preset is being updated, also persist to localStorage
      if (updates.preset !== undefined) {
        setStoredPreset(updates.preset)
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
      return { from: startOfYear(now), to: endOfYear(now) }
    case 'custom':
      return {
        from: customFrom ?? subDays(now, 30),
        to: customTo ?? now,
      }
  }
}

export function getPresetLabel(preset: DatePreset): string {
  switch (preset) {
    case '7d':
      return 'Last 7 days'
    case '30d':
      return 'Last 30 days'
    case '3m':
      return 'Last 3 months'
    case '6m':
      return 'Last 6 months'
    case 'ytd':
      return 'Year to date'
    case 'custom':
      return 'Custom'
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
