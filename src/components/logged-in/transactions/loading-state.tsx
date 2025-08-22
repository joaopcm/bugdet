import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'

export function LoadingState() {
  return (
    <>
      <TableRow>
        <TableCell className="w-[15%]">
          <Skeleton className="h-3.5 w-24" />
        </TableCell>
        <TableCell className="w-[20%]">
          <Skeleton className="h-6 w-20" />
        </TableCell>
        <TableCell className="w-[30%]">
          <Skeleton className="h-3.5 w-48" />
        </TableCell>
        <TableCell className="w-[20%]">
          <Skeleton className="h-3.5 w-20" />
        </TableCell>
        <TableCell className="w-[15%]">
          <div className="flex items-center gap-2">
            <Skeleton className="h-[34px] w-[65px]" />
            <Skeleton className="h-[34px] w-[55px]" />
          </div>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell className="w-[15%]">
          <Skeleton className="h-3.5 w-24" />
        </TableCell>
        <TableCell className="w-[20%]">
          <Skeleton className="h-6 w-24" />
        </TableCell>
        <TableCell className="w-[30%]">
          <Skeleton className="h-3.5 w-40" />
        </TableCell>
        <TableCell className="w-[20%]">
          <Skeleton className="h-3.5 w-24" />
        </TableCell>
        <TableCell className="w-[15%]">
          <div className="flex items-center gap-2">
            <Skeleton className="h-[34px] w-[65px]" />
            <Skeleton className="h-[34px] w-[55px]" />
          </div>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell className="w-[15%]">
          <Skeleton className="h-3.5 w-24" />
        </TableCell>
        <TableCell className="w-[20%]">
          <Skeleton className="h-6 w-16" />
        </TableCell>
        <TableCell className="w-[30%]">
          <Skeleton className="h-3.5 w-52" />
        </TableCell>
        <TableCell className="w-[20%]">
          <Skeleton className="h-3.5 w-28" />
        </TableCell>
        <TableCell className="w-[15%]">
          <div className="flex items-center gap-2">
            <Skeleton className="h-[34px] w-[65px]" />
            <Skeleton className="h-[34px] w-[55px]" />
          </div>
        </TableCell>
      </TableRow>
    </>
  )
}
