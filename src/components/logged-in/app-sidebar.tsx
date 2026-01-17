"use client";

import {
  IconCategory,
  IconDashboard,
  IconFilter,
  IconList,
  IconPigMoney,
  IconUpload,
} from "@tabler/icons-react";
import type { User } from "better-auth";
import Image from "next/image";
import Link from "next/link";
import type * as React from "react";
import { useCallback, useRef } from "react";
import { NavMain } from "@/components/logged-in/nav-main";
import { NavUser } from "@/components/logged-in/nav-user";
import { UploadReminderAlert } from "@/components/logged-in/upload-reminder-alert";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const routes = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: IconList,
  },
  {
    title: "Categories",
    url: "/categories",
    icon: IconCategory,
  },
  {
    title: "Budgets",
    url: "/budgets",
    icon: IconPigMoney,
  },
  {
    title: "Rules",
    url: "/categorization-rules",
    icon: IconFilter,
  },
  {
    title: "Uploads",
    url: "/uploads",
    icon: IconUpload,
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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
                  alt="Bugdet.co"
                  height={40}
                  priority
                  src="/images/android-chrome-192x192.png"
                  width={40}
                />
                <span className="font-semibold text-base">Bugdet.co</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain fileInputRef={fileInputRef} items={routes} />
      </SidebarContent>
      <SidebarFooter className="gap-2">
        <UploadReminderAlert onUploadClick={handleUploadClick} />
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
