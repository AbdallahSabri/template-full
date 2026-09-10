import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/db/queries/health";

// Target for Uptime Kuma (or any HTTP uptime monitor). Checks the one
// hard dependency — Postgres — not the optional services, since the app
// is defined to run correctly without those (see CLAUDE.md).
export async function GET() {
  try {
    await checkDatabaseConnection();
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[health] database check failed:", error);
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
