import { PageLayout } from '@/components/logged-in/page-layout'

export default function DashboardPage() {
  return (
    <PageLayout.Root>
      <PageLayout.Header>
        <PageLayout.HeaderContent>
          <PageLayout.HeaderTitle title="Dashboard" />
          <PageLayout.HeaderDescription description="View your financial life." />
        </PageLayout.HeaderContent>
      </PageLayout.Header>
    </PageLayout.Root>
  )
}
