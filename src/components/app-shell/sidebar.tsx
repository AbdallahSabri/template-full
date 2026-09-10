"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { NavList } from "./nav-list";

export const SIDEBAR_WIDTH = "w-60";
export const SIDEBAR_WIDTH_COLLAPSED = "w-[4.5rem]";

export function Sidebar({
  collapsed,
  onCollapsedChange,
}: {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}) {
  return (
    <aside
      className={cn(
        "border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-30 hidden flex-col border-r transition-[width] duration-200 ease-in-out md:flex",
        collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH,
      )}
    >
      <div
        className={cn(
          "border-sidebar-border flex h-14 shrink-0 items-center border-b px-3 md:h-16",
          collapsed ? "justify-center" : "justify-end",
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onCollapsedChange(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="size-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-3">
        <NavList collapsed={collapsed} />
      </nav>
    </aside>
  );
}
