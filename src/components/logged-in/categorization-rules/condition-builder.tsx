"use client";

import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { FieldError, FieldErrorsImpl, Merge } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RuleCondition } from "@/db/schema";

const FIELD_OPTIONS = [
  { value: "merchant_name", label: "Merchant name" },
  { value: "amount", label: "Amount" },
] as const;

const MERCHANT_OPERATORS = [
  { value: "contains", label: "contains" },
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
] as const;

const AMOUNT_OPERATORS = [
  { value: "gt", label: ">" },
  { value: "lt", label: "<" },
  { value: "gte", label: ">=" },
  { value: "lte", label: "<=" },
  { value: "eq", label: "=" },
  { value: "neq", label: "!=" },
] as const;

type ArrayFieldError = Merge<
  FieldError,
  FieldErrorsImpl<{ field: string; operator: string; value: string | number }[]>
>;

interface ConditionBuilderProps {
  conditions: RuleCondition[];
  onChange: (conditions: RuleCondition[]) => void;
  errors?: ArrayFieldError;
}

export function ConditionBuilder({
  conditions,
  onChange,
  errors,
}: ConditionBuilderProps) {
  const addCondition = () => {
    onChange([
      ...conditions,
      { field: "merchant_name", operator: "contains", value: "" },
    ]);
  };

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    onChange(
      conditions.map((c, i) => {
        if (i !== index) {
          return c;
        }
        const updated = { ...c, ...updates };
        if (updates.field === "merchant_name" && c.field !== "merchant_name") {
          updated.operator = "contains";
          updated.value = "";
        } else if (updates.field === "amount" && c.field !== "amount") {
          updated.operator = "gt";
          updated.value = 0;
        }
        return updated;
      })
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">Conditions</span>
        <Button
          onClick={addCondition}
          size="sm"
          type="button"
          variant="outline"
        >
          <IconPlus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>

      {conditions.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Add at least one condition for the rule to match transactions.
        </p>
      )}

      {conditions.map((condition, index) => {
        const error =
          errors?.[index]?.message ?? errors?.[index]?.root?.message;
        return (
          <div className="space-y-1" key={String(index)}>
            <div className="flex items-center gap-2">
              <Select
                onValueChange={(value) =>
                  updateCondition(index, {
                    field: value as RuleCondition["field"],
                  })
                }
                value={condition.field}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                key={`${index}-${condition.field}`}
                onValueChange={(value) =>
                  updateCondition(index, {
                    operator: value as RuleCondition["operator"],
                  })
                }
                value={condition.operator}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(condition.field === "merchant_name"
                    ? MERCHANT_OPERATORS
                    : AMOUNT_OPERATORS
                  ).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {condition.field === "merchant_name" ? (
                <Input
                  className={`flex-1 ${error ? "border-destructive" : ""}`}
                  onChange={(e) =>
                    updateCondition(index, { value: e.target.value })
                  }
                  placeholder="e.g. Amazon"
                  type="text"
                  value={String(condition.value)}
                />
              ) : (
                <Input
                  className={`flex-1 ${error ? "border-destructive" : ""}`}
                  onChange={(e) =>
                    updateCondition(index, {
                      value:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                  placeholder="Amount in cents"
                  type="number"
                  value={condition.value === "" ? "" : Number(condition.value)}
                />
              )}

              <Button
                onClick={() => removeCondition(index)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        );
      })}
    </div>
  );
}
