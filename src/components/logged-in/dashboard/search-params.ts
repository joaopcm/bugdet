import { parseAsLocalDate } from '@/lib/utils'
import { endOfYear, startOfYear, subDays, subMonths } from 'date-fns'
import { parseAsStringLiteral, useQueryStates } from 'nuqs'

export const DATE_PRESETS = ['7d', '30d', '3m', '6m', 'ytd', 'custom'] as const
export type DatePreset = (typeof DATE_PRESETS)[number]

export function useDashboardFilters() {
  const [filters, setFilters] = useQueryStates({
    preset: parseAsStringLiteral(DATE_PRESETS).withDefault('30d'),
    from: parseAsLocalDate,
    to: parseAsLocalDate,
  })

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
