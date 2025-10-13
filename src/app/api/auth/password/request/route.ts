import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendMail } from '@/lib/mailer';
import { checkRateLimit, buildRateLimitHeaders } from '@/lib/rateLimit';
import { rateLimit as rateLimitRedis, rateLimitHeaders as rateLimitHeadersRedis } from '@/lib/rateLimitRedis';
import { passwordResetTemplate } from '@/lib/emailTemplates';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  const dev = process.env.NODE_ENV !== 'production';
  // IP rate limit: 5 requests / 15min
  let headers: Headers;
  let allowed = true;
  try {
    const rlRedis = await rateLimitRedis(req, 'pwd-reset', 15 * 60, 5);
    headers = rateLimitHeadersRedis(rlRedis);
    allowed = rlRedis.allowed;
  } catch {
    const rl = checkRateLimit(req, { windowSec: 15 * 60, limit: 5, key: 'pwd-reset' });
    headers = buildRateLimitHeaders(rl);
    allowed = rl.allowed;
  }
  if (!allowed) {
    if (dev) console.info('[PWD-RESET] blocked by IP rate limit');
    return new NextResponse(JSON.stringify({ ok: true }), { status: 200, headers });
  }

  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (!email || !isValidEmail(email)) {
    if (dev) console.info('[PWD-RESET] invalid or missing email payload');
    return new NextResponse(JSON.stringify({ ok: true }), { status: 200, headers });
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true } });
  if (!user) {
    if (dev) console.info('[PWD-RESET] user not found (privacy mode response)');
    return new NextResponse(JSON.stringify({ ok: true }), { status: 200, headers });
  }

  // Per-user cooldown
  const recent = await prisma.passwordResetToken.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  const cooldownMs = dev ? 5_000 : 120_000;
  if (recent && Date.now() - recent.createdAt.getTime() < cooldownMs) {
    if (dev) console.info('[PWD-RESET] cooldown active, skipping re-send');
    return new NextResponse(JSON.stringify({ ok: true }), { status: 200, headers });
  }

  // Create token
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 30);
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hash, expires } });

  // Build reset URL
  let baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) {
    try {
      const u = new URL(req.url);
      baseUrl = `${u.protocol}//${u.host}`;
    } catch {
      baseUrl = 'http://localhost:3000';
    }
  }
  const url = `${baseUrl}/reset-password?token=${token}`;

  const html = passwordResetTemplate({ userName: user.name, actionUrl: url, expiresMinutes: 30 });
  const text = `Olá${user.name ? `, ${user.name}` : ''}!
Recebemos uma solicitação para redefinir sua senha no Readowl.
Abra o link abaixo para criar uma nova senha (expira em 30 minutos):

${url}

Se você não fez esta solicitação, ignore este email.`;

  if (dev) console.info(`[PWD-RESET] sending email to ${user.email} with link ${url}`);
  try {
    await sendMail({
      to: user.email,
      subject: 'Readowl – Redefinição de senha',
      html,
      text,
      headers: { 'X-Readowl-Category': 'password-reset' },
      attachments: [
        { filename: 'logo.png', path: process.cwd() + '/public/img/mascot/logo-white-line.png', cid: 'readowl-logo' },
      ],
    });
    if (dev) console.info('[PWD-RESET] sendMail success');
  } catch (e) {
    if (dev) console.error('[PWD-RESET] sendMail failed (see above mailer log)', e);
  }

  return new NextResponse(JSON.stringify({ ok: true }), { status: 200, headers });
}
