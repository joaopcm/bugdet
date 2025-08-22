import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'

export function LoadingState() {
  return (
    <>
      <TableRow>
        <TableCell className="w-1/2">
          <Skeleton className="h-3.5 w-48" />
        </TableCell>
        <TableCell className="w-1/4">
          <Skeleton className="h-3.5 w-20" />
        </TableCell>
        <TableCell className="w-1/4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-[34px] w-[65px]" />
          </div>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell className="w-1/2">
          <Skeleton className="h-3.5 w-40" />
        </TableCell>
        <TableCell className="w-1/4">
          <Skeleton className="h-3.5 w-20" />
        </TableCell>
        <TableCell className="w-1/4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-[34px] w-[65px]" />
          </div>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell className="w-1/2">
          <Skeleton className="h-3.5 w-52" />
        </TableCell>
        <TableCell className="w-1/4">
          <Skeleton className="h-3.5 w-20" />
        </TableCell>
        <TableCell className="w-1/4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-[34px] w-[65px]" />
          </div>
        </TableCell>
      </TableRow>
    </>
  )
}
