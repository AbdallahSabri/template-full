import { sendEmail } from "@/lib/email/send";

export type WelcomePayload = { userId: string; email: string; name: string };

// The one example queue side-effect: a welcome email after sign-up. Kept
// as its own named export (not an inline closure at the publish() call
// site) so consumer.ts's dispatch table and auth.tsx's publish() call can
// both reference the same function — see CLAUDE.md in this directory.
export async function sendWelcomeEmail(payload: WelcomePayload): Promise<void> {
  await sendEmail({
    to: payload.email,
    subject: "Welcome!",
    text: `Welcome, ${payload.name}! Thanks for signing up.`,
  });
}
