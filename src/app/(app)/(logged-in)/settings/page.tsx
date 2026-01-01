import { PageLayout } from '@/components/logged-in/page-layout'
import { TwoFactorSettings } from '@/components/settings/two-factor-settings'

export default function SettingsPage() {
  return (
    <PageLayout.Root>
      <PageLayout.Header>
        <PageLayout.HeaderContent>
          <PageLayout.HeaderTitle title="Settings" />
          <PageLayout.HeaderDescription description="View and manage your settings." />
        </PageLayout.HeaderContent>
      </PageLayout.Header>
      <div className="flex flex-col gap-6">
        <TwoFactorSettings />
      </div>
    </PageLayout.Root>
  )
}
