'use client'

import { NavMain } from '@/components/logged-in/nav-main'
import { NavUser } from '@/components/logged-in/nav-user'
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
  IconList,
  IconUpload,
} from '@tabler/icons-react'
import type { User } from 'better-auth'
import Image from 'next/image'
import Link from 'next/link'
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
    title: 'Uploads',
    url: '/uploads',
    icon: IconUpload,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
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
        <NavMain items={routes} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
