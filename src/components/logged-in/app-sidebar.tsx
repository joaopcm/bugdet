'use client'

import { NavMain } from '@/components/logged-in/nav-main'
import { NavUser } from '@/components/logged-in/nav-user'
import { UploadReminderAlert } from '@/components/logged-in/upload-reminder-alert'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  IconCategory,
  IconDashboard,
  IconFilter,
  IconList,
  IconUpload,
} from '@tabler/icons-react'
import type { User } from 'better-auth'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useRef } from 'react'
import type * as React from 'react'

const routes = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: IconDashboard,
  },
  {
    title: 'Transactions',
    url: '/transactions',
    icon: IconList,
  },
  {
    title: 'Categories',
    url: '/categories',
    icon: IconCategory,
  },
  {
    title: 'Rules',
    url: '/categorization-rules',
    icon: IconFilter,
  },
  {
    title: 'Uploads',
    url: '/uploads',
    icon: IconUpload,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <Image
                  src="/images/android-chrome-192x192.png"
                  alt="Bugdet.co"
                  width={40}
                  height={40}
                  priority
                />
                <span className="text-base font-semibold">Bugdet.co</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={routes} fileInputRef={fileInputRef} />
      </SidebarContent>
      <SidebarFooter className="gap-2">
        <UploadReminderAlert onUploadClick={handleUploadClick} />
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
