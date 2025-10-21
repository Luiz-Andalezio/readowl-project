-- CreateTable
CREATE TABLE "public"."ChapterView" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChapterView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChapterView_chapterId_idx" ON "public"."ChapterView"("chapterId");

-- CreateIndex
CREATE INDEX "ChapterView_chapterId_createdAt_idx" ON "public"."ChapterView"("chapterId", "createdAt");

-- CreateIndex
CREATE INDEX "ChapterView_chapterId_userId_createdAt_idx" ON "public"."ChapterView"("chapterId", "userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."ChapterView" ADD CONSTRAINT "ChapterView_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChapterView" ADD CONSTRAINT "ChapterView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
