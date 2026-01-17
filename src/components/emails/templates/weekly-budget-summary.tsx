import { Button, Link, Section, Text } from "@react-email/components";
import { formatCurrency, pluralize } from "@/lib/utils";
import { Layout } from "../components/layout";

interface BudgetProgress {
  name: string;
  targetAmount: number;
  spentAmount: number;
  currency: string;
  categories: string[];
  percentUsed: number;
}

interface WeeklyBudgetSummaryEmailProps {
  budgets: BudgetProgress[];
  month: string;
  budgetsLink: string;
}

export default function WeeklyBudgetSummaryEmail({
  budgets = [
    {
      name: "Monthly Groceries",
      targetAmount: 50_000,
      spentAmount: 35_000,
      currency: "USD",
      categories: ["Food", "Groceries"],
      percentUsed: 70,
    },
    {
      name: "Entertainment",
      targetAmount: 20_000,
      spentAmount: 22_000,
      currency: "USD",
      categories: ["Movies", "Streaming"],
      percentUsed: 110,
    },
  ],
  month = "January 2025",
  budgetsLink = "https://bugdet.co/budgets",
}: WeeklyBudgetSummaryEmailProps) {
  const overBudgetCount = budgets.filter(
    (b) => b.spentAmount > b.targetAmount
  ).length;

  return (
    <Layout
      preview={`Your weekly budget summary for ${month}. ${overBudgetCount > 0 ? `${overBudgetCount} ${pluralize(overBudgetCount, "budget is", "budgets are")} over limit.` : "All budgets on track!"}`}
      title="Weekly Budget Summary"
    >
      <Section className="bg-white px-[24px] py-[32px]">
        <Text className="mb-[24px] text-[16px] text-gray-800">Hi,</Text>

        <Text className="mb-[24px] text-[16px] text-gray-800">
          Here's your weekly budget summary for <strong>{month}</strong>.
        </Text>

        {budgets.map((budget, index) => {
          const isOverBudget = budget.spentAmount > budget.targetAmount;
          return (
            <Section
              className="mb-[16px] rounded-[8px] bg-[#F4F4F0] p-[16px]"
              key={String(index)}
              style={{
                borderTop: "1px solid #999A5E",
                borderLeft: "1px solid #999A5E",
                borderRight: "4px solid #76773C",
                borderBottom: "4px solid #76773C",
              }}
            >
              <Text className="m-0 mb-[8px] font-bold text-[#76773C] text-[16px]">
                {budget.name}
              </Text>
              <Text className="m-0 mb-[8px] text-[14px] text-gray-600">
                {budget.categories.join(", ")}
              </Text>
              <Text
                className="m-0 font-bold text-[18px]"
                style={{ color: isOverBudget ? "#DC2626" : "#16A34A" }}
              >
                {formatCurrency(budget.spentAmount, budget.currency)} /{" "}
                {formatCurrency(budget.targetAmount, budget.currency)}
              </Text>
              <Text
                className="m-0 mt-[4px] text-[14px]"
                style={{ color: isOverBudget ? "#DC2626" : "#16A34A" }}
              >
                {budget.percentUsed}% used
              </Text>
            </Section>
          );
        })}

        <Text className="mt-[24px] mb-[24px] text-[16px] text-gray-800">
          View all your budgets and make adjustments as needed:
        </Text>

        <Button
          className="box-border block rounded-[8px] bg-[#999A5E] px-[24px] py-[12px] text-center font-bold text-[16px] text-white no-underline"
          href={budgetsLink}
          style={{
            borderTop: "1px solid #999A5E",
            borderLeft: "1px solid #999A5E",
            borderRight: "4px solid #76773C",
            borderBottom: "4px solid #76773C",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          View my budgets
        </Button>

        <Text className="mt-[16px] mb-[24px] text-left text-[14px] text-gray-600">
          If the button doesn't work, copy and paste this link into your
          browser:
          <br />
          <Link
            className="break-all font-medium text-[#76773C]"
            href={budgetsLink}
          >
            {budgetsLink}
          </Link>
        </Text>
      </Section>
    </Layout>
  );
}
