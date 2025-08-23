'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'
import { usePagination } from '@/hooks/use-pagination'
import { cn } from '@/lib/utils'

const RANDOM_SECOND_COLUMN_SIZES = ['h-6 w-20', 'h-6 w-24', 'h-6 w-16']
const RANDOM_THIRD_COLUMN_SIZES = ['h-3.5 w-48', 'h-3.5 w-40', 'h-3.5 w-52']
const RANDOM_FOURTH_COLUMN_SIZES = ['h-3.5 w-20', 'h-3.5 w-24', 'h-3.5 w-28']

export function LoadingState() {
  const { pagination } = usePagination()

  return (
    <>
      {Array.from({ length: pagination.limit }).map((_, index) => (
        <TableRow key={String(index)}>
          <TableCell className="w-[15%]">
            <Skeleton className="h-3.5 w-24" />
          </TableCell>
          <TableCell className="w-[20%]">
            <Skeleton
              className={cn(
                RANDOM_SECOND_COLUMN_SIZES[
                  index % RANDOM_SECOND_COLUMN_SIZES.length
                ],
              )}
            />
          </TableCell>
          <TableCell className="w-[30%]">
            <Skeleton
              className={cn(
                RANDOM_THIRD_COLUMN_SIZES[
                  index % RANDOM_THIRD_COLUMN_SIZES.length
                ],
              )}
            />
          </TableCell>
          <TableCell className="w-[20%]">
            <Skeleton
              className={cn(
                RANDOM_FOURTH_COLUMN_SIZES[
                  index % RANDOM_FOURTH_COLUMN_SIZES.length
                ],
              )}
            />
          </TableCell>
          <TableCell className="w-[15%]">
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
