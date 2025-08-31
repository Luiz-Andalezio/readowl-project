import NextAuth, { DefaultSession, User as NextAuthUser } from "next-auth";
import { AppRole } from "src/types/user.ts";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: AppRole;
        } & DefaultSession["user"];
    }
    interface User extends NextAuthUser {
        id: string;
        role: AppRole;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: AppRole;
    }
}
