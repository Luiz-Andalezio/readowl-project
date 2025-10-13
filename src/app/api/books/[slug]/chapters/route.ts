import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slug';
import { getPlainTextLength } from '@/lib/sanitize';

async function findBookBySlug(slug: string) {
	const all = await prisma.book.findMany();
	return all.find((b) => slugify(b.title) === slug) || null;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
	const { slug } = await ctx.params;
	const book = await findBookBySlug(slug);
	if (!book) return NextResponse.json({ error: 'Livro não encontrado' }, { status: 404 });
	const chapters = await prisma.chapter.findMany({ where: { bookId: book.id }, orderBy: [{ title: 'asc' }] });
	return NextResponse.json({ chapters });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
	const { slug } = await ctx.params;
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
	const book = await findBookBySlug(slug);
	if (!book) return NextResponse.json({ error: 'Livro não encontrado' }, { status: 404 });
	const isOwner = session.user.id === book.authorId;
	const isAdmin = session.user.role === 'ADMIN';
	if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

	const body = await req.json().catch(() => null) as { title?: string; content?: string; volumeId?: string | null } | null;
	const title = (body?.title || '').trim();
		const content = (body?.content || '').toString();
	const volumeId = body?.volumeId ?? null;
	if (!title) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 });
		if (getPlainTextLength(content) === 0) return NextResponse.json({ error: 'Conteúdo obrigatório' }, { status: 400 });
	// ensure volume belongs to the same book if provided
	if (volumeId) {
		const vol = await prisma.volume.findUnique({ where: { id: volumeId } });
		if (!vol || vol.bookId !== book.id) return NextResponse.json({ error: 'Volume inválido' }, { status: 400 });
	}
		// Prevent duplicate URL slug within the same book
		const newSlug = slugify(title);
		const existingTitles = await prisma.chapter.findMany({ where: { bookId: book.id }, select: { id: true, title: true } });
		const conflict = existingTitles.some((c) => slugify(c.title) === newSlug);
		if (conflict) return NextResponse.json({ error: 'O título informado gera uma URL já existente para esta obra.' }, { status: 409 });
	const chapter = await prisma.chapter.create({ data: { title, content, bookId: book.id, volumeId: volumeId || null } });
	return NextResponse.json({ chapter }, { status: 201 });
}

