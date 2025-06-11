import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'

export function LoadingState() {
  return (
    <>
      <TableRow>
        <TableCell>
          <Skeleton className="h-3.5 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-6 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-3.5 w-52" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-3.5 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-[34px] w-[74px]" />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>
          <Skeleton className="h-3.5 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-6 w-28" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-3.5 w-48" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-3.5 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-[34px] w-[74px]" />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>
          <Skeleton className="h-3.5 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-6 w-14" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-3.5 w-28" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-3.5 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-[34px] w-[74px]" />
        </TableCell>
      </TableRow>
    </>
  )
}
