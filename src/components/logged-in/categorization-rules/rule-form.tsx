'use client'

import { ActionBuilder } from '@/components/logged-in/categorization-rules/action-builder'
import { ConditionBuilder } from '@/components/logged-in/categorization-rules/condition-builder'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Kbd, SHORTCUTS_VALUES } from '@/components/ui/kbd'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { RuleAction, RuleCondition } from '@/db/schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useHotkeys } from 'react-hotkeys-hook'
import z from 'zod'

const ruleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  logicOperator: z.enum(['and', 'or']),
  conditions: z
    .array(
      z
        .object({
          field: z.enum(['merchant_name', 'amount']),
          operator: z.enum(['contains', 'gt', 'lt', 'gte', 'lte', 'eq', 'neq']),
          value: z.union([z.string(), z.number()]),
        })
        .refine(
          (condition) => {
            if (condition.field === 'merchant_name') {
              return String(condition.value).length > 0
            }
            if (condition.field === 'amount') {
              return (
                typeof condition.value === 'number' || condition.value !== ''
              )
            }
            return true
          },
          {
            message: 'Please enter a value for this condition',
          },
        ),
    )
    .min(1, 'At least one condition is required'),
  actions: z
    .array(
      z
        .object({
          type: z.enum(['set_sign', 'set_category', 'ignore']),
          value: z.string().optional(),
        })
        .refine(
          (action) => {
            if (action.type === 'set_category') {
              return action.value && action.value.length > 0
            }
            if (action.type === 'set_sign') {
              return action.value === 'positive' || action.value === 'negative'
            }
            return true
          },
          {
            message: 'Please select a value for this action',
          },
        ),
    )
    .min(1, 'At least one action is required'),
  enabled: z.boolean(),
})

export type RuleFormValues = z.infer<typeof ruleSchema>

interface RuleFormProps {
  isLoading: boolean
  onSubmit: (values: RuleFormValues) => void
  initialValues?: RuleFormValues
}

export function RuleForm({
  isLoading,
  onSubmit,
  initialValues,
}: RuleFormProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const submitButtonRef = useRef<HTMLButtonElement>(null)

  useHotkeys(['esc'], () => {
    if (!closeButtonRef.current) return
    closeButtonRef.current.click()
  })

  useHotkeys(['meta+enter'], () => {
    if (isLoading || !submitButtonRef.current) return
    submitButtonRef.current.click()
  })

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: initialValues ?? {
      name: '',
      logicOperator: 'and',
      conditions: [],
      actions: [],
      enabled: true,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="name">Name</FormLabel>
              <FormControl>
                <Input
                  id="name"
                  placeholder="e.g. Skip Amazon refunds"
                  type="text"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logicOperator"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logic</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="and">
                    Match ALL conditions (AND)
                  </SelectItem>
                  <SelectItem value="or">Match ANY condition (OR)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How conditions should be combined
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="conditions"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <ConditionBuilder
                  conditions={field.value as RuleCondition[]}
                  onChange={field.onChange}
                  errors={fieldState.error}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="actions"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <ActionBuilder
                  actions={field.value as RuleAction[]}
                  onChange={field.onChange}
                  errors={fieldState.error}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Enabled</FormLabel>
                <FormDescription>
                  Disabled rules will not be applied during import.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" ref={closeButtonRef}>
              Cancel <Kbd variant="outline">{SHORTCUTS_VALUES.ESC}</Kbd>
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isLoading} ref={submitButtonRef}>
            Save{' '}
            <Kbd>
              {SHORTCUTS_VALUES.CMD} + {SHORTCUTS_VALUES.ENTER}
            </Kbd>
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
