# Dummy Data Setup for Comment Deletion Testing 📝

## Overview

This document explains how to set up dummy data to test comment deletion ownership enforcement.

## Quick Start

### 1. Run the Seed Script

```bash
cd server
npm run seed
```

Or directly:

```bash
cd server
npx prisma db seed
```

### 2. What Gets Created

The seed script creates:

#### **3 Test Users:**
- **User 1**: `johndoe` (john.doe@example.com)
- **User 2**: `janesmith` (jane.smith@example.com)  
- **User 3**: `bobjohnson` (bob.johnson@example.com)

#### **7 Test Comments (organized by User ID):**

**User 1's Comments** (3 comments - only User 1 can delete):
- `comment-user1-001` on post `p-gaming-1`
- `comment-user1-002` on post `p-movies-1`
- `comment-user1-003` on post `p-bar-1`

**User 2's Comments** (2 comments - only User 2 can delete):
- `comment-user2-001` on post `p-gaming-1`
- `comment-user2-002` on post `p-movies-1`

**User 3's Comments** (2 comments - only User 3 can delete):
- `comment-user3-001` on post `p-bar-1`
- `comment-user3-002` on post `p-gaming-1`

## Comment IDs by User

### User 1 (johndoe) - Can Delete:
```
comment-user1-001
comment-user1-002
comment-user1-003
```

### User 2 (janesmith) - Can Delete:
```
comment-user2-001
comment-user2-002
```

### User 3 (bobjohnson) - Can Delete:
```
comment-user3-001
comment-user3-002
```

## Getting User IDs

After seeding, get the actual user IDs:

### Option 1: Prisma Studio (Recommended)
```bash
cd server
npx prisma studio
```
Navigate to the `users` table to see all user IDs.

### Option 2: SQLite CLI
```bash
cd server
sqlite3 prisma/dev.db "SELECT id, username, email FROM users;"
```

### Option 3: API Call (if you have a token)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/user/me
```

## Testing Comment Deletion

### Step 1: Get JWT Tokens

You need JWT tokens for each user. The token must contain the `userId` in the payload.

### Step 2: Test Deletion

**Test Case 1: User deletes own comment (Should succeed)**
```bash
curl -X DELETE \
  -H "Authorization: Bearer USER1_TOKEN" \
  http://localhost:3001/comments/comment-user1-001

# Expected: { "success": true }
```

**Test Case 2: User tries to delete another user's comment (Should fail)**
```bash
curl -X DELETE \
  -H "Authorization: Bearer USER1_TOKEN" \
  http://localhost:3001/comments/comment-user2-001

# Expected: { "error": "Forbidden: You can only delete your own comments" }
```

## Seed Script Output

When you run the seed script, you'll see:

```
✓ Created/Updated user: johndoe (ID: abc123...)
✓ Created/Updated user: janesmith (ID: def456...)
✓ Created/Updated user: bobjohnson (ID: ghi789...)
✓ Created/Updated comment: comment-user1-001 (Owner: johndoe, UserID: abc123...)
✓ Created/Updated comment: comment-user1-002 (Owner: johndoe, UserID: abc123...)
...

📝 Test Comments Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User 1 (abc123... - johndoe):
  - comment-user1-001 (on p-gaming-1)
  - comment-user1-002 (on p-movies-1)
  - comment-user1-003 (on p-bar-1)

User 2 (def456... - janesmith):
  - comment-user2-001 (on p-gaming-1)
  - comment-user2-002 (on p-movies-1)

User 3 (ghi789... - bobjohnson):
  - comment-user3-001 (on p-bar-1)
  - comment-user3-002 (on p-gaming-1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧪 Testing Instructions:
1. Get JWT token for user1 (johndoe)
2. Try to delete comment-user1-001 → Should succeed (200 OK)
3. Try to delete comment-user2-001 → Should fail (403 Forbidden)
4. Try to delete comment-user3-001 → Should fail (403 Forbidden)
5. Repeat with user2 and user3 tokens

✅ Seeded communities, posts, users, and test comments
```

## Resetting Test Data

To reset and re-seed:

```bash
cd server
# Reset database (WARNING: This deletes all data!)
npx prisma migrate reset

# Or just re-run seed
npm run seed
```

## Files Modified

- `server/prisma/seed.ts` - Added dummy users and comments
- `server/package.json` - Added seed script configuration

## Next Steps

1. Run `npm run seed` to create test data
2. Get user IDs from Prisma Studio or database
3. Create JWT tokens for each user
4. Test comment deletion with different scenarios
5. Verify strict ownership enforcement works

See `TEST_COMMENT_DELETION.md` for detailed testing instructions!

