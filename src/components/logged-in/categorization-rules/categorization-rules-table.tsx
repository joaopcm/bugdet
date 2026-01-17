"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { useCategorizationRulesFilters } from "@/components/logged-in/categorization-rules/filters/search-params";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { usePagination } from "@/hooks/use-pagination";
import { trpc } from "@/lib/trpc/client";
import { pluralize } from "@/lib/utils";
import { FloatingActionBar } from "../bulk-actions/floating-action-bar";
import { EmptyState } from "../empty-state";
import { CategorizationRulesFilters } from "./filters";
import { LoadingState } from "./loading-state";
import { RuleItem } from "./rule-item";
import { RulesPagination } from "./rules-pagination";

export function CategorizationRulesTable() {
  const isMobile = useIsMobile();
  const { filters } = useCategorizationRulesFilters();
  const { pagination } = usePagination("categorization-rules");
  const utils = trpc.useUtils();

  const queryKey = {
    filters: {
      query: filters.query || null,
      enabled: filters.enabled,
    },
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
    },
  };

  const { data, isLoading } = trpc.categorizationRules.list.useQuery(queryKey);
  const rules = data?.data ?? [];
  const hasMore = data?.hasMore ?? false;

  const itemIds = useMemo(() => rules.map((r) => r.id), [rules]);

  const {
    selectedIds,
    isAllSelected,
    isPartiallySelected,
    handleClick,
    toggleAll,
    selectAll,
    clearSelection,
  } = useBulkSelection({ itemIds });

  useHotkeys("mod+a", selectAll, { preventDefault: true, enabled: !isMobile });

  const { mutate: deleteMany, isPending: isDeleting } =
    trpc.categorizationRules.deleteMany.useMutation({
      onMutate: () => {
        toast.loading("Deleting rules...", { id: "delete-rules" });
      },
      onSuccess: () => {
        toast.success(
          `Deleted ${selectedIds.size} ${pluralize(selectedIds.size, "rule")}`,
          { id: "delete-rules" }
        );
        clearSelection();
        utils.categorizationRules.list.invalidate();
      },
      onError: (error) => {
        toast.error(error.message, { id: "delete-rules" });
      },
    });

  const handleBulkDelete = () => {
    deleteMany({ ids: Array.from(selectedIds) });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { mutate: reorderRules } = trpc.categorizationRules.reorder.useMutation(
    {
      onMutate: async ({ rules: updates }) => {
        await utils.categorizationRules.list.cancel(queryKey);
        const previousData = utils.categorizationRules.list.getData(queryKey);

        utils.categorizationRules.list.setData(queryKey, (old) => {
          if (!old) {
            return old;
          }
          const priorityMap = new Map(updates.map((u) => [u.id, u.priority]));
          const newData = [...old.data].sort((a, b) => {
            const aPriority = priorityMap.get(a.id) ?? a.priority;
            const bPriority = priorityMap.get(b.id) ?? b.priority;
            return bPriority - aPriority;
          });
          return { ...old, data: newData };
        });

        return { previousData };
      },
      onError: (error, _, context) => {
        if (context?.previousData) {
          utils.categorizationRules.list.setData(
            queryKey,
            context.previousData
          );
        }
        toast.error(error.message);
      },
      onSettled: () => {
        utils.categorizationRules.list.invalidate();
      },
    }
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = rules.findIndex((r) => r.id === active.id);
    const newIndex = rules.findIndex((r) => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedRules = arrayMove(rules, oldIndex, newIndex);

    const updates = reorderedRules.map((rule, index) => ({
      id: rule.id,
      priority: reorderedRules.length - index,
    }));

    reorderRules({ rules: updates });
  }

  return (
    <div className="flex flex-col gap-4">
      <CategorizationRulesFilters />
      <div className="relative overflow-visible">
        <Checkbox
          aria-label="Select all rules"
          checked={isAllSelected}
          className="absolute top-2.5 -left-8 hidden opacity-0 hover:opacity-100 data-[state=checked]:opacity-100 data-[state=indeterminate]:opacity-100 md:block"
          indeterminate={isPartiallySelected}
          onCheckedChange={toggleAll}
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
                <TableCell className="py-10" colSpan={6}>
                  <EmptyState
                    description="Create your first rule to automatically process transactions."
                    title="No rules found"
                  />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rules.length > 0 && (
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                sensors={sensors}
              >
                <SortableContext
                  items={rules.map((r) => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {rules.map((rule) => (
                    <RuleItem
                      isSelected={selectedIds.has(rule.id)}
                      key={rule.id}
                      onSelect={handleClick}
                      rule={rule}
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
        className="w-[301px]"
        isDeleting={isDeleting}
        onDelete={handleBulkDelete}
        selectedCount={selectedIds.size}
      />
    </div>
  );
}
