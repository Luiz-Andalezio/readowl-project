import { NextAuthOptions, User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcrypt";
import prisma from "@/lib/prisma";
import type { JWT } from "next-auth/jwt";
import { AppRole } from "@/types/user";

const missingGoogle = !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET;
if (missingGoogle) {
  console.warn("[Auth] GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET ausente. Login Google desativado.");
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(missingGoogle
      ? []
      : [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.password) return null;
        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;
        return user;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      const t = token as JWT & { role?: AppRole; authProvider?: string; stepUpAt?: number };
      if (session.user && token.sub && t.role) {
        session.user.id = token.sub;
        session.user.role = t.role;
      }
      // Expose step-up info and provider to client session
      (session as { authProvider?: string; stepUpAt?: number }).authProvider = t.authProvider;
      (session as { authProvider?: string; stepUpAt?: number }).stepUpAt = t.stepUpAt;
      return session;
    },
    async jwt({ token, user, account }) {
      // Persist role on token after initial login
      if (user && (user as NextAuthUser & { role: AppRole }).role) {
        (token as JWT & { role?: AppRole }).role = (user as NextAuthUser & { role: AppRole }).role;
      }
      // When a sign-in occurs (including reauthentication), mark provider and step-up timestamp
      if (account && account.provider) {
        (token as JWT & { authProvider?: string; stepUpAt?: number }).authProvider = account.provider;
        (token as JWT & { authProvider?: string; stepUpAt?: number }).stepUpAt = Date.now();
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
};
