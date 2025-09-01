import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import Link from "next/link";
import FloatingUserDev from "./FloatingUserDev";

// TopBar minimalista: converte a barra em um pequeno botão/flutuante estilizado (dev mood)
export default async function TopBar() {
	const session = await getServerSession(authOptions);

	if (!session?.user?.email) {
		return (
			<div className="fixed top-4 right-4 z-40 flex gap-3">
				<Link href="/login" className="px-3 py-2 rounded-lg bg-readowl-purple-medium/70 backdrop-blur border border-readowl-purple-light/30 text-xs font-medium text-readowl-purple-extralight hover:bg-readowl-purple-medium hover:text-white transition shadow-sm">Login</Link>
				<Link href="/register" className="px-3 py-2 rounded-lg bg-readowl-purple-medium/70 backdrop-blur border border-readowl-purple-light/30 text-xs font-medium text-readowl-purple-extralight hover:bg-readowl-purple-medium hover:text-white transition shadow-sm">Registrar</Link>
			</div>
		);
	}

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			image: true,
			description: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	if (!user) return null;

	return (
		<FloatingUserDev
			user={{
				...user,
				createdAt: user.createdAt.toISOString(),
				updatedAt: user.updatedAt.toISOString(),
			}}
		/>
	);
}