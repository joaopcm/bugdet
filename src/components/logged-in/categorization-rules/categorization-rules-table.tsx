'use client'

import { useCategorizationRulesFilters } from '@/components/logged-in/categorization-rules/filters/search-params'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useBulkSelection } from '@/hooks/use-bulk-selection'
import { usePagination } from '@/hooks/use-pagination'
import { trpc } from '@/lib/trpc/client'
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useMemo } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'
import { FloatingActionBar } from '../bulk-actions/floating-action-bar'
import { EmptyState } from '../empty-state'
import { CategorizationRulesFilters } from './filters'
import { LoadingState } from './loading-state'
import { RuleItem } from './rule-item'
import { RulesPagination } from './rules-pagination'

export function CategorizationRulesTable() {
  const { filters } = useCategorizationRulesFilters()
  const { pagination } = usePagination()
  const utils = trpc.useUtils()

  const queryKey = {
    filters: {
      query: filters.query || null,
      enabled: filters.enabled,
    },
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
    },
  }

  const { data, isLoading } = trpc.categorizationRules.list.useQuery(queryKey)
  const rules = data?.data ?? []
  const hasMore = data?.hasMore ?? false

  const itemIds = useMemo(() => rules.map((r) => r.id), [rules])

  const {
    selectedIds,
    isAllSelected,
    isPartiallySelected,
    handleClick,
    toggleAll,
    selectAll,
    clearSelection,
  } = useBulkSelection({ itemIds })

  useHotkeys('mod+a', selectAll, { preventDefault: true })

  const { mutate: deleteMany, isPending: isDeleting } =
    trpc.categorizationRules.deleteMany.useMutation({
      onSuccess: () => {
        toast.success(`Deleted ${selectedIds.size} rule(s)`)
        clearSelection()
        utils.categorizationRules.list.invalidate()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  const handleBulkDelete = () => {
    deleteMany({ ids: Array.from(selectedIds) })
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const { mutate: reorderRules } = trpc.categorizationRules.reorder.useMutation(
    {
      onMutate: async ({ rules: updates }) => {
        await utils.categorizationRules.list.cancel(queryKey)
        const previousData = utils.categorizationRules.list.getData(queryKey)

        utils.categorizationRules.list.setData(queryKey, (old) => {
          if (!old) return old
          const priorityMap = new Map(updates.map((u) => [u.id, u.priority]))
          const newData = [...old.data].sort((a, b) => {
            const aPriority = priorityMap.get(a.id) ?? a.priority
            const bPriority = priorityMap.get(b.id) ?? b.priority
            return bPriority - aPriority
          })
          return { ...old, data: newData }
        })

        return { previousData }
      },
      onError: (error, _, context) => {
        if (context?.previousData) {
          utils.categorizationRules.list.setData(queryKey, context.previousData)
        }
        toast.error(error.message)
      },
      onSettled: () => {
        utils.categorizationRules.list.invalidate()
      },
    },
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = rules.findIndex((r) => r.id === active.id)
    const newIndex = rules.findIndex((r) => r.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reorderedRules = arrayMove(rules, oldIndex, newIndex)

    const updates = reorderedRules.map((rule, index) => ({
      id: rule.id,
      priority: reorderedRules.length - index,
    }))

    reorderRules({ rules: updates })
  }

  return (
    <div className="flex flex-col gap-4">
      <CategorizationRulesFilters />
      <div className="relative overflow-visible">
        <Checkbox
          checked={isAllSelected}
          indeterminate={isPartiallySelected}
          onCheckedChange={toggleAll}
          className="absolute -left-8 top-2.5 opacity-0 hover:opacity-100 data-[state=checked]:opacity-100 data-[state=indeterminate]:opacity-100"
          aria-label="Select all rules"
        />
        <Table containerClassName="overflow-visible">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]" />
              <TableHead className="w-1/6">Name</TableHead>
              <TableHead className="w-auto">Conditions</TableHead>
              <TableHead className="w-1/6">Actions</TableHead>
              <TableHead className="w-1/6">Status</TableHead>
              <TableHead className="w-1/6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <LoadingState />}
            {!isLoading && rules.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10">
                  <EmptyState
                    title="No rules found"
                    description="Create your first rule to automatically process transactions."
                  />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rules.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={rules.map((r) => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {rules.map((rule) => (
                    <RuleItem
                      key={rule.id}
                      rule={rule}
                      isSelected={selectedIds.has(rule.id)}
                      onSelect={handleClick}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </TableBody>
        </Table>
      </div>
      <RulesPagination hasMore={hasMore} />

      <FloatingActionBar
        selectedCount={selectedIds.size}
        onDelete={handleBulkDelete}
        isDeleting={isDeleting}
        className="w-[301px]"
      />
    </div>
  )
}
