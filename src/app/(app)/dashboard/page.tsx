import { requireUser } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {user.name}
        </h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>
      <SignOutButton />
    </div>
  );
}
