import { PLATFORM_MODIFIERS } from '@/constants/platforms'
import { type ClassValue, clsx } from 'clsx'
import { format } from 'date-fns'
import { createParser } from 'nuqs/server'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}

export function formatCurrency(cents: number, currency: string): string {
  const price = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price)
}

export function getCurrencyCode(currency?: string): string {
  if (currency) {
    return currency
  }

  return Intl.NumberFormat().resolvedOptions().currency || 'USD'
}

export function getCurrencySymbol(currency?: string): string {
  const currencyCode = currency || getCurrencyCode()
  return (
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    })
      .formatToParts(1)
      .find((part) => part.type === 'currency')?.value || ''
  )
}

export function parseCurrency(value: string) {
  const parsedValue = value.replace(/\D/g, '')
  return Number(parsedValue)
}

function isValidDate(year: number, month: number, day: number) {
  if (month < 1 || month > 12) {
    return false
  }

  if (day < 1) {
    return false
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  return day <= daysInMonth
}

export const parseAsLocalDate = createParser({
  parse(value: string) {
    if (!value) return null

    // Handle ISO date strings (YYYY-MM-DD) by treating them as local dates
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number)

      if (!isValidDate(year, month, day)) {
        return null
      }

      return new Date(year, month - 1, day)
    }

    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  },
  serialize(value: Date) {
    return format(value, 'yyyy-MM-dd')
  },
})

type Platform = 'mac' | 'windows' | 'linux' | 'unknown'

export function detectPlatform(): Platform {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'unknown'
  }

  const userAgent = navigator.userAgent.toLowerCase()
  const platform = navigator.platform?.toLowerCase() || ''

  if (
    platform.includes('mac') ||
    userAgent.includes('mac os') ||
    userAgent.includes('macos') ||
    platform.includes('darwin')
  ) {
    return 'mac'
  }

  if (
    platform.includes('win') ||
    userAgent.includes('windows') ||
    userAgent.includes('win32') ||
    userAgent.includes('win64')
  ) {
    return 'windows'
  }

  if (
    platform.includes('linux') ||
    userAgent.includes('linux') ||
    userAgent.includes('x11')
  ) {
    return 'linux'
  }

  return 'unknown'
}

export function getPlatformModifiers() {
  const platform = detectPlatform()

  if (platform === 'unknown') {
    return PLATFORM_MODIFIERS.mac
  }

  return PLATFORM_MODIFIERS[platform]
}

export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  const pluralForm = plural ?? `${singular}s`
  return count === 1 ? singular : pluralForm
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
