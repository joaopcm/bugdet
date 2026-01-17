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
import type { RuleAction, RuleCondition } from "@/db/schema";
import { useRefetchCategorizationRules } from "@/hooks/use-categorization-rules";
import { trpc } from "@/lib/trpc/client";
import { RuleForm, type RuleFormValues } from "./rule-form";

interface EditRuleDialogProps {
  ruleId: string;
  name: string;
  logicOperator: "and" | "or";
  conditions: RuleCondition[];
  actions: RuleAction[];
  enabled: boolean;
}

export function EditRuleDialog({
  ruleId,
  name,
  logicOperator,
  conditions,
  actions,
  enabled,
}: EditRuleDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const refetchRules = useRefetchCategorizationRules();

  const { mutate: updateRule, isPending: isUpdating } =
    trpc.categorizationRules.update.useMutation({
      onSuccess: (_, { name }) => {
        refetchRules();
        toast.success(`Updated rule "${name}".`);
        setIsOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  function onSubmit(values: RuleFormValues) {
    updateRule({ id: ruleId, ...values });
  }

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit rule</DialogTitle>
          <DialogDescription>
            Modify conditions and actions for this rule.
          </DialogDescription>
        </DialogHeader>
        <RuleForm
          initialValues={{
            name,
            logicOperator,
            conditions,
            actions,
            enabled,
          }}
          isLoading={isUpdating}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
