"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPageSize,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePagination } from "@/hooks/use-pagination";

interface UploadsPaginationProps {
  hasMore: boolean;
}

export function UploadsPagination({ hasMore }: UploadsPaginationProps) {
  const { pagination, setPagination } = usePagination("uploads");

  const currentPage = pagination.page;
  const hasNextPage = hasMore;
  const hasPreviousPage = currentPage > 1;

  function handlePageChange(page: number) {
    setPagination({ page });
  }

  return (
    <div className="mt-8 flex items-center justify-between gap-4">
      <PaginationPageSize
        onChange={(limit) => setPagination({ limit, page: 1 })}
        value={pagination.limit}
      />

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className={
                hasPreviousPage
                  ? "cursor-pointer"
                  : "pointer-events-none opacity-50"
              }
              onClick={() =>
                hasPreviousPage && handlePageChange(currentPage - 1)
              }
            />
          </PaginationItem>

          {/* Show page 1 if not current and not adjacent */}
          {currentPage > 2 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(1)}>
                  1
                </PaginationLink>
              </PaginationItem>
              {currentPage > 3 && <PaginationEllipsis />}
            </>
          )}

          {/* Previous page */}
          {hasPreviousPage && (
            <PaginationItem>
              <PaginationLink onClick={() => handlePageChange(currentPage - 1)}>
                {currentPage - 1}
              </PaginationLink>
            </PaginationItem>
          )}

          {/* Current page */}
          <PaginationItem>
            <PaginationLink isActive={true}>{currentPage}</PaginationLink>
          </PaginationItem>

          {/* Next page */}
          {hasNextPage && (
            <PaginationItem>
              <PaginationLink onClick={() => handlePageChange(currentPage + 1)}>
                {currentPage + 1}
              </PaginationLink>
            </PaginationItem>
          )}

          {/* Show ellipsis and more pages if available */}
          {hasNextPage && <PaginationEllipsis />}

          <PaginationItem>
            <PaginationNext
              className={
                hasNextPage
                  ? "cursor-pointer"
                  : "pointer-events-none opacity-50"
              }
              onClick={() => hasNextPage && handlePageChange(currentPage + 1)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
