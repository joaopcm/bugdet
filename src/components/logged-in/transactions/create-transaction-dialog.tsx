"use client";

import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
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
import { Kbd } from "@/components/ui/kbd";
import { useInvalidateTransactions } from "@/hooks/use-transactions";
import { trpc } from "@/lib/trpc/client";
import { getCurrencyCode, parseCurrency } from "@/lib/utils";
import {
  TransactionForm,
  type TransactionFormValues,
} from "./transaction-form";

const NEW_TRANSACTION_SHORTCUT = "N";

export function CreateTransactionDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const invalidate = useInvalidateTransactions();

  const { mutate: createTransaction, isPending: isCreating } =
    trpc.transactions.create.useMutation({
      onSuccess: () => {
        invalidate();
        toast.success("You have created the transaction.");
        setIsOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  useHotkeys(NEW_TRANSACTION_SHORTCUT, () => setIsOpen(true));

  function onSubmit(values: TransactionFormValues) {
    createTransaction({
      ...values,
      currency: getCurrencyCode(),
      amount: parseCurrency(values.amount),
    });
  }

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button>
          New transaction
          <Kbd className="-mr-2" variant="default">
            {NEW_TRANSACTION_SHORTCUT}
          </Kbd>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create transaction</DialogTitle>
          <DialogDescription>
            Create a new transaction to track your spending.
          </DialogDescription>
        </DialogHeader>
        <TransactionForm isLoading={isCreating} onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
}
