import { PageLayout } from '@/components/logged-in/page-layout'

export default function SettingsPage() {
  return (
    <PageLayout.Root>
      <PageLayout.Header>
        <PageLayout.HeaderContent>
          <PageLayout.HeaderTitle title="Settings" />
          <PageLayout.HeaderDescription description="View and manage your settings." />
        </PageLayout.HeaderContent>
      </PageLayout.Header>
    </PageLayout.Root>
  )
}
