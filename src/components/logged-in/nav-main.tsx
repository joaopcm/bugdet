'use client'

import { Button } from '@/components/ui/button'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { Icon } from '@tabler/icons-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavMainProps {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <Button className="flex-1">Import Bank Statement</Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu className="mt-2">
          {items.map((item) => (
            <Link href={item.url} key={item.title} prefetch>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={item.title}
                  data-active={pathname === item.url}
                  className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Link>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
