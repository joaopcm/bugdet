import { createHash } from 'node:crypto'

function normalizeMerchant(name: string): string {
  return name.toLowerCase().trim()
}

export function generateTransactionFingerprint(params: {
  tenantId: string
  date: string
  merchantName: string
  amount: number
  currency: string
}): string {
  const data = [
    params.tenantId,
    params.date,
    normalizeMerchant(params.merchantName),
    params.amount.toString(),
    params.currency.toUpperCase(),
  ].join('|')
  return createHash('sha256').update(data).digest('hex')
}
