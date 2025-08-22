import { type ClassValue, clsx } from 'clsx'
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
