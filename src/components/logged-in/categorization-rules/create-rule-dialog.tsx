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
import { Kbd } from '@/components/ui/kbd'
import { useRefetchCategorizationRules } from '@/hooks/use-categorization-rules'
import { trpc } from '@/lib/trpc/client'
import { useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'
import { RuleForm, type RuleFormValues } from './rule-form'

const NEW_RULE_SHORTCUT = 'N'

export function CreateRuleDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const refetchRules = useRefetchCategorizationRules()

  const { mutate: createRule, isPending: isCreating } =
    trpc.categorizationRules.create.useMutation({
      onSuccess: (_, { name }) => {
        refetchRules()
        toast.success(`Created rule "${name}".`)
        setIsOpen(false)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  useHotkeys(NEW_RULE_SHORTCUT, (e) => {
    e.preventDefault()
    setIsOpen(true)
  })

  function onSubmit(values: RuleFormValues) {
    createRule(values)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          New rule
          <Kbd variant="default" className="-mr-2">
            {NEW_RULE_SHORTCUT}
          </Kbd>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create rule</DialogTitle>
          <DialogDescription>
            Define conditions and actions to automatically process transactions.
          </DialogDescription>
        </DialogHeader>
        <RuleForm isLoading={isCreating} onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  )
}
