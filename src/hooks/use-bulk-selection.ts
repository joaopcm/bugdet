'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface UseBulkSelectionOptions {
  itemIds: string[]
}

export function useBulkSelection({ itemIds }: UseBulkSelectionOptions) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const lastSelectedIdRef = useRef<string | null>(null)
  const prevItemIdsRef = useRef<string[]>([])

  // Only clear selections for IDs that no longer exist (handles page change)
  // Preserves selections on refetch when IDs remain the same
  useEffect(() => {
    const prevIds = prevItemIdsRef.current
    const currentIdsSet = new Set(itemIds)
    const prevIdsSet = new Set(prevIds)

    // Check if IDs actually changed (not just array reference)
    const idsChanged =
      itemIds.length !== prevIds.length ||
      itemIds.some((id) => !prevIdsSet.has(id))

    if (idsChanged) {
      // Filter out selections that no longer exist
      setSelectedIds((prev) => {
        const next = new Set<string>()
        for (const id of prev) {
          if (currentIdsSet.has(id)) {
            next.add(id)
          }
        }
        return next
      })

      // Clear lastSelectedId if it no longer exists
      if (
        lastSelectedIdRef.current &&
        !currentIdsSet.has(lastSelectedIdRef.current)
      ) {
        lastSelectedIdRef.current = null
      }
    }

    prevItemIdsRef.current = itemIds
  }, [itemIds])

  const isAllSelected = useMemo(
    () => itemIds.length > 0 && itemIds.every((id) => selectedIds.has(id)),
    [itemIds, selectedIds],
  )

  const isPartiallySelected = useMemo(
    () => !isAllSelected && itemIds.some((id) => selectedIds.has(id)),
    [itemIds, selectedIds, isAllSelected],
  )

  const handleClick = useCallback(
    (id: string, event: React.MouseEvent) => {
      event.stopPropagation()

      if (event.shiftKey && lastSelectedIdRef.current) {
        // Shift+click: select range
        const lastIndex = itemIds.indexOf(lastSelectedIdRef.current)
        const currentIndex = itemIds.indexOf(id)

        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex)
          const end = Math.max(lastIndex, currentIndex)
          const rangeIds = itemIds.slice(start, end + 1)

          setSelectedIds((prev) => {
            const next = new Set(prev)
            for (const rangeId of rangeIds) {
              next.add(rangeId)
            }
            return next
          })
        }
      } else {
        // Regular click: toggle item
        setSelectedIds((prev) => {
          const next = new Set(prev)
          if (next.has(id)) {
            next.delete(id)
          } else {
            next.add(id)
          }
          return next
        })
        lastSelectedIdRef.current = id
      }
    },
    [itemIds],
  )

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(itemIds))
    }
    lastSelectedIdRef.current = null
  }, [itemIds, isAllSelected])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    lastSelectedIdRef.current = null
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(itemIds))
    lastSelectedIdRef.current = null
  }, [itemIds])

  return {
    selectedIds,
    isAllSelected,
    isPartiallySelected,
    handleClick,
    toggleAll,
    selectAll,
    clearSelection,
  }
}
