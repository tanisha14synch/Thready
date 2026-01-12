# Comment Deletion - Strict Ownership Enforcement ✅

## Overview

Comment deletion now implements **strict ownership enforcement** with zero exceptions. Users can **ONLY** delete comments created by their own user ID. No user can delete another user's comment under any condition.

## Security Implementation

### Core Rules

1. ✅ **Strict Ownership Check**: `comment.userId === authenticatedUser.id` (exact match required)
2. ✅ **No Legacy Comments**: Comments with null or 'legacy' userId cannot be deleted by anyone
3. ✅ **Server-Side Only**: All validation happens on the backend, no frontend checks
4. ✅ **ID Manipulation Prevention**: Comment IDs cannot be manipulated to delete other users' comments
5. ✅ **403 Forbidden Response**: Unauthorized attempts return 403 Forbidden
6. ✅ **Comprehensive Logging**: All deletion attempts (authorized and unauthorized) are logged

### Implementation Details

#### 1. **Strict Ownership Verification Function**

Created `checkCommentOwnershipStrict()` in `server/src/utils/authorization.ts`:

```typescript
export function checkCommentOwnershipStrict(
  commentUserId: string | null | undefined,
  authenticatedUserId: string
): { authorized: boolean; error?: { code: number; message: string } }
```

**Rules:**
- Returns `authorized: false` if `commentUserId` is null or undefined
- Returns `authorized: false` if `commentUserId !== authenticatedUserId` (strict equality)
- Returns `authorized: true` ONLY if `commentUserId === authenticatedUserId`

#### 2. **Enhanced Delete Comment Controller**

The `deleteComment()` method in `server/src/controllers/commentController.ts` now:

1. **Fetches comment with explicit field selection**:
   ```typescript
   const comment = await this.prisma.comment.findUnique({ 
     where: { id },
     select: {
       id: true,
       userId: true,
       text: true,
       postId: true
     }
   })
   ```

2. **Verifies comment exists** (404 if not found)

3. **Performs strict ownership check**:
   ```typescript
   const ownershipCheck = checkCommentOwnershipStrict(comment.userId, authenticatedUserId)
   if (!ownershipCheck.authorized) {
     // Log and return 403
   }
   ```

4. **Additional redundant security check**:
   ```typescript
   if (comment.userId !== authenticatedUserId) {
     // Double-check before deletion
     return reply.code(403).send({ error: 'Forbidden' })
   }
   ```

5. **Logs successful deletion** for audit trail

#### 3. **Route Protection**

The delete route is protected with JWT middleware:

```typescript
server.delete<{ Params: { id: string } }>('/comments/:id', 
  { preHandler: requireJwt }, 
  async (request, reply) => {
    return controller.deleteComment(request, reply)
  }
)
```

- ✅ Requires valid JWT token
- ✅ Extracts user ID from JWT (cannot be spoofed)
- ✅ No user ID can be passed in request body or query parameters

## Security Guarantees

### ✅ User Can Only Delete Own Comments

**Test Case 1: User tries to delete their own comment**
```bash
# User A's token, User A's comment ID
curl -X DELETE \
  -H "Authorization: Bearer USER_A_TOKEN" \
  http://localhost:3001/comments/USER_A_COMMENT_ID

# Result: ✅ 200 OK { success: true }
```

**Test Case 2: User tries to delete another user's comment**
```bash
# User A's token, User B's comment ID
curl -X DELETE \
  -H "Authorization: Bearer USER_A_TOKEN" \
  http://localhost:3001/comments/USER_B_COMMENT_ID

# Result: ❌ 403 Forbidden { error: "Forbidden: You can only delete your own comments" }
```

### ✅ No ID Manipulation Possible

**Test Case 3: User tries to manipulate comment ID**
```bash
# User A's token, trying different comment IDs
curl -X DELETE \
  -H "Authorization: Bearer USER_A_TOKEN" \
  http://localhost:3001/comments/ANY_COMMENT_ID

# Result: 
# - If comment doesn't exist: ❌ 404 Not Found
# - If comment belongs to User B: ❌ 403 Forbidden
# - If comment belongs to User A: ✅ 200 OK
```

### ✅ Legacy/Null Comments Cannot Be Deleted

**Test Case 4: Comment with null userId**
```bash
# Any user's token, comment with null userId
curl -X DELETE \
  -H "Authorization: Bearer ANY_TOKEN" \
  http://localhost:3001/comments/LEGACY_COMMENT_ID

# Result: ❌ 403 Forbidden { error: "Forbidden: Comment ownership cannot be verified" }
```

### ✅ Server-Side Validation Only

- ✅ All checks happen on the backend
- ✅ Frontend cannot bypass validation
- ✅ JWT token is required (no anonymous deletions)
- ✅ User ID comes exclusively from JWT token

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
**When:** Missing or invalid JWT token

### 404 Not Found
```json
{
  "error": "Comment not found"
}
```
**When:** Comment ID doesn't exist in database

### 403 Forbidden
```json
{
  "error": "Forbidden: You can only delete your own comments"
}
```
**When:** Comment exists but `comment.userId !== authenticatedUser.id`

### 403 Forbidden (Ownership Unverifiable)
```json
{
  "error": "Forbidden: Comment ownership cannot be verified"
}
```
**When:** Comment has null or undefined userId

### 500 Internal Server Error
```json
{
  "error": "Failed to delete comment"
}
```
**When:** Database error or unexpected exception (logged but not exposed)

## Security Logging

All deletion attempts are logged:

### Unauthorized Attempt
```json
{
  "type": "unauthorized_access_attempt",
  "resourceType": "comment",
  "resourceId": "comment-123",
  "attemptedUserId": "user-b-id",
  "authenticatedUserId": "user-a-id",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Successful Deletion
```json
{
  "type": "comment_deleted",
  "commentId": "comment-123",
  "userId": "user-a-id",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error During Deletion
```json
{
  "type": "comment_deletion_error",
  "commentId": "comment-123",
  "userId": "user-a-id",
  "error": "Database connection failed",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Files Modified

1. **`server/src/utils/authorization.ts`**
   - Added `checkCommentOwnershipStrict()` function
   - Enhanced `verifyResourceOwnership()` with strict mode support
   - Enhanced `checkOwnershipOrForbid()` with strict mode parameter

2. **`server/src/controllers/commentController.ts`**
   - Completely rewrote `deleteComment()` method
   - Added strict ownership verification
   - Added redundant security check
   - Enhanced logging for all scenarios
   - Updated `updateComment()` to use strict mode

3. **`server/src/routes/comment.ts`**
   - Already protected with `requireJwt` middleware (no changes needed)

## Testing Checklist

- [x] User can delete their own comment
- [x] User cannot delete another user's comment
- [x] User cannot delete comment with manipulated ID
- [x] User cannot delete comment with null userId
- [x] Unauthorized attempts return 403 Forbidden
- [x] Non-existent comments return 404 Not Found
- [x] Missing JWT token returns 401 Unauthorized
- [x] All attempts are logged for security monitoring
- [x] Server-side validation only (no frontend dependency)

## Status: ✅ COMPLETE

**Strict comment deletion ownership enforcement is fully implemented.**

- ✅ Users can ONLY delete comments created by their own user ID
- ✅ `comment.userId === authenticatedUser.id` is strictly enforced
- ✅ No exceptions: legacy/null comments cannot be deleted
- ✅ Server-side validation only
- ✅ ID manipulation prevented
- ✅ 403 Forbidden for unauthorized attempts
- ✅ Comprehensive security logging

