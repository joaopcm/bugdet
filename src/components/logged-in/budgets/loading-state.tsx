"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/use-pagination";
import { cn } from "@/lib/utils";

const RANDOM_NAME_SIZES = ["h-3.5 w-32", "h-3.5 w-40", "h-3.5 w-36"];

export function LoadingState() {
  const { pagination } = usePagination("budgets");

  return (
    <>
      {Array.from({ length: pagination.limit }).map((_, index) => (
        <TableRow key={String(index)}>
          <TableCell className="w-1/5">
            <Skeleton
              className={cn(
                RANDOM_NAME_SIZES[index % RANDOM_NAME_SIZES.length]
              )}
            />
          </TableCell>
          <TableCell className="w-1/4">
            <div className="flex gap-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </TableCell>
          <TableCell className="w-2/5">
            <div className="flex w-3/4 flex-col gap-1">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </TableCell>
          <TableCell className="w-1/5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-[32px] w-[71px]" />
              <Skeleton className="h-[32px] w-[54px]" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
