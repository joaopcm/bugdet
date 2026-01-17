"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Kbd, SHORTCUTS_VALUES } from "../ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger className="-ml-1 lg:-ml-4" />
          </TooltipTrigger>
          <TooltipContent>
            Or press <Kbd variant="outline">{SHORTCUTS_VALUES.CMD} + B</Kbd> to
            toggle the sidebar
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
