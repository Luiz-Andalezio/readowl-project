import type { DefaultSession, User as NextAuthUser } from "next-auth";
import { AppRole } from "src/types/user.ts";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: AppRole;
        } & DefaultSession["user"];
    authProvider?: string;
    stepUpAt?: number; // epoch ms of last (re)authentication
    }
    interface User extends NextAuthUser {
        id: string;
        role: AppRole;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
    role: AppRole;
    authProvider?: string;
    stepUpAt?: number; // epoch ms of last (re)authentication
    }
}
