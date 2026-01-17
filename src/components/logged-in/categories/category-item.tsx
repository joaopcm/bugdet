"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InternalLink } from "@/components/ui/internal-link";
import { TableCell, TableRow } from "@/components/ui/table";
import type { category } from "@/db/schema";
import { useInvalidateCategories } from "@/hooks/use-categories";
import { trpc } from "@/lib/trpc/client";
import { DoubleConfirmationAlertDialog } from "../double-confirmation-alert-dialog";
import { EditCategoryDialog } from "./edit-category-dialog";
import { TransactionCountWithPreview } from "./transaction-count-with-preview";

interface CategoryItemProps {
  category: Pick<typeof category.$inferSelect, "id" | "name" | "createdAt"> & {
    transactionCount: number;
  };
  isSelected?: boolean;
  onSelect?: (id: string, event: React.MouseEvent) => void;
}

export function CategoryItem({
  category,
  isSelected = false,
  onSelect,
}: CategoryItemProps) {
  const invalidate = useInvalidateCategories();

  const { mutate: deleteCategory, isPending: isDeleting } =
    trpc.categories.delete.useMutation({
      onMutate: () => {
        toast.loading("Deleting category...", {
          id: `delete-category-${category.id}`,
        });
      },
      onSuccess: () => {
        invalidate();
        toast.success(`You have deleted the category "${category.name}".`, {
          id: `delete-category-${category.id}`,
        });
      },
      onError: (error) => {
        toast.error(error.message, { id: `delete-category-${category.id}` });
      },
    });

  return (
    <TableRow className="group">
      <TableCell className="relative">
        <Checkbox
          aria-label={`Select category ${category.name}`}
          checked={isSelected}
          className="absolute top-3 -left-8 hidden opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 md:block"
          onClick={(e) => onSelect?.(category.id, e)}
        />
        <InternalLink href={`/transactions?category=${category.id}`}>
          {category.name}
        </InternalLink>
      </TableCell>
      <TableCell>
        <TransactionCountWithPreview
          id={category.id}
          transactionCount={category.transactionCount}
        />
      </TableCell>
      <TableCell className="flex items-center gap-2">
        <DoubleConfirmationAlertDialog
          description="Are you sure you want to delete this category? All of the transactions in this category will be unassigned. This action cannot be undone."
          onConfirm={() => deleteCategory({ id: category.id })}
          title={`Delete category "${category.name}"?`}
        >
          <Button disabled={isDeleting} size="sm" variant="destructive">
            Delete
          </Button>
        </DoubleConfirmationAlertDialog>
        <EditCategoryDialog categoryId={category.id} name={category.name} />
      </TableCell>
    </TableRow>
  );
}
