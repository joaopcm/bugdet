'use client'

import { CategorySelect } from '@/components/logged-in/transactions/category-select'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { RuleAction } from '@/db/schema'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import type { FieldError, FieldErrorsImpl, Merge } from 'react-hook-form'

const ACTION_TYPES = [
  { value: 'set_category', label: 'Set category' },
  { value: 'set_sign', label: 'Set sign' },
  { value: 'ignore', label: 'Ignore transaction' },
] as const

const SIGN_OPTIONS = [
  { value: 'positive', label: 'Positive (expense)' },
  { value: 'negative', label: 'Negative (income)' },
] as const

type ArrayFieldError = Merge<
  FieldError,
  FieldErrorsImpl<{ type: string; value?: string }[]>
>

interface ActionBuilderProps {
  actions: RuleAction[]
  onChange: (actions: RuleAction[]) => void
  errors?: ArrayFieldError
}

export function ActionBuilder({
  actions,
  onChange,
  errors,
}: ActionBuilderProps) {
  const addAction = () => {
    onChange([...actions, { type: 'set_category', value: '' }])
  }

  const removeAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index))
  }

  const updateAction = (index: number, updates: Partial<RuleAction>) => {
    onChange(
      actions.map((a, i) => {
        if (i !== index) return a
        const updated = { ...a, ...updates }
        if (updates.type && updates.type !== a.type) {
          if (updates.type === 'ignore') {
            updated.value = undefined
          } else if (updates.type === 'set_sign') {
            updated.value = 'positive'
          } else {
            updated.value = ''
          }
        }
        return updated
      }),
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Actions</span>
        <Button type="button" variant="outline" size="sm" onClick={addAction}>
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
        const error = errors?.[index]?.message ?? errors?.[index]?.root?.message
        return (
          <div key={String(index)} className="space-y-1">
            <div className="flex items-center gap-2">
              <Select
                value={action.type}
                onValueChange={(value) =>
                  updateAction(index, { type: value as RuleAction['type'] })
                }
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

              {action.type === 'set_category' && (
                <CategorySelect
                  value={action.value ?? null}
                  onChange={(value) =>
                    updateAction(index, { value: value ?? '' })
                  }
                  placeholder="Select category"
                  className={`flex-1 ${error ? 'border-destructive' : ''}`}
                />
              )}

              {action.type === 'set_sign' && (
                <Select
                  value={action.value ?? 'positive'}
                  onValueChange={(value) => updateAction(index, { value })}
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

              {action.type === 'ignore' && (
                <span className="text-muted-foreground flex-1 text-sm">
                  Transaction will be skipped during import
                </span>
              )}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeAction(index)}
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        )
      })}
    </div>
  )
}
