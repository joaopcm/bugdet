import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'

export function LoadingState() {
  return (
    <>
      <TableRow>
        <TableCell className="w-[35%]">
          <Skeleton className="h-3.5 w-48" />
        </TableCell>
        <TableCell className="w-[15%]">
          <Skeleton className="h-3.5 w-16" />
        </TableCell>
        <TableCell className="w-[15%]">
          <Skeleton className="h-[22px] w-20" />
        </TableCell>
        <TableCell className="w-[20%]">
          <Skeleton className="h-3.5 w-32" />
        </TableCell>
        <TableCell className="w-[15%]">
          <div className="flex items-center gap-2">
            <Skeleton className="h-[34px] w-[95px]" />
            <Skeleton className="h-[34px] w-[72px]" />
          </div>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell className="w-[35%]">
          <Skeleton className="h-3.5 w-52" />
        </TableCell>
        <TableCell className="w-[15%]">
          <Skeleton className="h-3.5 w-16" />
        </TableCell>
        <TableCell className="w-[15%]">
          <Skeleton className="h-[22px] w-20" />
        </TableCell>
        <TableCell className="w-[20%]">
          <Skeleton className="h-3.5 w-32" />
        </TableCell>
        <TableCell className="w-[15%]">
          <div className="flex items-center gap-2">
            <Skeleton className="h-[34px] w-[95px]" />
            <Skeleton className="h-[34px] w-[72px]" />
          </div>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell className="w-[35%]">
          <Skeleton className="h-3.5 w-44" />
        </TableCell>
        <TableCell className="w-[15%]">
          <Skeleton className="h-3.5 w-16" />
        </TableCell>
        <TableCell className="w-[15%]">
          <Skeleton className="h-[22px] w-20" />
        </TableCell>
        <TableCell className="w-[20%]">
          <Skeleton className="h-3.5 w-32" />
        </TableCell>
        <TableCell className="w-[15%]">
          <div className="flex items-center gap-2">
            <Skeleton className="h-[34px] w-[95px]" />
            <Skeleton className="h-[34px] w-[72px]" />
          </div>
        </TableCell>
      </TableRow>
    </>
  )
}
