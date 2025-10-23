-- CreateTable
CREATE TABLE IF NOT EXISTS "Banner" (
  "id" TEXT PRIMARY KEY,
  "name" VARCHAR(200) NOT NULL,
  "imageUrl" VARCHAR(1000) NOT NULL,
  "linkUrl" VARCHAR(1000) NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index to keep ordering fast
CREATE INDEX IF NOT EXISTS "Banner_position_idx" ON "Banner" ("position", "createdAt");
