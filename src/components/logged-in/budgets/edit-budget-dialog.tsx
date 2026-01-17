"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useInvalidateBudgets } from "@/hooks/use-budgets";
import { trpc } from "@/lib/trpc/client";
import { parseCurrency } from "@/lib/utils";
import { BudgetForm, type BudgetFormValues } from "./budget-form";

interface EditBudgetDialogProps {
  budget: {
    id: string;
    name: string;
    targetAmount: number;
    currency: string;
    categories: Array<{ id: string; name: string }>;
  };
}

export function EditBudgetDialog({ budget }: EditBudgetDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const invalidate = useInvalidateBudgets();

  const { data: currencies = [] } = trpc.budgets.getCurrencies.useQuery(
    undefined,
    { enabled: isOpen }
  );

  const { mutate: updateBudget, isPending: isUpdating } =
    trpc.budgets.update.useMutation({
      onSuccess: (_, { name }) => {
        invalidate();
        toast.success(`You have updated the budget "${name}".`);
        setIsOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  function onSubmit(values: BudgetFormValues) {
    updateBudget({
      id: budget.id,
      name: values.name,
      targetAmount: parseCurrency(values.targetAmount),
      currency: values.currency,
      categoryIds: values.categoryIds,
    });
  }

  const allCurrencies = currencies.includes(budget.currency)
    ? currencies
    : [budget.currency, ...currencies];

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit budget</DialogTitle>
          <DialogDescription>
            Edit the budget to update your spending goals.
          </DialogDescription>
        </DialogHeader>
        <BudgetForm
          currencies={allCurrencies}
          initialValues={{
            name: budget.name,
            targetAmount: String(budget.targetAmount / 100),
            currency: budget.currency,
            categoryIds: budget.categories.map((c) => c.id),
          }}
          isLoading={isUpdating}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
