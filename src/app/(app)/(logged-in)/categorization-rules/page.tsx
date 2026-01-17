import type { Metadata } from "next";
import { CategorizationRulesTable } from "@/components/logged-in/categorization-rules/categorization-rules-table";
import { CreateRuleDialog } from "@/components/logged-in/categorization-rules/create-rule-dialog";
import { RefreshButton } from "@/components/logged-in/categorization-rules/refresh-button";
import { PageLayout } from "@/components/logged-in/page-layout";

export const metadata: Metadata = {
  title: "Rules",
};

export default function CategorizationRulesPage() {
  return (
    <PageLayout.Root>
      <PageLayout.Header>
        <PageLayout.HeaderContent>
          <PageLayout.HeaderTitle title="Rules" />
          <PageLayout.HeaderDescription description="Define rules to automatically process transactions during import." />
        </PageLayout.HeaderContent>

        <div className="flex items-center gap-2">
          <CreateRuleDialog />
          <RefreshButton />
        </div>
      </PageLayout.Header>
      <CategorizationRulesTable />
    </PageLayout.Root>
  );
}
