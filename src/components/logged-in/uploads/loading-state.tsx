import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'

export function LoadingState() {
  return (
    <>
      <TableRow>
        <TableCell>
          <Skeleton className="h-3.5 w-44" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-3.5 w-10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-[22px] w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-3.5 w-36" />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="h-[34px] w-[95px]" />
            <Skeleton className="h-[34px] w-[72px]" />
          </div>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>
          <Skeleton className="h-3.5 w-56" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-3.5 w-10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-[22px] w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-3.5 w-36" />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="h-[34px] w-[95px]" />
            <Skeleton className="h-[34px] w-[72px]" />
          </div>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>
          <Skeleton className="h-3.5 w-36" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-3.5 w-10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-[22px] w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-3.5 w-36" />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="h-[34px] w-[95px]" />
            <Skeleton className="h-[34px] w-[72px]" />
          </div>
        </TableCell>
      </TableRow>
    </>
  )
}
