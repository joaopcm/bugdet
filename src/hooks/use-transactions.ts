import { format } from "date-fns";
import { useCallback } from "react";
import { useTransactionsFilters } from "@/components/logged-in/transactions/filters/search-params";
import { trpc } from "@/lib/trpc/client";
import { usePagination } from "./use-pagination";

export function useInvalidateTransactions() {
  const utils = trpc.useUtils();
  return useCallback(() => {
    utils.transactions.invalidate();
  }, [utils]);
}

export function useTransactions() {
  const { transactionFilters } = useTransactionsFilters();
  const { pagination } = usePagination("transactions");
  const utils = trpc.useUtils();

  const { refetch, ...context } = trpc.transactions.list.useQuery({
    filters: {
      categoryId:
        transactionFilters.category === "all"
          ? null
          : transactionFilters.category,
      uploadId:
        transactionFilters.uploadId === "all"
          ? null
          : transactionFilters.uploadId,
      from: transactionFilters.from
        ? format(transactionFilters.from, "yyyy-MM-dd")
        : null,
      to: transactionFilters.to
        ? format(transactionFilters.to, "yyyy-MM-dd")
        : null,
      query: transactionFilters.query || null,
      ids: transactionFilters.ids || [],
    },
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
    },
  });

  const invalidate = useCallback(() => {
    utils.transactions.invalidate();
  }, [utils]);

  return {
    ...context,
    refetch,
    invalidate,
  };
}
