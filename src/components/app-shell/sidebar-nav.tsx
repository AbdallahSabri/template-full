import { LayoutDashboard, type LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

// The sidebar, the mobile drawer, and the header's page title all read
// from this array. Adding a page to the dashboard means adding one entry
// here — no markup changes anywhere else.
export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];
