import type { NextAuthOptions, Session, User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { compare } from "bcrypt";
import type { JWT } from "next-auth/jwt";
import { AppRole } from "@/types/user";

const missingGoogle = !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET;
if (missingGoogle) {
	console.warn("[Auth] GOOGLE_CLIENT_ID/SECRET ausentes. Login Google desativado.");
}

export const authOptions: NextAuthOptions = {
	adapter: PrismaAdapter(prisma),
	debug: process.env.NEXTAUTH_DEBUG === 'true',
	providers: [
		...(missingGoogle
			? []
			: [
					GoogleProvider({
						clientId: process.env.GOOGLE_CLIENT_ID as string,
						clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
						authorization: {
							params: { prompt: "consent", access_type: "offline", response_type: "code" },
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
				const ok = await compare(credentials.password, user.password);
				if (!ok) return null;
				// Attach remember preference for JWT callback to consume
				const remember = (credentials as Record<string, unknown>).remember === "true";
				return { ...user, remember } as unknown as NextAuthUser;
			},
		}),
	],
	session: {
		strategy: "jwt",
		// Keep the JWT cookie for up to 30 days; we'll enforce shorter TTL via middleware when remember=false
		maxAge: 60 * 60 * 24 * 30,
		updateAge: 60 * 30,
	},
		// Removed cookie settings as they are unsupported
		// cookie: {
		// 	secure: process.env.NODE_ENV !== "development",
		// 	sameSite: "lax",
		// 	path: "/",
		// },
	callbacks: {
		async signIn({ user, account, profile }) {
			// Proactively link Google account to existing user with same email to avoid OAuthAccountNotLinked.
			if (account?.provider === 'google') {
				const p = profile as Record<string, unknown> | null | undefined;
				const email = (p?.['email'] as string | undefined) || (user?.email as string | undefined);
				const emailVerified = (p?.['email_verified'] as boolean | undefined) === undefined ? true : !!p?.['email_verified'];
				if (email && emailVerified) {
					try {
						const existing = await prisma.user.findUnique({ where: { email } });
						if (existing) {
							// If no Account is linked yet for this providerAccountId, create it pointing to the existing user
							const providerAccountId = account.providerAccountId as string | undefined;
							if (providerAccountId) {
								const already = await prisma.account.findUnique({
									where: { provider_providerAccountId: { provider: account.provider, providerAccountId } },
								});
								if (!already) {
									// lightweight audit log (console + db table later)
									console.info('[Auth][Link]', {
										provider: account.provider,
										providerAccountId,
										userId: existing.id,
										email,
										ts: new Date().toISOString(),
									});
									await prisma.account.create({
										data: {
											userId: existing.id,
											type: account.type as string,
											provider: account.provider,
											providerAccountId,
											refresh_token: (account as Record<string, unknown>)['refresh_token'] as string | null | undefined,
											access_token: (account as Record<string, unknown>)['access_token'] as string | null | undefined,
											expires_at: (account as Record<string, unknown>)['expires_at'] as number | null | undefined,
											token_type: (account as Record<string, unknown>)['token_type'] as string | null | undefined,
											scope: (account as Record<string, unknown>)['scope'] as string | null | undefined,
											id_token: (account as Record<string, unknown>)['id_token'] as string | null | undefined,
											session_state: (account as Record<string, unknown>)['session_state'] as string | null | undefined,
										},
									});
								}
							}
						}
					} catch (e) {
						console.warn('[Auth] Account linking warning:', e);
					}
				}
			}
			return true;
		},
		async session({ session, token }) {
			const t = token as JWT & { role?: AppRole; authProvider?: string; stepUpAt?: number; remember?: boolean; credentialVersion?: number };
			if (session.user && token.sub) {
				session.user.id = token.sub;
				if (t.role) session.user.role = t.role;
			}
			(session as Session & { authProvider?: string; stepUpAt?: number; remember?: boolean }).authProvider = t.authProvider;
			(session as Session & { authProvider?: string; stepUpAt?: number; remember?: boolean }).stepUpAt = t.stepUpAt;
			(session as Session & { authProvider?: string; stepUpAt?: number; remember?: boolean }).remember = t.remember;
			(session.user as Session["user"] & { credentialVersion?: number }).credentialVersion = t.credentialVersion ?? 0;
			return session;
		},
		async jwt({ token, user, account }) {
			if (user && (user as NextAuthUser & { role: AppRole }).role) {
				(token as JWT & { role?: AppRole }).role = (user as NextAuthUser & { role: AppRole }).role;
			}
			if (account?.provider) {
				(token as JWT & { authProvider?: string; stepUpAt?: number }).authProvider = account.provider;
				(token as JWT & { authProvider?: string; stepUpAt?: number }).stepUpAt = Date.now();
			}
			// For credentials sign-in, ensure we stamp stepUpAt as well
			if (user && !account) {
				(token as JWT & { stepUpAt?: number }).stepUpAt = Date.now();
			}
			// Load credentialVersion for this user on sign-in
			if (user) {
				try {
					const dbUser = await prisma.user.findUnique({ where: { id: (user as NextAuthUser).id }, select: { credentialVersion: true } });
					if (dbUser) (token as JWT & { credentialVersion?: number }).credentialVersion = dbUser.credentialVersion ?? 0;
				} catch {}
			}
			// Initialize remember from user payload on sign in (credentials) or default to true on OAuth
			if (user) {
				const u = user as NextAuthUser & { remember?: boolean };
				(token as JWT & { remember?: boolean }).remember =
					u.remember ?? (account?.provider ? true : (token as JWT & { remember?: boolean }).remember ?? false);
			}
			return token;
		},
	},
	events: {},
	pages: { signIn: "/login" },
};

export default authOptions;

