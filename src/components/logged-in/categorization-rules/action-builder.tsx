"use client";

import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { FieldError, FieldErrorsImpl, Merge } from "react-hook-form";
import { CategorySelect } from "@/components/logged-in/transactions/category-select";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RuleAction } from "@/db/schema";

const ACTION_TYPES = [
  { value: "set_category", label: "Set category" },
  { value: "set_sign", label: "Set sign" },
  { value: "ignore", label: "Ignore transaction" },
] as const;

const SIGN_OPTIONS = [
  { value: "positive", label: "Positive (expense)" },
  { value: "negative", label: "Negative (income)" },
] as const;

type ArrayFieldError = Merge<
  FieldError,
  FieldErrorsImpl<{ type: string; value?: string }[]>
>;

interface ActionBuilderProps {
  actions: RuleAction[];
  onChange: (actions: RuleAction[]) => void;
  errors?: ArrayFieldError;
}

export function ActionBuilder({
  actions,
  onChange,
  errors,
}: ActionBuilderProps) {
  const addAction = () => {
    onChange([...actions, { type: "set_category", value: "" }]);
  };

  const removeAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, updates: Partial<RuleAction>) => {
    onChange(
      actions.map((a, i) => {
        if (i !== index) {
          return a;
        }
        const updated = { ...a, ...updates };
        if (updates.type && updates.type !== a.type) {
          if (updates.type === "ignore") {
            updated.value = undefined;
          } else if (updates.type === "set_sign") {
            updated.value = "positive";
          } else {
            updated.value = "";
          }
        }
        return updated;
      })
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">Actions</span>
        <Button onClick={addAction} size="sm" type="button" variant="outline">
          <IconPlus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>

      {actions.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Add at least one action to perform when the rule matches.
        </p>
      )}

      {actions.map((action, index) => {
        const error =
          errors?.[index]?.message ?? errors?.[index]?.root?.message;
        return (
          <div className="space-y-1" key={String(index)}>
            <div className="flex items-center gap-2">
              <Select
                onValueChange={(value) =>
                  updateAction(index, { type: value as RuleAction["type"] })
                }
                value={action.type}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {action.type === "set_category" && (
                <CategorySelect
                  className={`flex-1 ${error ? "border-destructive" : ""}`}
                  onChange={(value) =>
                    updateAction(index, { value: value ?? "" })
                  }
                  placeholder="Select category"
                  value={action.value ?? null}
                />
              )}

              {action.type === "set_sign" && (
                <Select
                  onValueChange={(value) => updateAction(index, { value })}
                  value={action.value ?? "positive"}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIGN_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {action.type === "ignore" && (
                <span className="flex-1 text-muted-foreground text-sm">
                  Transaction will be skipped during import
                </span>
              )}

              <Button
                onClick={() => removeAction(index)}
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
