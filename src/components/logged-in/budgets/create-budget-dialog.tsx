'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Kbd } from '@/components/ui/kbd'
import { useInvalidateBudgets } from '@/hooks/use-budgets'
import { trpc } from '@/lib/trpc/client'
import { parseCurrency } from '@/lib/utils'
import { useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'
import { BudgetForm, type BudgetFormValues } from './budget-form'

const NEW_BUDGET_SHORTCUT = 'N'

export function CreateBudgetDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const invalidate = useInvalidateBudgets()

  const { data: currencies = [] } = trpc.budgets.getCurrencies.useQuery(
    undefined,
    { enabled: isOpen },
  )

  const { mutate: createBudget, isPending: isCreating } =
    trpc.budgets.create.useMutation({
      onSuccess: (_, { name }) => {
        invalidate()
        toast.success(`You have created the budget "${name}".`)
        setIsOpen(false)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  useHotkeys(NEW_BUDGET_SHORTCUT, (e) => {
    e.preventDefault()
    setIsOpen(true)
  })

  function onSubmit(values: BudgetFormValues) {
    createBudget({
      name: values.name,
      targetAmount: parseCurrency(values.targetAmount),
      currency: values.currency,
      categoryIds: values.categoryIds,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          New budget
          <Kbd variant="default" className="-mr-2">
            {NEW_BUDGET_SHORTCUT}
          </Kbd>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create budget</DialogTitle>
          <DialogDescription>
            Create a new budget to track spending goals by category.
          </DialogDescription>
        </DialogHeader>
        <BudgetForm
          isLoading={isCreating}
          onSubmit={onSubmit}
          currencies={currencies}
        />
      </DialogContent>
    </Dialog>
  )
}
