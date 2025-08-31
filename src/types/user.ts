import { User as PrismaUser, Role /*, Book*/ } from '@prisma/client';

// Enum for user roles, used both in frontend and backend
export enum AppRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

// Type for internal use, excludes the password field for safety
export type SafeUser = Omit<PrismaUser, 'password'>;

// Type for exposing user data to the client, excludes sensitive and unnecessary fields
export type ClientSafeUser = Omit<PrismaUser, 'password' | 'createdAt' | 'updatedAt' | 'emailVerified'>;

// Example type for a user with related books (uncomment and use if you add relations in the future)
export type UserWithBooks = SafeUser & {
  // books: Book[]; // List of books owned by the user
  // followedBooks: Book[]; // List of books followed by the user
};
