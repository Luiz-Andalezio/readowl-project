-- CreateTable
CREATE TABLE "public"."BookRating" (
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookRating_pkey" PRIMARY KEY ("userId","bookId")
);

-- CreateIndex
CREATE INDEX "BookRating_bookId_idx" ON "public"."BookRating"("bookId");

-- AddForeignKey
ALTER TABLE "public"."BookRating" ADD CONSTRAINT "BookRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookRating" ADD CONSTRAINT "BookRating_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
