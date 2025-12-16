-- CreateTable
CREATE TABLE "Community" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "headerImage" TEXT,
    "icon" TEXT,
    "members" INTEGER NOT NULL DEFAULT 0,
    "online" INTEGER NOT NULL DEFAULT 0,
    "createdDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Moderator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "communityId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatar" TEXT,
    CONSTRAINT "Moderator_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "communityId" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "avatar" TEXT,
    "text" TEXT NOT NULL,
    "commentedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayedScore" INTEGER NOT NULL DEFAULT 1,
    "userVote" INTEGER NOT NULL DEFAULT 0,
    "shareable" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
