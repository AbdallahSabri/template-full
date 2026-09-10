import { requireUser } from "@/lib/session";
import { AppShell } from "@/components/app-shell/app-shell";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <AppShell
      user={{ name: user.name, email: user.email, image: user.image ?? null }}
    >
      {children}
    </AppShell>
  );
}
