// Plain JSX + inline styles, not @react-email/components — that package
// was deprecated in favor of a unified `react-email` package with a known
// bundle-bloat issue (top-level imports pull prismjs/marked/tailwindcss
// into the server bundle). @react-email/render alone (Resend's actual
// peer dependency) is all two simple transactional emails need.
export const styles = {
  body: {
    margin: 0,
    padding: "32px 16px",
    backgroundColor: "#f4f4f5",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  container: {
    maxWidth: "420px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "32px",
    border: "1px solid #e4e4e7",
  },
  heading: {
    margin: "0 0 12px",
    fontSize: "18px",
    fontWeight: 600,
    color: "#18181b",
  },
  text: {
    margin: "0 0 20px",
    fontSize: "14px",
    lineHeight: "22px",
    color: "#52525b",
  },
  button: {
    display: "inline-block",
    padding: "10px 20px",
    borderRadius: "6px",
    backgroundColor: "#18181b",
    color: "#fafafa",
    fontSize: "14px",
    fontWeight: 500,
    textDecoration: "none",
  },
  footer: {
    margin: "24px 0 0",
    fontSize: "12px",
    lineHeight: "18px",
    color: "#a1a1aa",
  },
} as const;

export function EmailShell({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body style={styles.body}>
        <div style={styles.container}>{children}</div>
      </body>
    </html>
  );
}
