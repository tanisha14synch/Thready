-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'legacy',
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
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'legacy',
    "user" TEXT NOT NULL,
    "avatar" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "image" TEXT,
    "video" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "shareable" BOOLEAN NOT NULL DEFAULT true,
    "postedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Post_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("avatar", "communityId", "content", "downvotes", "id", "image", "postedAt", "shareable", "title", "upvotes", "user", "video") SELECT "avatar", "communityId", "content", "downvotes", "id", "image", "postedAt", "shareable", "title", "upvotes", "user", "video" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
