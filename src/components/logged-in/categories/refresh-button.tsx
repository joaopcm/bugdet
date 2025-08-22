'use client'

import { Button } from '@/components/ui/button'
import { useCategories } from '@/hooks/use-categories'
import { cn } from '@/lib/utils'
import { RefreshCcwIcon } from 'lucide-react'

export function RefreshButton() {
  const {
    refetch: refetchCategories,
    isRefetching,
    isLoading,
  } = useCategories()

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => refetchCategories()}
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
