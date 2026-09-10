"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { navItems } from "./sidebar-nav";

export function NavList({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        const linkClassName = cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors",
          "focus-visible:ring-3 focus-visible:ring-ring/50",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        );

        if (collapsed) {
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger
                render={
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={linkClassName}
                  />
                }
              >
                <item.icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="sr-only">{item.title}</span>
              </TooltipTrigger>
              <TooltipContent side="right">{item.title}</TooltipContent>
            </Tooltip>
          );
        }

        return (
          <Fragment key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={linkClassName}
            >
              <item.icon className="size-4 shrink-0" aria-hidden="true" />
              <span>{item.title}</span>
            </Link>
          </Fragment>
        );
      })}
    </div>
  );
}
