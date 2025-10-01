import { User as PrismaUser, Book } from '@prisma/client';

// Enum for user roles, used both in frontend and backend
export enum AppRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

// Type for internal use, excludes the password field for safety
export type SafeUser = Omit<PrismaUser, 'password'>;

// Type for exposing user data to the client, excludes sensitive and unnecessary fields
export type ClientSafeUser = Omit<PrismaUser, 'password' | 'createdAt' | 'updatedAt' | 'emailVerified'>;

// User including created books (author relationship)
export type UserWithBooks = SafeUser & {
  books: Book[]; // Books authored by user
};
