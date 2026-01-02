'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { InternalLink } from '@/components/ui/internal-link'
import { TableCell, TableRow } from '@/components/ui/table'
import type { category } from '@/db/schema'
import { useCategories } from '@/hooks/use-categories'
import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { DoubleConfirmationAlertDialog } from '../double-confirmation-alert-dialog'
import { EditCategoryDialog } from './edit-category-dialog'
import { TransactionCountWithPreview } from './transaction-count-with-preview'

interface CategoryItemProps {
  category: Pick<typeof category.$inferSelect, 'id' | 'name' | 'createdAt'> & {
    transactionCount: number
  }
  isSelected?: boolean
  onSelect?: (id: string, event: React.MouseEvent) => void
}

export function CategoryItem({
  category,
  isSelected = false,
  onSelect,
}: CategoryItemProps) {
  const { refetch: refetchCategories } = useCategories()

  const { mutate: deleteCategory, isPending: isDeleting } =
    trpc.categories.delete.useMutation({
      onSuccess: () => {
        refetchCategories()
        toast.success(`You have deleted the category "${category.name}".`)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  return (
    <TableRow className="group">
      <TableCell className="relative">
        <Checkbox
          checked={isSelected}
          onClick={(e) => onSelect?.(category.id, e)}
          className="absolute -left-8 top-3 opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100"
          aria-label={`Select category ${category.name}`}
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
          title={`Delete category "${category.name}"?`}
          description="Are you sure you want to delete this category? All of the transactions in this category will be unassigned. This action cannot be undone."
          onConfirm={() => deleteCategory({ id: category.id })}
        >
          <Button variant="destructive" size="sm" disabled={isDeleting}>
            Delete
          </Button>
        </DoubleConfirmationAlertDialog>
        <EditCategoryDialog categoryId={category.id} name={category.name} />
      </TableCell>
    </TableRow>
  )
}
