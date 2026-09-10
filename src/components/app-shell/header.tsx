"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavList } from "./nav-list";
import { PalettePicker } from "./palette-picker";
import { navItems } from "./sidebar-nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import type { CurrentUser } from "./app-shell";

export function Header({
  user,
  mobileNavOpen,
  onMobileNavOpenChange,
}: {
  user: CurrentUser;
  mobileNavOpen: boolean;
  onMobileNavOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const activeItem = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <header className="border-border bg-background sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-4 md:h-16 md:gap-4 md:px-6">
      <Sheet open={mobileNavOpen} onOpenChange={onMobileNavOpenChange}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation"
            />
          }
        >
          <Menu className="size-5" aria-hidden="true" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-border border-b">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription className="sr-only">
              Jump to a section of the dashboard.
            </SheetDescription>
          </SheetHeader>
          <nav aria-label="Primary" className="flex flex-col gap-1 p-3">
            <NavList onNavigate={() => onMobileNavOpenChange(false)} />
          </nav>
        </SheetContent>
      </Sheet>

      <h1 className="text-foreground min-w-0 flex-1 truncate text-base font-semibold tracking-tight md:text-lg">
        {activeItem?.title ?? "Dashboard"}
      </h1>

      <div className="flex shrink-0 items-center gap-1.5">
        <PalettePicker />
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
