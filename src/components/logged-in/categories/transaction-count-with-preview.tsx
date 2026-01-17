"use client";

import { format } from "date-fns";
import { type RefObject, useMemo, useRef } from "react";
import { useHover } from "usehooks-ts";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MAX_TRANSACTIONS_PREVIEW } from "@/constants/categories";
import { trpc } from "@/lib/trpc/client";
import { cn, formatCurrency } from "@/lib/utils";

interface TransactionCountWithPreviewProps {
  id: string;
  transactionCount: number;
}

export function TransactionCountWithPreview({
  id,
  transactionCount,
}: TransactionCountWithPreviewProps) {
  const hoverRef = useRef<HTMLButtonElement | null>(null);
  const isHovering = useHover(hoverRef as RefObject<HTMLButtonElement>);

  const { data: lastTransactions, isLoading } =
    trpc.categories.preview.useQuery(
      { id },
      {
        enabled: isHovering,
      }
    );

  const transactionsGroupedByDate = useMemo(() => {
    return (
      lastTransactions?.reduce(
        (acc, transaction) => {
          const date = format(transaction.date, "MMM d, yyyy");
          acc[date] = [...(acc[date] || []), transaction];
          return acc;
        },
        {} as Record<string, typeof lastTransactions>
      ) ?? {}
    );
  }, [lastTransactions]);

  const dates = Object.keys(transactionsGroupedByDate ?? {});
  const missingTransactions =
    transactionCount - (lastTransactions?.length ?? 0);

  return (
    <Tooltip>
      <TooltipTrigger
        className="underline decoration-dashed underline-offset-2"
        ref={hoverRef}
      >
        {transactionCount} transaction
        {transactionCount === 1 ? "" : "s"}
      </TooltipTrigger>
      <TooltipContent className="p-0" side="right">
        <div className="max-h-48 overflow-y-auto px-3 py-1.5">
          <ul
            className={cn("grid gap-3 text-xs", {
              "min-w-48 max-w-56": !!lastTransactions?.length,
            })}
          >
            {isLoading && <li>Loading...</li>}

            {dates.map((date) => (
              <li className="grid gap-0.5" key={date}>
                <span className="text-muted">{date}</span>
                <ul className="grid gap-0.5">
                  {transactionsGroupedByDate[date].map((transaction) => (
                    <TransactionPreviewItem
                      amount={transaction.amount}
                      currency={transaction.currency}
                      key={transaction.id}
                      merchantName={transaction.merchantName}
                    />
                  ))}
                </ul>
              </li>
            ))}

            {!(dates.length || isLoading) && <li>No transactions yet</li>}

            {lastTransactions?.length &&
            lastTransactions.length >= MAX_TRANSACTIONS_PREVIEW ? (
              <li>
                <span className="text-muted">
                  {missingTransactions} more transaction
                  {missingTransactions === 1 ? "" : "s"}
                </span>
              </li>
            ) : null}
          </ul>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface TransactionPreviewItemProps {
  merchantName: string;
  amount: number;
  currency: string;
}

function TransactionPreviewItem({
  merchantName,
  amount,
  currency,
}: TransactionPreviewItemProps) {
  return (
    <li>
      <span className="font-medium">
        {formatCurrency(amount, currency)} at {merchantName}
      </span>
    </li>
  );
}
