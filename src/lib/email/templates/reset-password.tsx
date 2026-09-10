import { EmailShell, styles } from "@/lib/email/templates/shared";

export function ResetPasswordTemplate({ url }: { url: string }) {
  return (
    <EmailShell>
      <p style={styles.heading}>Reset your password</p>
      <p style={styles.text}>
        Click the button below to choose a new password. This link expires soon,
        so use it promptly.
      </p>
      <a href={url} style={styles.button}>
        Reset password
      </a>
      <p style={styles.footer}>
        If you didn&apos;t request this, you can safely ignore this email — your
        password won&apos;t change.
      </p>
    </EmailShell>
  );
}
