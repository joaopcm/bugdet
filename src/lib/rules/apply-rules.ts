import type { CategorizationRule, RuleAction, RuleCondition } from '@/db/schema'

export type TransactionInput = {
  merchantName: string
  amount: number
  category?: string | null
}

export type RuleResult = {
  skip: boolean
  rulesApplied: number
  overrides: {
    amount?: number
    categoryId?: string
  }
}

function matchesCondition(
  tx: TransactionInput,
  condition: RuleCondition,
): boolean {
  if (condition.field === 'merchant_name') {
    const txName = tx.merchantName.toLowerCase()
    const ruleValue = String(condition.value).toLowerCase()
    if (condition.operator === 'eq') {
      return txName === ruleValue
    }
    if (condition.operator === 'neq') {
      return txName !== ruleValue
    }
    return txName.includes(ruleValue)
  }

  if (condition.field === 'amount') {
    const value = Number(condition.value)
    switch (condition.operator) {
      case 'gt':
        return tx.amount > value
      case 'lt':
        return tx.amount < value
      case 'gte':
        return tx.amount >= value
      case 'lte':
        return tx.amount <= value
      case 'eq':
        return tx.amount === value
      default:
        return false
    }
  }

  return false
}

function matchesRule(tx: TransactionInput, rule: CategorizationRule): boolean {
  if (rule.conditions.length === 0) return false

  if (rule.logicOperator === 'and') {
    return rule.conditions.every((c) => matchesCondition(tx, c))
  }

  return rule.conditions.some((c) => matchesCondition(tx, c))
}

function applyAction(
  overrides: RuleResult['overrides'],
  action: RuleAction,
  currentAmount: number,
): { skip: boolean; newOverrides: RuleResult['overrides'] } {
  if (action.type === 'ignore') {
    return { skip: true, newOverrides: overrides }
  }

  if (action.type === 'set_sign' && action.value) {
    const amount = overrides.amount ?? currentAmount
    const absAmount = Math.abs(amount)
    return {
      skip: false,
      newOverrides: {
        ...overrides,
        amount: action.value === 'positive' ? absAmount : -absAmount,
      },
    }
  }

  if (action.type === 'set_category' && action.value) {
    return {
      skip: false,
      newOverrides: {
        ...overrides,
        categoryId: action.value,
      },
    }
  }

  return { skip: false, newOverrides: overrides }
}

export function applyRules(
  tx: TransactionInput,
  rules: CategorizationRule[],
): RuleResult {
  let overrides: RuleResult['overrides'] = {}
  let rulesApplied = 0

  for (const rule of rules) {
    if (!matchesRule(tx, rule)) continue

    rulesApplied++

    for (const action of rule.actions) {
      const result = applyAction(overrides, action, tx.amount)
      if (result.skip) {
        return { skip: true, rulesApplied, overrides: {} }
      }
      overrides = result.newOverrides
    }
  }

  return { skip: false, rulesApplied, overrides }
}
