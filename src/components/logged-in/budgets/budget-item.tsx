'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useInvalidateBudgets } from '@/hooks/use-budgets'
import { trpc } from '@/lib/trpc/client'
import { cn, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { DoubleConfirmationAlertDialog } from '../double-confirmation-alert-dialog'
import { EditBudgetDialog } from './edit-budget-dialog'

const MAX_VISIBLE_CATEGORIES = 2
const NEAR_LIMIT_THRESHOLD = 80

interface BudgetItemProps {
  budget: {
    id: string
    name: string
    targetAmount: number
    currency: string
    categories: Array<{ id: string; name: string }>
    spentAmount: number
  }
  isSelected?: boolean
  onSelect?: (id: string, event: React.MouseEvent) => void
}

export function BudgetItem({
  budget,
  isSelected = false,
  onSelect,
}: BudgetItemProps) {
  const invalidate = useInvalidateBudgets()

  const { mutate: deleteBudget, isPending: isDeleting } =
    trpc.budgets.delete.useMutation({
      onMutate: () => {
        toast.loading('Deleting budget...', {
          id: `delete-budget-${budget.id}`,
        })
      },
      onSuccess: () => {
        invalidate()
        toast.success(`You have deleted the budget "${budget.name}".`, {
          id: `delete-budget-${budget.id}`,
        })
      },
      onError: (error) => {
        toast.error(error.message, { id: `delete-budget-${budget.id}` })
      },
    })

  const percentUsed = Math.min(
    Math.round((budget.spentAmount / budget.targetAmount) * 100),
    100,
  )
  const isOverBudget = budget.spentAmount > budget.targetAmount
  const isNearLimit = !isOverBudget && percentUsed >= NEAR_LIMIT_THRESHOLD

  const visibleCategories = budget.categories.slice(0, MAX_VISIBLE_CATEGORIES)
  const hiddenCategories = budget.categories.slice(MAX_VISIBLE_CATEGORIES)
  const remainingCount = hiddenCategories.length

  return (
    <TableRow className="group">
      <TableCell className="relative">
        <Checkbox
          checked={isSelected}
          onClick={(e) => onSelect?.(budget.id, e)}
          className="absolute -left-8 top-3 hidden opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 md:block"
          aria-label={`Select budget ${budget.name}`}
        />
        <span className="font-medium">{budget.name}</span>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {visibleCategories.map((category) => (
            <Badge key={category.id} variant="secondary">
              {category.name}
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="cursor-default">
                  +{remainingCount} more
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <ul className="list-disc pl-4">
                  {hiddenCategories.map((category) => (
                    <li key={category.id}>{category.name}</li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1 w-3/4">
          <Progress
            value={percentUsed}
            className={cn('h-2', {
              '[&>div]:bg-amber-500': isNearLimit,
              '[&>div]:bg-destructive': isOverBudget,
            })}
          />
          <span
            className={cn('text-sm text-muted-foreground', {
              'text-amber-600 dark:text-amber-500': isNearLimit,
              'text-destructive': isOverBudget,
            })}
          >
            {formatCurrency(budget.spentAmount, budget.currency)} used out of{' '}
            {formatCurrency(budget.targetAmount, budget.currency)}
          </span>
        </div>
      </TableCell>
      <TableCell className="flex items-center gap-2">
        <DoubleConfirmationAlertDialog
          title={`Delete budget "${budget.name}"?`}
          description="Are you sure you want to delete this budget? This action cannot be undone."
          onConfirm={() => deleteBudget({ id: budget.id })}
        >
          <Button variant="destructive" size="sm" disabled={isDeleting}>
            Delete
          </Button>
        </DoubleConfirmationAlertDialog>
        <EditBudgetDialog budget={budget} />
      </TableCell>
    </TableRow>
  )
}
