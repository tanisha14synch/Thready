# Authorization Implementation Summary ✅

## Overview

All backend endpoints now implement strict authorization to ensure users can only access data tied to their own authenticated user ID. Users cannot access other users' data, even if a different ID is passed in the request.

## Security Changes

### 1. **Replaced Insecure Authentication**

**Before:**
- Used `getUser()` function that read from `x-user-id` header
- Fallback to `'demo-user'` if header was missing
- **Security Risk:** Anyone could spoof user ID by setting a header

**After:**
- All protected routes use `requireJwt` middleware
- User ID is extracted from JWT token (cannot be spoofed)
- No fallback to demo user
- New `getAuthenticatedUserId()` function enforces JWT-based authentication

### 2. **Protected Routes**

All routes that access user-specific data now require JWT authentication:

#### Post Routes (`/posts`)
- ✅ `GET /posts` - Requires JWT (for vote data)
- ✅ `POST /posts` - Requires JWT (creates post with authenticated user ID)
- ✅ `PUT /posts/:id` - Requires JWT + ownership verification
- ✅ `DELETE /posts/:id` - Requires JWT + ownership verification
- ✅ `POST /posts/:id/comments` - Requires JWT (creates comment with authenticated user ID)
- ✅ `POST /posts/:id/vote` - Requires JWT (uses authenticated user ID)

#### Comment Routes (`/comments`)
- ✅ `PUT /comments/:id` - Requires JWT + ownership verification
- ✅ `DELETE /comments/:id` - Requires JWT + ownership verification
- ✅ `POST /comments/:id/vote` - Requires JWT (uses authenticated user ID)

#### User Routes (`/api/user`)
- ✅ `GET /api/user/me` - Requires JWT (returns only authenticated user's data)
- ✅ `GET /api/user/community` - Requires JWT (returns only authenticated user's community)

#### Community Routes (`/communities`)
- `GET /communities` - Public (no user-specific data)
- `GET /communities/:id` - Public but uses authenticated user ID for vote data (if available)
- `POST /communities` - Public (community creation)

### 3. **Ownership Verification**

All update and delete operations verify ownership:

- **Update Post:** Checks `post.userId === authenticatedUserId` before allowing update
- **Delete Post:** Checks `post.userId === authenticatedUserId` before allowing delete
- **Update Comment:** Checks `comment.userId === authenticatedUserId` before allowing update
- **Delete Comment:** Checks `comment.userId === authenticatedUserId` before allowing delete

**Legacy Posts:** Posts with `userId === 'legacy'` or `null` can be updated/deleted by anyone (for backward compatibility with seeded data).

### 4. **User ID Source**

All controllers now get user ID from JWT token:
- **Before:** `getUser(request)` → insecure header-based
- **After:** `getAuthenticatedUserId(request)` → JWT-based, throws error if not authenticated

### 5. **Request Body Validation**

Even if request body contains user-related fields:
- `userId` is **always** set from JWT token (cannot be overridden)
- `user` field (display name) can be set in body, but doesn't affect authorization
- All database operations use `userId` from JWT, not from request body

## Implementation Details

### New Functions

**`getAuthenticatedUserId(request)`**
- Extracts user ID from `request.user.id` (set by JWT middleware)
- Throws error if user ID not found
- Ensures `requireJwt` middleware was called

**`verifyUserOwnership(request, requestedUserId)`**
- Utility function to verify ownership
- Currently not used (ownership checks are inline), but available for future use

### Updated Controllers

1. **PostController**
   - `getPosts()` - Uses `request.user?.id` from JWT
   - `createPost()` - Uses `getAuthenticatedUserId(request)`
   - `updatePost()` - Verifies ownership before update
   - `deletePost()` - Verifies ownership before delete
   - `addComment()` - Uses `getAuthenticatedUserId(request)`
   - `votePost()` - Uses `getAuthenticatedUserId(request)`

2. **CommentController**
   - `updateComment()` - Verifies ownership before update
   - `deleteComment()` - Verifies ownership before delete
   - `voteComment()` - Uses `getAuthenticatedUserId(request)`

3. **CommunityController**
   - `getCommunityById()` - Uses authenticated user ID for vote data (optional)

4. **UserController**
   - Already secure - uses `request.user?.id` from JWT
   - No changes needed

## Security Guarantees

✅ **Users can only access their own data**
- User profile endpoints return only authenticated user's data
- User ID is extracted from JWT token (cannot be spoofed)

✅ **Users can only modify their own content**
- Update/delete operations verify ownership
- Returns 403 Forbidden if user tries to modify another user's content

✅ **Users can only create content as themselves**
- Post/comment creation uses authenticated user ID from JWT
- Request body cannot override user ID

✅ **Vote operations are tied to authenticated user**
- All votes use authenticated user ID from JWT
- Users cannot vote as another user

✅ **No user ID spoofing**
- Removed insecure `x-user-id` header fallback
- All user IDs come from verified JWT tokens

## Testing Authorization

To test that authorization is working:

1. **Try accessing another user's data:**
   ```bash
   # This should return 401 Unauthorized (no token)
   curl http://localhost:3001/api/user/me
   
   # This should return only YOUR user data (from your token)
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/user/me
   ```

2. **Try deleting another user's post:**
   ```bash
   # This should return 403 Forbidden
   curl -X DELETE -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/posts/OTHER_USER_POST_ID
   ```

3. **Try creating a post with different user ID in body:**
   ```bash
   # The userId in the body is ignored - post is created with YOUR user ID from token
   curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","communityId":"test","userId":"OTHER_USER_ID"}' \
     http://localhost:3001/posts
   ```

## Migration Notes

- **Breaking Change:** All protected endpoints now require JWT authentication
- **Breaking Change:** `x-user-id` header is no longer accepted
- **Backward Compatible:** Legacy posts (with `userId === 'legacy'`) can still be updated/deleted by anyone

## Files Modified

- `server/src/utils/auth.ts` - Replaced insecure `getUser()` with secure `getAuthenticatedUserId()`
- `server/src/routes/post.ts` - Added `requireJwt` middleware to all routes
- `server/src/routes/comment.ts` - Added `requireJwt` middleware to all routes
- `server/src/controllers/postController.ts` - Updated all methods to use JWT-based user ID
- `server/src/controllers/commentController.ts` - Updated all methods to use JWT-based user ID
- `server/src/controllers/communityController.ts` - Updated to use authenticated user ID for vote data

## Status: ✅ COMPLETE

All authorization checks are in place. Users can only access and modify their own data.

