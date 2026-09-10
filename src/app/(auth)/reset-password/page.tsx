"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorCode = searchParams.get("error");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{token ? "Set a new password" : "Reset password"}</CardTitle>
        <CardDescription>
          {token
            ? "Choose a new password for your account."
            : "Enter your email and we'll send you a reset link."}
        </CardDescription>
      </CardHeader>
      {errorCode && (
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              That link is invalid or expired. Request a new one below.
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
      {token ? <ConfirmForm token={token} /> : <RequestForm />}
    </Card>
  );
}

function RequestForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    await authClient.requestPasswordReset(
      { email, redirectTo: "/reset-password" },
      {
        onSuccess: () => {
          setSent(true);
          setLoading(false);
        },
        onError: (ctx) => {
          setError(ctx.error.message);
          setLoading(false);
        },
      },
    );
  }

  if (sent) {
    return (
      <CardContent>
        <Alert>
          <AlertDescription>
            If an account exists for {email}, a reset link is on its way.
          </AlertDescription>
        </Alert>
      </CardContent>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t-0 bg-transparent pt-2">
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          <Link href="/sign-in" className="text-foreground font-medium">
            Back to sign in
          </Link>
        </p>
      </CardFooter>
    </form>
  );
}

function ConfirmForm({ token }: { token: string }) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    await authClient.resetPassword(
      { newPassword, token },
      {
        onSuccess: () => {
          router.push("/sign-in");
        },
        onError: (ctx) => {
          setError(ctx.error.message);
          setLoading(false);
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="border-t-0 bg-transparent pt-2">
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Save new password"}
        </Button>
      </CardFooter>
    </form>
  );
}
