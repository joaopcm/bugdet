import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { TransactionMetadata } from '@/db/schema'
import { formatCurrency } from '@/lib/utils'

interface AmountProps {
  amount: number
  currency: string
  metadata: TransactionMetadata | null
}

export function Amount({ amount, currency, metadata }: AmountProps) {
  const formattedAmount = formatCurrency(amount, currency)
  const hasMetadata = metadata && Object.keys(metadata).length > 0

  if (!hasMetadata) {
    return formattedAmount
  }

  return (
    <Tooltip>
      <TooltipTrigger className="cursor-pointer underline decoration-dashed underline-offset-2">
        {formattedAmount}
      </TooltipTrigger>
      <TooltipContent side="right">
        <ul className="grid gap-3 text-xs">
          {metadata.installmentNumber && metadata.totalInstallments && (
            <MetadataField
              label="Installment"
              value={`${metadata.installmentNumber} of ${metadata.totalInstallments} installments`}
            />
          )}

          {metadata.originalAmount && metadata.originalCurrency && (
            <>
              <MetadataField
                label="Original Amount"
                value={formatCurrency(
                  metadata.originalAmount,
                  metadata.originalCurrency,
                )}
              />

              <MetadataField
                label="Conversion Rate"
                value={`${(amount / metadata.originalAmount).toFixed(4)} ${currency} per ${metadata.originalCurrency}`}
              />
            </>
          )}
        </ul>
      </TooltipContent>
    </Tooltip>
  )
}

interface MetadataFieldProps {
  label: string
  value: string
}

function MetadataField({ label, value }: MetadataFieldProps) {
  return (
    <li className="grid gap-0.5">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </li>
  )
}
