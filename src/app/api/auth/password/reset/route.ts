import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { hash } from "bcrypt";

export async function POST(req: Request) {
  const { token, password } = (await req.json().catch(() => ({}))) as { token?: string; password?: string };
  if (!token || typeof token !== "string") return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  if (!password || typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "Senha inválida (mín. 6)" }, { status: 400 });
  }

  const hashHex = crypto.createHash("sha256").update(token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashHex } });
  if (!record || record.consumedAt || record.expires < new Date()) {
    return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 });
  }

  const newHash = await hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { password: newHash, credentialVersion: { increment: 1 } } }),
    prisma.passwordResetToken.update({ where: { tokenHash: hashHex }, data: { consumedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: record.userId } }), // force logout elsewhere
  ]);

  return NextResponse.json({ ok: true });
}
