import { EmailShell, styles } from "@/lib/email/templates/shared";

export function VerifyEmailTemplate({ url }: { url: string }) {
  return (
    <EmailShell>
      <p style={styles.heading}>Verify your email</p>
      <p style={styles.text}>
        Click the button below to verify your email address and finish setting
        up your account.
      </p>
      <a href={url} style={styles.button}>
        Verify email
      </a>
      <p style={styles.footer}>
        If you didn&apos;t create an account, you can safely ignore this email.
      </p>
    </EmailShell>
  );
}
