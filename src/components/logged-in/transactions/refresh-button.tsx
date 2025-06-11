'use client'

import { Button } from '@/components/ui/button'
import { useTransactions } from '@/hooks/use-transactions'
import { cn } from '@/lib/utils'
import { RefreshCcwIcon } from 'lucide-react'

export function RefreshButton() {
  const {
    refetch: refetchTransactions,
    isRefetching,
    isLoading,
  } = useTransactions()

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => refetchTransactions()}
      disabled={isRefetching || isLoading}
    >
      <RefreshCcwIcon
        className={cn({
          'animate-spin-reverse': isRefetching,
        })}
      />
    </Button>
  )
}
