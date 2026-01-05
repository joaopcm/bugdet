'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'
import { usePagination } from '@/hooks/use-pagination'
import { cn } from '@/lib/utils'

const RANDOM_FIRST_COLUMN_SIZES = ['h-3.5 w-48', 'h-3.5 w-40', 'h-3.5 w-52']

export function LoadingState() {
  const { pagination } = usePagination('categories')

  return (
    <>
      {Array.from({ length: pagination.limit }).map((_, index) => (
        <TableRow key={String(index)}>
          <TableCell className="w-1/2">
            <Skeleton
              className={cn(
                RANDOM_FIRST_COLUMN_SIZES[
                  index % RANDOM_FIRST_COLUMN_SIZES.length
                ],
              )}
            />
          </TableCell>
          <TableCell className="w-1/4">
            <Skeleton className="h-3.5 w-20" />
          </TableCell>
          <TableCell className="w-1/4">
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
