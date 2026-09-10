import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { authAdapter } from "@/db/queries/auth-adapter";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import { VerifyEmailTemplate } from "@/lib/email/templates/verify-email";
import { ResetPasswordTemplate } from "@/lib/email/templates/reset-password";

export const auth = betterAuth({
  database: authAdapter,
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Reset your password: ${url}`,
        react: <ResetPasswordTemplate url={url} />,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        text: `Verify your email: ${url}`,
        react: <VerifyEmailTemplate url={url} />,
      });
    },
  },
  // Google is only registered when both env vars are set — features
  // detected here, at config-build time, so nothing downstream ever
  // branches on whether OAuth is configured (see CLAUDE.md convention #4).
  socialProviders:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined,
  // nextCookies() must be the last plugin — it relies on hooks from
  // plugins registered before it to have already run.
  plugins: [nextCookies()],
});
