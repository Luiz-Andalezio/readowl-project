-- CreateTable
CREATE TABLE "public"."Volume" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "bookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Volume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateIndex
CREATE INDEX "Volume_bookId_idx" ON "public"."Volume"("bookId");

-- CreateIndex
CREATE INDEX "Chapter_bookId_idx" ON "public"."Chapter"("bookId");

-- CreateIndex
CREATE INDEX "Chapter_volumeId_idx" ON "public"."Chapter"("volumeId");

-- AddForeignKey
ALTER TABLE "public"."Volume" ADD CONSTRAINT "Volume_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chapter" ADD CONSTRAINT "Chapter_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chapter" ADD CONSTRAINT "Chapter_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "public"."Volume"("id") ON DELETE SET NULL ON UPDATE CASCADE;
