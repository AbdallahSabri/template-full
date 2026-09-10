import { sendWelcomeEmail } from "@/lib/queue/handlers/welcome";

// The consumer's dispatch table: every topic a publish() call site can
// target must have a matching entry here, with a matching payload shape
// — see CLAUDE.md in this directory.
export const queueHandlers = {
  welcome: sendWelcomeEmail,
};
