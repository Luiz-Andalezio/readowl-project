import { User as PrismaUser, Role, /*Book*/ } from '@prisma/client';

// Enum de roles para uso no frontend/backend
export enum AppRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

// Tipo seguro para uso interno (sem senha)
export type SafeUser = Omit<PrismaUser, 'password'>;

// Tipo seguro para expor ao cliente (sem senha, createdAt, updatedAt, emailVerified)
export type ClientSafeUser = Omit<PrismaUser, 'password' | 'createdAt' | 'updatedAt' | 'emailVerified'>;

// Exemplo de tipo com relações (caso use no futuro)
export type UserWithBooks = SafeUser & {
  //books: Book[];
  //followedBooks: Book[];
};
