'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { RuleAction, RuleCondition } from '@/db/schema'
import { useRefetchCategorizationRules } from '@/hooks/use-categorization-rules'
import { trpc } from '@/lib/trpc/client'
import { useState } from 'react'
import { toast } from 'sonner'
import { RuleForm, type RuleFormValues } from './rule-form'

interface EditRuleDialogProps {
  ruleId: string
  name: string
  logicOperator: 'and' | 'or'
  conditions: RuleCondition[]
  actions: RuleAction[]
  enabled: boolean
}

export function EditRuleDialog({
  ruleId,
  name,
  logicOperator,
  conditions,
  actions,
  enabled,
}: EditRuleDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const refetchRules = useRefetchCategorizationRules()

  const { mutate: updateRule, isPending: isUpdating } =
    trpc.categorizationRules.update.useMutation({
      onSuccess: (_, { name }) => {
        refetchRules()
        toast.success(`Updated rule "${name}".`)
        setIsOpen(false)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  function onSubmit(values: RuleFormValues) {
    updateRule({ id: ruleId, ...values })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
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
          isLoading={isUpdating}
          onSubmit={onSubmit}
          initialValues={{
            name,
            logicOperator,
            conditions,
            actions,
            enabled,
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
