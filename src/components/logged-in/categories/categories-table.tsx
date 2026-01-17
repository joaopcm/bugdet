"use client";

import { useMemo } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
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
import { useCategories } from "@/hooks/use-categories";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { trpc } from "@/lib/trpc/client";
import { pluralize } from "@/lib/utils";
import { FloatingActionBar } from "../bulk-actions/floating-action-bar";
import { EmptyState } from "../empty-state";
import { CategoriesPagination } from "./categories-pagination";
import { CategoryItem } from "./category-item";
import { CategoriesFilters } from "./filters";
import { LoadingState } from "./loading-state";

export function CategoriesTable() {
  const isMobile = useIsMobile();
  const { data: categories, isLoading, refetch } = useCategories();

  const itemIds = useMemo(
    () => categories?.data?.map((c) => c.id) ?? [],
    [categories?.data]
  );

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
    trpc.categories.deleteMany.useMutation({
      onMutate: () => {
        toast.loading("Deleting categories...", { id: "delete-categories" });
      },
      onSuccess: () => {
        toast.success(
          `Deleted ${selectedIds.size} ${pluralize(selectedIds.size, "category", "categories")}`,
          { id: "delete-categories" }
        );
        clearSelection();
        refetch();
      },
      onError: (error) => {
        toast.error(error.message, { id: "delete-categories" });
      },
    });

  const handleBulkDelete = () => {
    deleteMany({ ids: Array.from(selectedIds) });
  };

  return (
    <div className="flex flex-col gap-4">
      <CategoriesFilters />
      <div className="relative overflow-visible">
        <Checkbox
          aria-label="Select all categories"
          checked={isAllSelected}
          className="absolute top-2.5 -left-8 hidden opacity-0 hover:opacity-100 data-[state=checked]:opacity-100 data-[state=indeterminate]:opacity-100 md:block"
          indeterminate={isPartiallySelected}
          onCheckedChange={toggleAll}
        />
        <Table containerClassName="overflow-visible">
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/2">Name</TableHead>
              <TableHead className="w-1/4">Transactions</TableHead>
              <TableHead className="w-1/4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <LoadingState />}

            {categories?.data.map((category) => (
              <CategoryItem
                category={category}
                isSelected={selectedIds.has(category.id)}
                key={category.id}
                onSelect={handleClick}
              />
            ))}

            {categories?.data.length === 0 && (
              <TableRow>
                <TableCell className="py-10" colSpan={3}>
                  <EmptyState
                    description="Upload your bank statements or create your first category to get started."
                    title="No categories found."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CategoriesPagination hasMore={!!categories?.hasMore} />

      <FloatingActionBar
        className="w-[301px]"
        isDeleting={isDeleting}
        onDelete={handleBulkDelete}
        selectedCount={selectedIds.size}
      />
    </div>
  );
}
