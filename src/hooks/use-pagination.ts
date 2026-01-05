import {
  DEFAULT_LIMIT_PER_PAGE,
  LIMIT_PER_PAGE_OPTIONS,
} from '@/constants/pagination'
import { parseAsInteger, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useMemo } from 'react'

export type PaginationPageKey =
  | 'transactions'
  | 'categories'
  | 'uploads'
  | 'categorization-rules'

/**
 * Builds the localStorage key used to persist the pagination limit for a specific page.
 *
 * @param pageKey - The page identifier used to scope the stored pagination limit
 * @returns The storage key in the form `pagination-limit-<pageKey>`
 */
function getStorageKey(pageKey: PaginationPageKey): string {
  return `pagination-limit-${pageKey}`
}

/**
 * Retrieve the persisted pagination limit for the specified page key, validated against allowed options.
 *
 * @param pageKey - The storage namespace key identifying which page's limit to read from localStorage
 * @returns The stored numeric limit for `pageKey` if present and valid; otherwise `DEFAULT_LIMIT_PER_PAGE`
 */
function getStoredLimit(pageKey: PaginationPageKey): number {
  if (typeof window === 'undefined') return DEFAULT_LIMIT_PER_PAGE

  const stored = localStorage.getItem(getStorageKey(pageKey))
  if (!stored) return DEFAULT_LIMIT_PER_PAGE

  const parsed = Number.parseInt(stored, 10)
  if (Number.isNaN(parsed) || !LIMIT_PER_PAGE_OPTIONS.includes(parsed)) {
    return DEFAULT_LIMIT_PER_PAGE
  }

  return parsed
}

/**
 * Persist the pagination limit for a specific page key to localStorage.
 *
 * Does nothing when not running in a browser environment (e.g., server-side).
 *
 * @param pageKey - The pagination page identifier used to form the storage key
 * @param limit - The number of items per page to store
 */
function setStoredLimit(pageKey: PaginationPageKey, limit: number): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(getStorageKey(pageKey), String(limit))
}

/**
 * Manage pagination state for a specific page key and persist that page's limit to local storage.
 *
 * @param pageKey - Identifier for the page whose pagination limit is loaded from and saved to storage
 * @returns An object containing `pagination` (current `page` and `limit`) and `setPagination` (updates pagination; if `limit` is provided the new value is persisted)
 */
export function usePagination(pageKey: PaginationPageKey) {
  const storedLimit = useMemo(() => getStoredLimit(pageKey), [pageKey])

  const [pagination, setQueryPagination] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(storedLimit),
  })

  // Sync limit changes to localStorage
  useEffect(() => {
    if (pagination.limit !== storedLimit) {
      setStoredLimit(pageKey, pagination.limit)
    }
  }, [pagination.limit, pageKey, storedLimit])

  const setPagination = useCallback(
    (updates: { page?: number; limit?: number }) => {
      // If limit is being updated, also persist to localStorage
      if (updates.limit !== undefined) {
        setStoredLimit(pageKey, updates.limit)
      }
      return setQueryPagination(updates)
    },
    [pageKey, setQueryPagination],
  )

  return {
    pagination,
    setPagination,
  }
}