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
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useTransactions } from "@/hooks/use-transactions";
import { trpc } from "@/lib/trpc/client";
import { pluralize } from "@/lib/utils";
import { FloatingActionBar } from "../bulk-actions/floating-action-bar";
import { EmptyState } from "../empty-state";
import { TransactionsFilters } from "./filters";
import { LoadingState } from "./loading-state";
import { TransactionItem } from "./transaction-item";
import { TransactionsPagination } from "./transactions-pagination";

export const TransactionsTable = () => {
  const isMobile = useIsMobile();
  const { data: transactions, isLoading, invalidate } = useTransactions();

  const itemIds = useMemo(
    () => transactions?.data?.map((t) => t.id) ?? [],
    [transactions?.data]
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
    trpc.transactions.deleteMany.useMutation({
      onMutate: () => {
        toast.loading("Deleting transactions...", {
          id: "delete-transactions",
        });
      },
      onSuccess: () => {
        toast.success(
          `Deleted ${selectedIds.size} ${pluralize(selectedIds.size, "transaction")}`,
          { id: "delete-transactions" }
        );
        clearSelection();
        invalidate();
      },
      onError: (error) => {
        toast.error(error.message, { id: "delete-transactions" });
      },
    });

  const handleBulkDelete = () => {
    deleteMany({ ids: Array.from(selectedIds) });
  };

  return (
    <div className="flex flex-col gap-4">
      <TransactionsFilters />
      <div className="relative overflow-visible">
        <Checkbox
          aria-label="Select all transactions"
          checked={isAllSelected}
          className="absolute top-2.5 -left-8 hidden opacity-0 hover:opacity-100 data-[state=checked]:opacity-100 data-[state=indeterminate]:opacity-100 md:block"
          indeterminate={isPartiallySelected}
          onCheckedChange={toggleAll}
        />
        <Table containerClassName="overflow-visible">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[15%]">Date</TableHead>
              <TableHead className="w-[20%]">Category</TableHead>
              <TableHead className="w-[30%]">Merchant</TableHead>
              <TableHead className="w-[20%]">Amount</TableHead>
              <TableHead className="w-[15%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <LoadingState />}

            {transactions?.data?.map((transaction) => (
              <TransactionItem
                isSelected={selectedIds.has(transaction.id)}
                key={transaction.id}
                onSelect={handleClick}
                transaction={transaction}
              />
            ))}

            {transactions?.data?.length === 0 && (
              <TableRow>
                <TableCell className="py-10" colSpan={5}>
                  <EmptyState
                    description="Upload your bank statements to get started."
                    title="No transactions found."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TransactionsPagination hasMore={!!transactions?.hasMore} />

      <FloatingActionBar
        className="w-[301px]"
        isDeleting={isDeleting}
        onDelete={handleBulkDelete}
        selectedCount={selectedIds.size}
      />
    </div>
  );
};
