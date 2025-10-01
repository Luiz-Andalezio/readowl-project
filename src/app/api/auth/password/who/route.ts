import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

// GET /api/auth/password/who?token=...
// Returns { email, name } when token is valid and not expired/consumed.
// Otherwise 404 to avoid leaking anything useful.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  if (!token || token.length < 10) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const hashHex = crypto.createHash("sha256").update(token).digest("hex");
  const rec = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashHex } });
  if (!rec || rec.consumedAt || rec.expires < new Date()) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const user = await prisma.user.findUnique({ where: { id: rec.userId }, select: { email: true, name: true } });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ email: user.email, name: user.name ?? null });
}
