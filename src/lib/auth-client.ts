"use client";

import { createAuthClient } from "better-auth/react";

// No baseURL: the app and its /api/auth routes are always same-origin, so
// requests default to the current origin. This file must never import
// src/lib/env.ts — that module reads server-only vars (DATABASE_URL,
// BETTER_AUTH_SECRET) via a full process.env parse, which doesn't work in
// a client bundle.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
