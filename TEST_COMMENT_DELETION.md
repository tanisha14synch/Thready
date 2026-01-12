# Comment Deletion Testing Guide 🧪

## Overview

This guide helps you test the strict comment deletion ownership enforcement using dummy data seeded in the database.

## Setup

### 1. Seed the Database

Run the seed script to create test users and comments:

```bash
cd server
npx prisma db seed
```

Or if you have a seed script configured:

```bash
cd server
npm run seed
```

### 2. Verify Seed Data

The seed script creates:

**3 Test Users:**
- **User 1**: `johndoe` (ID: `user-001`)
- **User 2**: `janesmith` (ID: `user-002`)
- **User 3**: `bobjohnson` (ID: `user-003`)

**7 Test Comments:**
- **User 1's Comments** (3 comments):
  - `comment-user1-001` on post `p-gaming-1`
  - `comment-user1-002` on post `p-movies-1`
  - `comment-user1-003` on post `p-bar-1`

- **User 2's Comments** (2 comments):
  - `comment-user2-001` on post `p-gaming-1`
  - `comment-user2-002` on post `p-movies-1`

- **User 3's Comments** (2 comments):
  - `comment-user3-001` on post `p-bar-1`
  - `comment-user3-002` on post `p-gaming-1`

## Getting User IDs

First, you need to get the actual user IDs from the database. You can query them:

```bash
# Using Prisma Studio
npx prisma studio

# Or using SQLite CLI
sqlite3 prisma/dev.db "SELECT id, username, email FROM users;"
```

## Getting JWT Tokens

To test deletion, you need JWT tokens for each user. You can:

1. **Use Shopify OAuth** to authenticate as each user
2. **Create tokens manually** using the JWT secret

### Option 1: Create Test Tokens (For Testing)

You can create a simple script to generate test tokens:

```javascript
// test-tokens.js
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'

// Replace these with actual user IDs from your database
const user1Id = 'YOUR_USER1_ID_HERE'
const user2Id = 'YOUR_USER2_ID_HERE'
const user3Id = 'YOUR_USER3_ID_HERE'

const token1 = jwt.sign({ userId: user1Id }, JWT_SECRET, { expiresIn: '7d' })
const token2 = jwt.sign({ userId: user2Id }, JWT_SECRET, { expiresIn: '7d' })
const token3 = jwt.sign({ userId: user3Id }, JWT_SECRET, { expiresIn: '7d' })

console.log('User 1 Token (johndoe):', token1)
console.log('User 2 Token (janesmith):', token2)
console.log('User 3 Token (bobjohnson):', token3)
```

## Testing Scenarios

### Test 1: User Deletes Their Own Comment ✅

**Expected:** 200 OK

```bash
# User 1 tries to delete their own comment
curl -X DELETE \
  -H "Authorization: Bearer USER1_TOKEN" \
  http://localhost:3001/comments/comment-user1-001

# Response: { "success": true }
```

### Test 2: User Tries to Delete Another User's Comment ❌

**Expected:** 403 Forbidden

```bash
# User 1 tries to delete User 2's comment
curl -X DELETE \
  -H "Authorization: Bearer USER1_TOKEN" \
  http://localhost:3001/comments/comment-user2-001

# Response: { "error": "Forbidden: You can only delete your own comments" }
```

### Test 3: User Tries to Delete Non-Existent Comment ❌

**Expected:** 404 Not Found

```bash
# User 1 tries to delete a comment that doesn't exist
curl -X DELETE \
  -H "Authorization: Bearer USER1_TOKEN" \
  http://localhost:3001/comments/non-existent-comment-id

# Response: { "error": "Comment not found" }
```

### Test 4: Unauthenticated Request ❌

**Expected:** 401 Unauthorized

```bash
# No token provided
curl -X DELETE \
  http://localhost:3001/comments/comment-user1-001

# Response: { "error": "Unauthorized" }
```

### Test 5: User Tries to Delete Comment with Manipulated ID ❌

