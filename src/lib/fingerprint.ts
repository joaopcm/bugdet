import { createHash } from 'node:crypto'

function normalizeMerchant(name: string): string {
  return name.toLowerCase().trim()
}

export function generateTransactionFingerprint(params: {
  userId: string
  date: string
  merchantName: string
  amount: number
  currency: string
}): string {
  const data = [
    params.userId,
    params.date,
    normalizeMerchant(params.merchantName),
    params.amount.toString(),
    params.currency.toUpperCase(),
  ].join('|')
  return createHash('sha256').update(data).digest('hex')
}
