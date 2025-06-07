'use client'

import { Button } from '@/components/ui/button'
import { useUploads } from '@/hooks/use-uploads'
import { cn } from '@/lib/utils'
import { RefreshCcwIcon } from 'lucide-react'

export function RefreshButton() {
  const { refetch: refetchUploads, isRefetching } = useUploads()

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => refetchUploads()}
      disabled={isRefetching}
    >
      <RefreshCcwIcon
        className={cn({
          'animate-spin-reverse': isRefetching,
        })}
      />
    </Button>
  )
}
