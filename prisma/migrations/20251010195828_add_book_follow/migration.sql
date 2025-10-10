-- CreateTable
CREATE TABLE "public"."BookFollow" (
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookFollow_pkey" PRIMARY KEY ("userId","bookId")
);

-- CreateIndex
CREATE INDEX "BookFollow_bookId_idx" ON "public"."BookFollow"("bookId");

-- AddForeignKey
ALTER TABLE "public"."BookFollow" ADD CONSTRAINT "BookFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookFollow" ADD CONSTRAINT "BookFollow_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
