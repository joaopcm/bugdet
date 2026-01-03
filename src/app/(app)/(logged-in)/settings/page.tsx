import { PageLayout } from '@/components/logged-in/page-layout'
import { ProfilePictureSettings } from '@/components/settings/profile-picture-settings'
import { TwoFactorSettings } from '@/components/settings/two-factor-settings'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings',
}

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
        <ProfilePictureSettings />
        <TwoFactorSettings />
      </div>
    </PageLayout.Root>
  )
}
