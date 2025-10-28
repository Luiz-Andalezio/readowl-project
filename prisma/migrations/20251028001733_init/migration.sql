-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOK_COMMENT', 'CHAPTER_COMMENT', 'COMMENT_REPLY', 'NEW_CHAPTER');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "bookId" TEXT,
    "chapterId" TEXT,
    "commentId" TEXT,
    "replyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "bookTitle" TEXT,
    "bookCoverUrl" TEXT,
    "chapterTitle" TEXT,
    "authorName" TEXT,
    "commenterName" TEXT,
    "commentContent" TEXT,
    "replyContent" TEXT,
    "originalComment" TEXT,
    "chapterSnippet" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_bookId_idx" ON "Notification"("bookId");

-- CreateIndex
CREATE INDEX "Notification_chapterId_idx" ON "Notification"("chapterId");

-- CreateIndex
CREATE INDEX "Notification_commentId_idx" ON "Notification"("commentId");

-- CreateIndex
CREATE INDEX "Notification_replyId_idx" ON "Notification"("replyId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
