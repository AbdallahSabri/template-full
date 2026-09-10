import { requireUser } from "@/lib/session";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name.split(" ")[0];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
      <div>
        <h2 className="text-foreground text-2xl font-semibold tracking-tight">
          Welcome back, {firstName}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">{user.email}</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>This is the dashboard shell</CardTitle>
          <CardDescription>
            Add a page under{" "}
            <code className="bg-muted rounded px-1 py-0.5 text-xs">
              src/app/(app)/
            </code>{" "}
            and register it in{" "}
            <code className="bg-muted rounded px-1 py-0.5 text-xs">
              sidebar-nav.tsx
            </code>{" "}
            to add it to the sidebar.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
