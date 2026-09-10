import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/redis/rate-limit";

const { GET, POST: authPost } = toNextJsHandler(auth.handler);

export { GET };

// Better Auth's catch-all handles every /api/auth/* path through one
// handler — gating just sign-in/sign-up means inspecting the path here
// and delegating everything else straight through, rather than touching
// Better Auth internals. See src/lib/redis/CLAUDE.md for the rate-limit
// fallback behavior.
const RATE_LIMITED_SUFFIXES = ["/sign-in/email", "/sign-up/email"];
const LIMIT = 10;
const WINDOW_SECONDS = 60;

function clientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: Request) {
  const pathname = new URL(request.url).pathname;

  if (RATE_LIMITED_SUFFIXES.some((suffix) => pathname.endsWith(suffix))) {
    const result = await rateLimit(`${pathname}:${clientIp(request)}`, {
      limit: LIMIT,
      windowSeconds: WINDOW_SECONDS,
    });

    if (!result.allowed) {
      return Response.json(
        { error: "Too many requests. Try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(result.retryAfterSeconds) },
        },
      );
    }
  }

  return authPost(request);
}
