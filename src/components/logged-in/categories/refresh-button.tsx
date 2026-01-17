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
import { useCategories } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";

const REFRESH_SHORTCUT = "R";

export function RefreshButton() {
  const {
    refetch: refetchCategories,
    isRefetching,
    isLoading,
  } = useCategories();

  useHotkeys(REFRESH_SHORTCUT, () => refetchCategories());

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          disabled={isRefetching || isLoading}
          onClick={() => refetchCategories()}
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
        category list
      </TooltipContent>
    </Tooltip>
  );
}
