import { LoggedInLayoutClient } from '@/components/logged-in/logged-in-layout-client'
import { SiteHeader } from '@/components/logged-in/site-header'
import { OnboardingModal } from '@/components/onboarding/onboarding-modal'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getUserOnboardingStatus } from '@/data/user-profile'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { PropsWithChildren } from 'react'

export default async function LoggedInLayout({ children }: PropsWithChildren) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/sign-in')
  }

  const { completed } = await getUserOnboardingStatus(session.user.id)

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <LoggedInLayoutClient user={session.user}>
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
        <OnboardingModal open={!completed} />
      </LoggedInLayoutClient>
    </SidebarProvider>
  )
}
