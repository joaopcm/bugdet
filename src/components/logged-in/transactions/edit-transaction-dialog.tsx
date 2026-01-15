'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CONFIDENCE_THRESHOLD } from '@/constants/transactions'
import type { transaction } from '@/db/schema'
import { useTransactions } from '@/hooks/use-transactions'
import { trpc } from '@/lib/trpc/client'
import { formatCurrency, getCurrencySymbol, parseCurrency } from '@/lib/utils'
import { useState } from 'react'
import { toast } from 'sonner'
import { TransactionForm, type TransactionFormValues } from './transaction-form'

interface EditTransactionDialogProps {
  children: React.ReactNode
  transaction: Pick<
    typeof transaction.$inferSelect,
    | 'id'
    | 'categoryId'
    | 'date'
    | 'merchantName'
    | 'amount'
    | 'currency'
    | 'confidence'
  >
}

export function EditTransactionDialog({
  children,
  transaction,
}: EditTransactionDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { invalidate } = useTransactions()

  const { mutate: updateTransaction, isPending: isUpdating } =
    trpc.transactions.update.useMutation({
      onSuccess: () => {
        invalidate()
        toast.success(
          `You have updated the transaction "${formatCurrency(transaction.amount, transaction.currency)} - ${transaction.merchantName}".`,
        )
        setIsOpen(false)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  function onSubmit(values: TransactionFormValues) {
    updateTransaction({
      id: transaction.id,
      ...values,
      amount: parseCurrency(values.amount),
    })
  }

  const isLowConfidence = transaction.confidence < CONFIDENCE_THRESHOLD

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isLowConfidence ? 'Review' : 'Edit'} transaction
          </DialogTitle>
          <DialogDescription>
            {isLowConfidence
              ? 'Review and make changes to the transaction.'
              : 'Edit the transaction.'}
          </DialogDescription>
        </DialogHeader>
        <TransactionForm
          isLoading={isUpdating}
          onSubmit={onSubmit}
          initialValues={{
            categoryId: transaction.categoryId,
            date: transaction.date,
            merchantName: transaction.merchantName,
            amount: formatCurrency(transaction.amount, transaction.currency),
          }}
          currencyCode={transaction.currency}
          currencySymbol={getCurrencySymbol(transaction.currency)}
        />
      </DialogContent>
    </Dialog>
  )
}