**Expected:** 403 Forbidden (if comment exists but belongs to another user) or 404 Not Found (if comment doesn't exist)

```bash
# User 1 tries different comment IDs
curl -X DELETE \
  -H "Authorization: Bearer USER1_TOKEN" \
  http://localhost:3001/comments/comment-user2-001

# Response: { "error": "Forbidden: You can only delete your own comments" }
```

## Complete Test Sequence

Run this sequence to test all scenarios:

```bash
# Set your tokens
export USER1_TOKEN="your_user1_jwt_token"
export USER2_TOKEN="your_user2_jwt_token"
export USER3_TOKEN="your_user3_jwt_token"

# Test 1: User 1 deletes own comment (should succeed)
echo "Test 1: User 1 deletes own comment"
curl -X DELETE \
  -H "Authorization: Bearer $USER1_TOKEN" \
  http://localhost:3001/comments/comment-user1-001

# Test 2: User 1 tries to delete User 2's comment (should fail)
echo "\nTest 2: User 1 tries to delete User 2's comment"
curl -X DELETE \
  -H "Authorization: Bearer $USER1_TOKEN" \
  http://localhost:3001/comments/comment-user2-001

# Test 3: User 2 deletes own comment (should succeed)
echo "\nTest 3: User 2 deletes own comment"
curl -X DELETE \
  -H "Authorization: Bearer $USER2_TOKEN" \
  http://localhost:3001/comments/comment-user2-001

# Test 4: User 2 tries to delete User 3's comment (should fail)
echo "\nTest 4: User 2 tries to delete User 3's comment"
curl -X DELETE \
  -H "Authorization: Bearer $USER2_TOKEN" \
  http://localhost:3001/comments/comment-user3-001

# Test 5: User 3 deletes own comment (should succeed)
echo "\nTest 5: User 3 deletes own comment"
curl -X DELETE \
  -H "Authorization: Bearer $USER3_TOKEN" \
  http://localhost:3001/comments/comment-user3-001

# Test 6: Unauthenticated request (should fail)
echo "\nTest 6: Unauthenticated request"
curl -X DELETE \
  http://localhost:3001/comments/comment-user1-002

# Test 7: Non-existent comment (should fail)
echo "\nTest 7: Non-existent comment"
curl -X DELETE \
  -H "Authorization: Bearer $USER1_TOKEN" \
  http://localhost:3001/comments/non-existent-id
```

## Expected Results Summary

| Test | User | Comment ID | Expected Result |
|------|------|------------|-----------------|
| 1 | User 1 | comment-user1-001 | ✅ 200 OK |
| 2 | User 1 | comment-user2-001 | ❌ 403 Forbidden |
| 3 | User 2 | comment-user2-001 | ✅ 200 OK |
| 4 | User 2 | comment-user3-001 | ❌ 403 Forbidden |
| 5 | User 3 | comment-user3-001 | ✅ 200 OK |
| 6 | None | comment-user1-002 | ❌ 401 Unauthorized |
| 7 | User 1 | non-existent-id | ❌ 404 Not Found |

## Verifying Logs

Check server logs for security events:

```bash
# Watch server logs
tail -f server.log

# Look for:
# - "unauthorized_access_attempt" - When user tries to delete another's comment
# - "comment_deleted" - When deletion succeeds
# - "comment_deletion_error" - When deletion fails
```

## Database Verification

After testing, verify comments were deleted correctly:

```bash
# Using Prisma Studio
npx prisma studio

# Or SQLite CLI
sqlite3 prisma/dev.db "SELECT id, userId, user, text FROM Comment;"
```

## Troubleshooting

### Issue: "Comment not found"
- **Solution**: Check that the comment ID exists in the database
- **Verify**: Run `npx prisma studio` and check the Comment table

### Issue: "Unauthorized"
- **Solution**: Ensure JWT token is valid and includes `userId` in payload
- **Verify**: Decode your JWT token at jwt.io

### Issue: "Forbidden: You can only delete your own comments"
- **This is expected behavior!** The system is working correctly
- The comment belongs to a different user

### Issue: Seed script fails
- **Solution**: Ensure database migrations are applied: `npx prisma migrate dev`
- **Verify**: Check that User model exists in schema

## Quick Reference: Comment IDs by User

**User 1 (johndoe) owns:**
- `comment-user1-001`
- `comment-user1-002`
- `comment-user1-003`

**User 2 (janesmith) owns:**
- `comment-user2-001`
- `comment-user2-002`

**User 3 (bobjohnson) owns:**
- `comment-user3-001`
- `comment-user3-002`

Use these IDs to test ownership enforcement!

