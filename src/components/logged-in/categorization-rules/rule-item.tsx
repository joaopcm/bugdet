"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconGripVertical } from "@tabler/icons-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import type { RuleAction, RuleCondition } from "@/db/schema";
import { useRefetchCategorizationRules } from "@/hooks/use-categorization-rules";
import { trpc } from "@/lib/trpc/client";
import { DoubleConfirmationAlertDialog } from "../double-confirmation-alert-dialog";
import { EditRuleDialog } from "./edit-rule-dialog";

interface RuleItemProps {
  rule: {
    id: string;
    name: string;
    priority: number;
    logicOperator: "and" | "or";
    conditions: RuleCondition[];
    actions: RuleAction[];
    enabled: boolean;
  };
  isSelected?: boolean;
  onSelect?: (id: string, event: React.MouseEvent) => void;
}

const OPERATOR_SYMBOLS: Record<string, string> = {
  gt: ">",
  lt: "<",
  gte: ">=",
  lte: "<=",
  eq: "=",
};

function formatConditions(
  conditions: RuleCondition[],
  logic: "and" | "or"
): string {
  const parts = conditions.map((c) => {
    if (c.field === "merchant_name") {
      const op = c.operator === "eq" ? "equals" : "contains";
      return `merchant ${op} "${c.value}"`;
    }
    const op = OPERATOR_SYMBOLS[c.operator] ?? "=";
    return `amount ${op} ${c.value}`;
  });
  return parts.join(logic === "and" ? " AND " : " OR ");
}

function formatActions(actions: RuleAction[]): string {
  return actions
    .map((a) => {
      if (a.type === "ignore") {
        return "Ignore";
      }

      if (a.type === "set_sign") {
        return `Set ${a.value === "positive" ? "+" : "-"}`;
      }

      return "Set category";
    })
    .join(", ");
}

export function RuleItem({
  rule,
  isSelected = false,
  onSelect,
}: RuleItemProps) {
  const refetchRules = useRefetchCategorizationRules();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { mutate: deleteRule, isPending: isDeleting } =
    trpc.categorizationRules.delete.useMutation({
      onMutate: () => {
        toast.loading("Deleting rule...", { id: `delete-rule-${rule.id}` });
      },
      onSuccess: () => {
        refetchRules();
        toast.success(`Deleted rule "${rule.name}".`, {
          id: `delete-rule-${rule.id}`,
        });
      },
      onError: (error) => {
        toast.error(error.message, { id: `delete-rule-${rule.id}` });
      },
    });

  return (
    <TableRow className="group" ref={setNodeRef} style={style}>
      <TableCell className="relative w-[40px]">
        <Checkbox
          aria-label={`Select rule ${rule.name}`}
          checked={isSelected}
          className="absolute top-3 -left-8 hidden opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 md:block"
          onClick={(e) => onSelect?.(rule.id, e)}
        />
        <button
          className="cursor-grab touch-none"
          type="button"
          {...attributes}
          {...listeners}
        >
          <IconGripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell className="font-medium">{rule.name}</TableCell>
      <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
        {formatConditions(rule.conditions, rule.logicOperator)}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatActions(rule.actions)}
      </TableCell>
      <TableCell>
        <Badge className="select-none" variant="secondary">
          <div
            className={`size-2 rounded-full ${rule.enabled ? "bg-green-500" : "bg-gray-400"}`}
          />
          {rule.enabled ? "Enabled" : "Disabled"}
        </Badge>
      </TableCell>
      <TableCell className="flex items-center gap-2">
        <DoubleConfirmationAlertDialog
          description="This action cannot be undone."
          onConfirm={() => deleteRule({ id: rule.id })}
          title={`Delete rule "${rule.name}"?`}
        >
          <Button disabled={isDeleting} size="sm" variant="destructive">
            Delete
          </Button>
        </DoubleConfirmationAlertDialog>
        <EditRuleDialog
          actions={rule.actions}
          conditions={rule.conditions}
          enabled={rule.enabled}
          logicOperator={rule.logicOperator}
          name={rule.name}
          ruleId={rule.id}
        />
      </TableCell>
    </TableRow>
  );
}
