-- CreateTable
CREATE TABLE "PostVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommentVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commentId" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommentVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "avatar" TEXT,
    "text" TEXT NOT NULL,
    "commentedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayedScore" INTEGER NOT NULL DEFAULT 1,
    "userVote" INTEGER NOT NULL DEFAULT 0,
    "shareable" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("avatar", "commentedAt", "displayedScore", "id", "postId", "shareable", "text", "user", "userVote") SELECT "avatar", "commentedAt", "displayedScore", "id", "postId", "shareable", "text", "user", "userVote" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PostVote_postId_user_key" ON "PostVote"("postId", "user");

-- CreateIndex
CREATE UNIQUE INDEX "CommentVote_commentId_user_key" ON "CommentVote"("commentId", "user");
