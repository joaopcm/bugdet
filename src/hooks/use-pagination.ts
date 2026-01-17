import { parseAsInteger, useQueryStates } from "nuqs";
import { useCallback, useEffect, useMemo } from "react";
import {
  DEFAULT_LIMIT_PER_PAGE,
  LIMIT_PER_PAGE_OPTIONS,
} from "@/constants/pagination";

export type PaginationPageKey =
  | "transactions"
  | "categories"
  | "uploads"
  | "categorization-rules"
  | "budgets";

function getStorageKey(pageKey: PaginationPageKey): string {
  return `pagination-limit-${pageKey}`;
}

function getStoredLimit(pageKey: PaginationPageKey): number {
  if (typeof window === "undefined") {
    return DEFAULT_LIMIT_PER_PAGE;
  }

  const stored = localStorage.getItem(getStorageKey(pageKey));
  if (!stored) {
    return DEFAULT_LIMIT_PER_PAGE;
  }

  const parsed = Number.parseInt(stored, 10);
  if (Number.isNaN(parsed) || !LIMIT_PER_PAGE_OPTIONS.includes(parsed)) {
    return DEFAULT_LIMIT_PER_PAGE;
  }

  return parsed;
}

function setStoredLimit(pageKey: PaginationPageKey, limit: number): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(getStorageKey(pageKey), String(limit));
}

export function usePagination(pageKey: PaginationPageKey) {
  const storedLimit = useMemo(() => getStoredLimit(pageKey), [pageKey]);

  const [pagination, setQueryPagination] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(storedLimit),
  });

  // Sync limit changes to localStorage
  useEffect(() => {
    if (pagination.limit !== storedLimit) {
      setStoredLimit(pageKey, pagination.limit);
    }
  }, [pagination.limit, pageKey, storedLimit]);

  const setPagination = useCallback(
    (updates: { page?: number; limit?: number }) => {
      // If limit is being updated, also persist to localStorage
      if (updates.limit !== undefined) {
        setStoredLimit(pageKey, updates.limit);
      }
      return setQueryPagination(updates);
    },
    [pageKey, setQueryPagination]
  );

  return {
    pagination,
    setPagination,
  };
}
