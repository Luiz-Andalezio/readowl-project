-- =============================================
-- Enums
-- =============================================
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "public"."Status" AS ENUM ('ONGOING', 'COMPLETED', 'HIATUS', 'PAUSED');

-- =============================================
-- Core Tables
-- =============================================
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "image" TEXT,
    "description" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "credentialVersion" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Genre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Book" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "synopsis" VARCHAR(2000) NOT NULL,
    "releaseFrequency" VARCHAR(50),
    "coverUrl" TEXT,
    "status" "public"."Status" NOT NULL DEFAULT 'ONGOING',
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- Auth / Sessions
-- =============================================
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "public"."PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- Domain Relations
-- =============================================
CREATE TABLE "public"."Volume" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "bookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Volume_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Chapter" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "bookId" TEXT NOT NULL,
    "volumeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."BookFollow" (
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookFollow_pkey" PRIMARY KEY ("userId","bookId")
);

CREATE TABLE "public"."BookRating" (
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BookRating_pkey" PRIMARY KEY ("userId","bookId")
);

CREATE TABLE "public"."_BookGenres" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_BookGenres_AB_pkey" PRIMARY KEY ("A","B")
);

-- =============================================
-- Indexes
-- =============================================
-- User
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- Genre
CREATE UNIQUE INDEX "Genre_name_key" ON "public"."Genre"("name");

-- Account / Session / Tokens
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "public"."PasswordResetToken"("tokenHash");

-- Domain relations
CREATE INDEX "Volume_bookId_idx" ON "public"."Volume"("bookId");
CREATE INDEX "Chapter_bookId_idx" ON "public"."Chapter"("bookId");
CREATE INDEX "Chapter_volumeId_idx" ON "public"."Chapter"("volumeId");
CREATE INDEX "BookFollow_bookId_idx" ON "public"."BookFollow"("bookId");
CREATE INDEX "BookRating_bookId_idx" ON "public"."BookRating"("bookId");
CREATE INDEX "_BookGenres_B_index" ON "public"."_BookGenres"("B");

-- =============================================
-- Foreign Keys
-- =============================================
-- Book -> User
ALTER TABLE "public"."Book" ADD CONSTRAINT "Book_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Account / Session / ResetToken -> User
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Volume / Chapter -> Book and Chapter -> Volume
ALTER TABLE "public"."Volume" ADD CONSTRAINT "Volume_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Chapter" ADD CONSTRAINT "Chapter_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Chapter" ADD CONSTRAINT "Chapter_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "public"."Volume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Follows / Ratings -> User & Book
ALTER TABLE "public"."BookFollow" ADD CONSTRAINT "BookFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."BookFollow" ADD CONSTRAINT "BookFollow_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."BookRating" ADD CONSTRAINT "BookRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."BookRating" ADD CONSTRAINT "BookRating_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BookGenres join
ALTER TABLE "public"."_BookGenres" ADD CONSTRAINT "_BookGenres_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."_BookGenres" ADD CONSTRAINT "_BookGenres_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
