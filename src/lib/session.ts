import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Redirects to /sign-in if there's no session. Route handlers and
 * src/db/queries/ functions call this (or pass the resulting session/user
 * id straight through) to get the id they scope their query by — this file
 * establishes *who's asking*, it doesn't decide what they're allowed to see.
 */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session.user;
}

/**
 * This template has no organization/team table yet — every user is their
 * own tenant, so tenantId is just the user id. Once a real tenant table
 * exists, update this function (and only this function) to resolve the
 * caller's actual tenant instead of assuming user === tenant; callers that
 * already use requireTenant() won't need to change.
 */
export async function requireTenant() {
  const user = await requireUser();
  return { user, tenantId: user.id };
}
