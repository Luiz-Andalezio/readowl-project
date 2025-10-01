import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";

import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }
  const token = (await getToken({ req, secret: process.env.NEXTAUTH_SECRET })) as (JWT & {
    remember?: boolean;
    stepUpAt?: number;
    credentialVersion?: number;
    role?: string;
  }) | null;
  if (!token) return NextResponse.json({ error: "No token" }, { status: 401 });
  return NextResponse.json({
    sub: token.sub,
    role: token.role,
    remember: token.remember ?? null,
    stepUpAt: token.stepUpAt ?? null,
    credentialVersion: token.credentialVersion ?? null,
  });
}
