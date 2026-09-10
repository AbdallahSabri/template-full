// Interface point for outbound email. Right now this only logs — Resend
// wiring lands in M5 (see SPEC.md), and when it does, callers here don't
// change: they still call sendEmail(), they just start seeing it deliver
// instead of log. Never branch on RESEND_API_KEY at the call site.
export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  console.log(`[email] to=${to} subject=${JSON.stringify(subject)}\n${text}`);
}
