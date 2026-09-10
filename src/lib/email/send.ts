import "server-only";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { env } from "@/lib/env";

type ResendClient = { client: Resend; from: string };

let cached: ResendClient | null | undefined;

function getResendClient(): ResendClient | null {
  if (cached !== undefined) return cached;
  cached =
    env.RESEND_API_KEY && env.EMAIL_FROM
      ? { client: new Resend(env.RESEND_API_KEY), from: env.EMAIL_FROM }
      : null;
  return cached;
}

// Interface point for outbound email. Feature-detected on RESEND_API_KEY +
// EMAIL_FROM together — logs to console instead of sending when either is
// unset, and never throws (a delivery failure shouldn't break the sign-up
// or password-reset flow that triggered it; it's logged instead). Callers
// pass `react` for a templated HTML email — Resend renders it internally
// via its @react-email/render peer dependency — and `text` as the
// plain-text fallback used both for the console log and Resend's
// text-alternative body.
export async function sendEmail({
  to,
  subject,
  text,
  react,
}: {
  to: string;
  subject: string;
  text: string;
  react?: ReactElement;
}): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.log(`[email] to=${to} subject=${JSON.stringify(subject)}\n${text}`);
    return;
  }

  const { error } = await resend.client.emails.send({
    from: resend.from,
    to,
    subject,
    text,
    react,
  });

  if (error) {
    console.error(`[email] Resend delivery to=${to} failed:`, error);
  }
}
