import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { randomUUID } from "crypto";

// Helpers and Zod schema for incoming banners
function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const urlOrPath = z
  .string()
  .trim()
  .min(1, "URL obrigatória")
  .max(1000)
  .refine((v) => isHttpUrl(v) || v.startsWith("/"), "Use uma URL http(s) ou um caminho relativo começando com /");

const BannerSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(200),
  imageUrl: urlOrPath,
  linkUrl: urlOrPath,
});

const BannerArraySchema = z
  .array(BannerSchema)
  .max(50, "Limite de 50 banners");

async function ensureBannerTable() {
  // Create table if not exists using raw SQL to avoid schema drift issues
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "Banner" (
      "id" TEXT PRIMARY KEY,
      "name" VARCHAR(200) NOT NULL,
      "imageUrl" VARCHAR(1000) NOT NULL,
      "linkUrl" VARCHAR(1000) NOT NULL,
      "position" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`
  );
}

export async function GET() {
  try {
    try {
      const rows = await prisma.banner.findMany({
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true, imageUrl: true, linkUrl: true, position: true },
      });
      return NextResponse.json(rows, { headers: { "Cache-Control": "no-store" } });
    } catch {
      await ensureBannerTable();
      return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
    }
  } catch (e) {
    console.error("GET /api/banners error", e);
    return NextResponse.json({ error: "Erro interno ao buscar banners" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const json = await req.json();
    const parsed = BannerArraySchema.safeParse(json);
    if (!parsed.success) {
      const { formErrors, fieldErrors } = parsed.error.flatten();
      // Provide a concise message plus details for clients that want to inspect
      return NextResponse.json(
        { error: { message: "Entrada inválida", formErrors, fieldErrors, issues: parsed.error.issues } },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // Ensure table exists before writing
    await ensureBannerTable();

    // Replace the entire set to respect order
    await prisma.$transaction(async (tx) => {
      await tx.banner.deleteMany();
      if (input.length > 0) {
        await tx.banner.createMany({
          data: input.map((b, i) => ({
            id: randomUUID(),
            name: b.name,
            imageUrl: b.imageUrl,
            linkUrl: b.linkUrl,
            position: i,
          })),
        });
      }
    });

    return NextResponse.json({ ok: true, count: input.length });
  } catch (e) {
    console.error("PUT /api/banners error", e);
    return NextResponse.json({ error: "Erro interno ao salvar banners" }, { status: 500 });
  }
}
