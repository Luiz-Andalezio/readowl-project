import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

const BannerSchema = z.object({
  name: z.string().min(1).max(150),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().or(z.literal('').transform(() => '')),
  order: z.number().int().min(0),
});

const PayloadSchema = z.object({
  banners: z.array(BannerSchema).max(50),
});

type BannerRow = { name: string; imageUrl: string; linkUrl: string; order: number };

async function ensureBannerTable() {
  // Create table if it does not exist (minimal schema compatible with our queries)
  const sql = `
    CREATE TABLE IF NOT EXISTS "Banner" (
      "name"     text NOT NULL,
      "imageUrl" text NOT NULL,
      "linkUrl"  text NOT NULL,
      "order"    integer NOT NULL
    );
  `;
  await prisma.$executeRawUnsafe(sql);
}


export async function GET() {
  try {
    await ensureBannerTable();
    const rows = await prisma.$queryRaw<BannerRow[]>`SELECT "name", "imageUrl", "linkUrl", "order" FROM "Banner" ORDER BY "order" ASC`;
    return NextResponse.json({ banners: rows });
  } catch {
    // If table is missing (no migration yet), return empty set to avoid breaking home page
    return NextResponse.json({ banners: [] });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }
  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { banners } = parsed.data;
  try {
    await ensureBannerTable();
    await prisma.$executeRaw`DELETE FROM "Banner"`;

    for (const b of banners) {
      const now = new Date();
      const id = crypto.randomUUID();
      try {
        // Try full insert including id/createdAt/updatedAt (works when NOT NULL without defaults)
        await prisma.$executeRaw(Prisma.sql`
          INSERT INTO "Banner" ("id", "name", "imageUrl", "linkUrl", "order", "createdAt", "updatedAt")
          VALUES (${id}, ${b.name.trim()}, ${b.imageUrl.trim()}, ${b.linkUrl.trim()}, ${b.order}, ${now}, ${now})
        `);
      } catch (err) {
        // If columns don't exist (older/minimal schema), fallback to minimal insert
        // Undefined column error code in Postgres is 42703
        const msg = err instanceof Error ? err.message : String(err);
        if (/42703/.test(msg) || /column .* does not exist/i.test(msg)) {
          await prisma.$executeRaw(Prisma.sql`
            INSERT INTO "Banner" ("name", "imageUrl", "linkUrl", "order")
            VALUES (${b.name.trim()}, ${b.imageUrl.trim()}, ${b.linkUrl.trim()}, ${b.order})
          `);
        } else {
          throw err;
        }
      }
    }
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to save banners', detail: msg }, { status: 500 });
  }
}
