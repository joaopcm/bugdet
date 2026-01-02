'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'
import { usePagination } from '@/hooks/use-pagination'
import { cn } from '@/lib/utils'

const RANDOM_NAME_SIZES = ['h-3.5 w-32', 'h-3.5 w-40', 'h-3.5 w-28']

export function LoadingState() {
  const { pagination } = usePagination()

  return (
    <>
      {Array.from({ length: pagination.limit }).map((_, index) => (
        <TableRow key={String(index)}>
          <TableCell className="w-[40px]">
            <Skeleton className="h-4 w-4" />
          </TableCell>
          <TableCell>
            <Skeleton
              className={cn(
                RANDOM_NAME_SIZES[index % RANDOM_NAME_SIZES.length],
              )}
            />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3.5 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3.5 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-9" />
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="h-[32px] w-[71px]" />
              <Skeleton className="h-[32px] w-[54px]" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}
