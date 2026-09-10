import { requireUser } from "@/lib/session";

// Minimal placeholder shell — M3 replaces this with the real AppShell
// (header + collapsible sidebar). For now this just enforces the session
// server-side (middleware only checked the cookie was present) and gets
// out of the way.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireUser();
  return <div className="flex flex-1 flex-col">{children}</div>;
}
