'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { TableCell, TableRow } from '@/components/ui/table'
import type { RuleAction, RuleCondition } from '@/db/schema'
import { useRefetchCategorizationRules } from '@/hooks/use-categorization-rules'
import { trpc } from '@/lib/trpc/client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconGripVertical } from '@tabler/icons-react'
import { toast } from 'sonner'
import { DoubleConfirmationAlertDialog } from '../double-confirmation-alert-dialog'
import { EditRuleDialog } from './edit-rule-dialog'

interface RuleItemProps {
  rule: {
    id: string
    name: string
    priority: number
    logicOperator: 'and' | 'or'
    conditions: RuleCondition[]
    actions: RuleAction[]
    enabled: boolean
  }
  isSelected?: boolean
  onSelect?: (id: string, event: React.MouseEvent) => void
}

function formatConditions(
  conditions: RuleCondition[],
  logic: 'and' | 'or',
): string {
  const parts = conditions.map((c) => {
    if (c.field === 'merchant_name') {
      const op = c.operator === 'eq' ? 'equals' : 'contains'
      return `merchant ${op} "${c.value}"`
    }
    const op =
      c.operator === 'gt'
        ? '>'
        : c.operator === 'lt'
          ? '<'
          : c.operator === 'gte'
            ? '>='
            : c.operator === 'lte'
              ? '<='
              : '='
    return `amount ${op} ${c.value}`
  })
  return parts.join(logic === 'and' ? ' AND ' : ' OR ')
}

function formatActions(actions: RuleAction[]): string {
  return actions
    .map((a) => {
      if (a.type === 'ignore') {
        return 'Ignore'
      }

      if (a.type === 'set_sign') {
        return `Set ${a.value === 'positive' ? '+' : '-'}`
      }

      return 'Set category'
    })
    .join(', ')
}

export function RuleItem({
  rule,
  isSelected = false,
  onSelect,
}: RuleItemProps) {
  const refetchRules = useRefetchCategorizationRules()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const { mutate: deleteRule, isPending: isDeleting } =
    trpc.categorizationRules.delete.useMutation({
      onSuccess: () => {
        refetchRules()
        toast.success(`Deleted rule "${rule.name}".`)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  return (
    <TableRow ref={setNodeRef} style={style} className="group">
      <TableCell className="relative w-[40px]">
        <Checkbox
          checked={isSelected}
          onClick={(e) => onSelect?.(rule.id, e)}
          className="absolute -left-8 top-3 hidden opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 md:block"
          aria-label={`Select rule ${rule.name}`}
        />
        <button
          type="button"
          className="cursor-grab touch-none"
          {...attributes}
          {...listeners}
        >
          <IconGripVertical className="text-muted-foreground h-4 w-4" />
        </button>
      </TableCell>
      <TableCell className="font-medium">{rule.name}</TableCell>
      <TableCell className="text-muted-foreground max-w-[200px] truncate text-sm">
        {formatConditions(rule.conditions, rule.logicOperator)}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatActions(rule.actions)}
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="select-none">
          <div
            className={`size-2 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-400'}`}
          />
          {rule.enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </TableCell>
      <TableCell className="flex items-center gap-2">
        <DoubleConfirmationAlertDialog
          title={`Delete rule "${rule.name}"?`}
          description="This action cannot be undone."
          onConfirm={() => deleteRule({ id: rule.id })}
        >
          <Button variant="destructive" size="sm" disabled={isDeleting}>
            Delete
          </Button>
        </DoubleConfirmationAlertDialog>
        <EditRuleDialog
          ruleId={rule.id}
          name={rule.name}
          logicOperator={rule.logicOperator}
          conditions={rule.conditions}
          actions={rule.actions}
          enabled={rule.enabled}
        />
      </TableCell>
    </TableRow>
  )
}
