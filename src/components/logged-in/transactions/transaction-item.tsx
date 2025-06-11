'use client'

import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import type { transaction } from '@/db/schema'
import { useTransactions } from '@/hooks/use-transactions'
import { trpc } from '@/lib/trpc/client'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { DoubleConfirmationAlertDialog } from '../double-confirmation-alert-dialog'
import { Category } from './category'

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
    | 'metadata'
    | 'createdAt'
  > & {
    categoryName: string | null
  }
}

export function TransactionItem({ transaction }: TransactionItemProps) {
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
    <TableRow>
      <TableCell>{format(transaction.date, 'MMM d, yyyy')}</TableCell>
      <TableCell>
        <Category categoryName={transaction.categoryName} />
      </TableCell>
      <TableCell>{transaction.merchantName}</TableCell>
      <TableCell>
        {formatCurrency(transaction.amount, transaction.currency)}
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
      </TableCell>
    </TableRow>
  )
}
