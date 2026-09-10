"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const errorCode = searchParams.get("error");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function resend() {
    if (!email) return;
    setLoading(true);
    await authClient.sendVerificationEmail({
      email,
      callbackURL: "/dashboard",
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          {email
            ? `We sent a verification link to ${email}.`
            : "We sent you a verification link."}{" "}
          Click it to activate your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {errorCode && (
          <Alert variant="destructive">
            <AlertDescription>
              That link didn&apos;t work ({errorCode}). Request a new one below.
            </AlertDescription>
          </Alert>
        )}
        {sent && (
          <Alert>
            <AlertDescription>Verification email resent.</AlertDescription>
          </Alert>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={!email || loading}
          onClick={resend}
        >
          {loading ? "Sending…" : "Resend email"}
        </Button>
      </CardContent>
    </Card>
  );
}
