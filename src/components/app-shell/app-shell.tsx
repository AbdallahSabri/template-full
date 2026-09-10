"use client";

import * as React from "react";
import { cn } from "cn";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export type CurrentUser = {
  name: string;
  email: string;
  image?: string | null;
};

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <TooltipProvider delay={200}>
      <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      {/* Padding-left mirrors the fixed sidebar's width (see SIDEBAR_WIDTH /
          SIDEBAR_WIDTH_COLLAPSED in sidebar.tsx) so content never sits under
          or away from it — keep these two in sync if either changes. */}
      <div
        className={cn(
          "flex min-h-full flex-1 flex-col transition-[padding-left] duration-200 ease-in-out",
          collapsed ? "md:pl-[4.5rem]" : "md:pl-60",
        )}
      >
        <Header
          user={user}
          mobileNavOpen={mobileNavOpen}
          onMobileNavOpenChange={setMobileNavOpen}
        />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </TooltipProvider>
  );
}
