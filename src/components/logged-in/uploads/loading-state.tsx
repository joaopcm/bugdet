'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'
import { usePagination } from '@/hooks/use-pagination'
import { cn } from '@/lib/utils'

const RANDOM_FIRST_COLUMN_SIZES = [
  'h-3.5 w-44',
  'h-3.5 w-16',
  'h-3.5 w-[93px]',
  'h-3.5 w-[187px]',
  'h-3.5 w-[95px]',
  'h-3.5 w-[71px]',
]

/**
 * Render a table-shaped skeleton loading state for the uploads list using the current pagination limit.
 *
 * @returns A fragment containing `pagination.limit` table rows, each filled with skeleton placeholders matching the table's column layout.
 */
export function LoadingState() {
  const { pagination } = usePagination('uploads')

  return (
    <>
      {Array.from({ length: pagination.limit }).map((_, index) => (
        <TableRow key={String(index)}>
          <TableCell className="w-[35%]">
            <Skeleton
              className={cn(
                RANDOM_FIRST_COLUMN_SIZES[
                  index % RANDOM_FIRST_COLUMN_SIZES.length
                ],
              )}
            />
          </TableCell>
          <TableCell className="w-[15%]">
            <Skeleton className="h-3.5 w-16" />
          </TableCell>
          <TableCell className="w-[15%]">
            <Skeleton className="h-3.5 w-[93px]" />
          </TableCell>
          <TableCell className="w-[20%]">
            <Skeleton className="h-3.5 w-[187px]" />
          </TableCell>
          <TableCell className="w-[15%]">
            <div className="flex items-center gap-2">
              <Skeleton className="h-[32px] w-[95px]" />
              <Skeleton className="h-[32px] w-[71px]" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}