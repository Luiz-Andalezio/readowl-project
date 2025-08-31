import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import TopBarUserClient from "./TopBarUserClient";
import Link from "next/link";

export default async function TopBar() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <header className="w-full bg-readowl-purple-medium border-b border-readowl-purple-light/30 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <Link href="/" className="text-lg font-bold text-readowl-purple-extralight">Readowl</Link>
          <div className="flex gap-3 text-sm">
            <Link href="/login" className="text-readowl-purple-extralight hover:text-white transition">Login</Link>
            <Link href="/register" className="text-readowl-purple-extralight hover:text-white transition">Registrar</Link>
          </div>
        </div>
      </header>
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
    <header className="w-full bg-readowl-purple-medium/90 backdrop-blur border-b border-readowl-purple-light/30 shadow-sm sticky top-0 z-40">
      <div className="relative max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-2.5">
        <Link href="/home" className="text-lg font-bold tracking-wide text-readowl-purple-extralight hover:text-white transition">
          Readowl
        </Link>
        <TopBarUserClient
          user={{
            ...user,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          }}
        />
      </div>
    </header>
  );
}
