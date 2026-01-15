import { formatCurrency, pluralize } from '@/lib/utils'
import { Button, Link, Section, Text } from '@react-email/components'
import { Layout } from '../components/layout'

interface BudgetProgress {
  name: string
  targetAmount: number
  spentAmount: number
  currency: string
  categories: string[]
  percentUsed: number
}

interface WeeklyBudgetSummaryEmailProps {
  budgets: BudgetProgress[]
  month: string
  budgetsLink: string
}

export default function WeeklyBudgetSummaryEmail({
  budgets = [
    {
      name: 'Monthly Groceries',
      targetAmount: 50_000,
      spentAmount: 35_000,
      currency: 'USD',
      categories: ['Food', 'Groceries'],
      percentUsed: 70,
    },
    {
      name: 'Entertainment',
      targetAmount: 20_000,
      spentAmount: 22_000,
      currency: 'USD',
      categories: ['Movies', 'Streaming'],
      percentUsed: 110,
    },
  ],
  month = 'January 2025',
  budgetsLink = 'https://bugdet.co/budgets',
}: WeeklyBudgetSummaryEmailProps) {
  const overBudgetCount = budgets.filter(
    (b) => b.spentAmount > b.targetAmount,
  ).length

  return (
    <Layout
      preview={`Your weekly budget summary for ${month}. ${overBudgetCount > 0 ? `${overBudgetCount} ${pluralize(overBudgetCount, 'budget is', 'budgets are')} over limit.` : 'All budgets on track!'}`}
      title="Weekly Budget Summary"
    >
      <Section className="px-[24px] py-[32px] bg-white">
        <Text className="text-[16px] text-gray-800 mb-[24px]">Hi,</Text>

        <Text className="text-[16px] text-gray-800 mb-[24px]">
          Here's your weekly budget summary for <strong>{month}</strong>.
        </Text>

        {budgets.map((budget) => {
          const isOverBudget = budget.spentAmount > budget.targetAmount
          return (
            <Section
              key={budget.name}
              className="bg-[#F4F4F0] p-[16px] mb-[16px] rounded-[8px]"
              style={{
                borderTop: '1px solid #999A5E',
                borderLeft: '1px solid #999A5E',
                borderRight: '4px solid #76773C',
                borderBottom: '4px solid #76773C',
              }}
            >
              <Text className="text-[16px] font-bold text-[#76773C] m-0 mb-[8px]">
                {budget.name}
              </Text>
              <Text className="text-[14px] text-gray-600 m-0 mb-[8px]">
                {budget.categories.join(', ')}
              </Text>
              <Text
                className="text-[18px] font-bold m-0"
                style={{ color: isOverBudget ? '#DC2626' : '#16A34A' }}
              >
                {formatCurrency(budget.spentAmount, budget.currency)} /{' '}
                {formatCurrency(budget.targetAmount, budget.currency)}
              </Text>
              <Text
                className="text-[14px] m-0 mt-[4px]"
                style={{ color: isOverBudget ? '#DC2626' : '#16A34A' }}
              >
                {budget.percentUsed}% used
              </Text>
            </Section>
          )
        })}

        <Text className="text-[16px] text-gray-800 mb-[24px] mt-[24px]">
          View all your budgets and make adjustments as needed:
        </Text>

        <Button
          className="bg-[#999A5E] text-white font-bold py-[12px] px-[24px] rounded-[8px] text-[16px] no-underline text-center block box-border"
          href={budgetsLink}
          style={{
            borderTop: '1px solid #999A5E',
            borderLeft: '1px solid #999A5E',
            borderRight: '4px solid #76773C',
            borderBottom: '4px solid #76773C',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          View my budgets
        </Button>

        <Text className="text-[14px] text-gray-600 text-left mt-[16px] mb-[24px]">
          If the button doesn't work, copy and paste this link into your
          browser:
          <br />
          <Link
            href={budgetsLink}
            className="text-[#76773C] font-medium break-all"
          >
            {budgetsLink}
          </Link>
        </Text>
      </Section>
    </Layout>
  )
}
