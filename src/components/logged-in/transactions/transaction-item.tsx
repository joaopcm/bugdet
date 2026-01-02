'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { TableCell, TableRow } from '@/components/ui/table'
import { CONFIDENCE_THRESHOLD } from '@/constants/transactions'
import type { transaction } from '@/db/schema'
import { useTransactions } from '@/hooks/use-transactions'
import { trpc } from '@/lib/trpc/client'
import { formatCurrency } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { DoubleConfirmationAlertDialog } from '../double-confirmation-alert-dialog'
import { Amount } from './amount'
import { Category } from './category'
import { EditTransactionDialog } from './edit-transaction-dialog'

interface TransactionItemProps {
  transaction: Pick<
    typeof transaction.$inferSelect,
    | 'id'
    | 'uploadId'
    | 'categoryId'
    | 'date'
    | 'merchantName'
    | 'amount'
    | 'currency'
    | 'confidence'
    | 'metadata'
    | 'createdAt'
  > & {
    categoryName: string | null
  }
  isSelected?: boolean
  onSelect?: (id: string, event: React.MouseEvent) => void
}

export function TransactionItem({
  transaction,
  isSelected = false,
  onSelect,
}: TransactionItemProps) {
  const { refetch: refetchTransactions } = useTransactions()

  const { mutate: deleteTransaction, isPending: isDeleting } =
    trpc.transactions.delete.useMutation({
      onSuccess: () => {
        refetchTransactions()
        toast.success(
          `You have deleted the transaction "${formatCurrency(transaction.amount, transaction.currency)} - ${transaction.merchantName}".`,
        )
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
          onClick={(e) => onSelect?.(transaction.id, e)}
          className="absolute -left-8 top-3 opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100"
          aria-label={`Select transaction ${transaction.merchantName}`}
        />
        {format(parseISO(transaction.date), 'MMM d, yyyy')}
      </TableCell>
      <TableCell>
        <Category
          categoryName={transaction.categoryName}
          confidence={transaction.confidence}
        />
      </TableCell>
      <TableCell>{transaction.merchantName}</TableCell>
      <TableCell>
        <Amount
          amount={transaction.amount}
          currency={transaction.currency}
          metadata={transaction.metadata}
        />
      </TableCell>
      <TableCell className="flex items-center gap-2">
        <DoubleConfirmationAlertDialog
          title={`Delete transaction "${formatCurrency(transaction.amount, transaction.currency)} - ${transaction.merchantName}"?`}
          description="Are you sure you want to delete this transaction? This action cannot be undone."
          onConfirm={() => deleteTransaction({ id: transaction.id })}
        >
          <Button variant="destructive" size="sm" disabled={isDeleting}>
            Delete
          </Button>
        </DoubleConfirmationAlertDialog>

        <EditTransactionDialog transaction={transaction}>
          {transaction.confidence < CONFIDENCE_THRESHOLD ? (
            <Button variant="default" size="sm">
              Review
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              Edit
            </Button>
          )}
        </EditTransactionDialog>
      </TableCell>
    </TableRow>
  )
}
