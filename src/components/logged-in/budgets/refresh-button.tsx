"use client";

import { RefreshCcwIcon } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBudgets } from "@/hooks/use-budgets";
import { cn } from "@/lib/utils";

const REFRESH_SHORTCUT = "R";

export function RefreshButton() {
  const { refetch: refetchBudgets, isRefetching, isLoading } = useBudgets();

  useHotkeys(REFRESH_SHORTCUT, () => refetchBudgets());

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          disabled={isRefetching || isLoading}
          onClick={() => refetchBudgets()}
          size="icon"
          variant="outline"
        >
          <RefreshCcwIcon
            className={cn({
              "animate-spin-reverse": isRefetching,
            })}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Or press <Kbd variant="outline">{REFRESH_SHORTCUT}</Kbd> to refresh the
        budget list
      </TooltipContent>
    </Tooltip>
  );
}
