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
    remember?: boolean; // whether the user opted into long-lived session
    }
    interface User extends NextAuthUser {
        id: string;
        role: AppRole;
        credentialVersion?: number;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
    role: AppRole;
    authProvider?: string;
    stepUpAt?: number; // epoch ms of last (re)authentication
    remember?: boolean; // whether the user opted into long-lived session
    credentialVersion?: number;
    }
}
