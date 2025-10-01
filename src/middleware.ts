import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import prisma from "@/lib/prisma";

// Protect app pages under these prefixes
const PROTECTED_PREFIXES = [
  "/home",
  "/library",
  "/notifications",
  "/search",
  "/user",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected) return NextResponse.next();

  const token = (await getToken({ req, secret: process.env.NEXTAUTH_SECRET })) as (JWT & {
    remember?: boolean;
    stepUpAt?: number;
    sub?: string;
    credentialVersion?: number;
  }) | null;
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const cookieRemember = req.cookies.get("rw_rem")?.value;
  const remember = cookieRemember ? cookieRemember === "yes" : token.remember === true;
  const stepUpAt = token.stepUpAt; // epoch ms when auth occurred
  const now = Date.now();

  // Idle timeout policy
  const maxIdle = remember ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 8; // 30d vs 8h
  if (stepUpAt && now - stepUpAt > maxIdle) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Enforce credentialVersion: reject tokens older than the user's current credential version
  if (token.sub) {
    try {
      const db = await prisma.user.findUnique({ where: { id: token.sub }, select: { credentialVersion: true } });
      if (db && (token.credentialVersion ?? 0) < (db.credentialVersion ?? 0)) {
        const url = new URL("/login", req.url);
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
      }
    } catch {}
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/library/:path*",
    "/notifications/:path*",
    "/search/:path*",
    "/user/:path*",
  ],
};
