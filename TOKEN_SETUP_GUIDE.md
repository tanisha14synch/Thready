# Token Setup Guide - Everything You Need to Know ✅

## Current Status: **COMPLETE** ✅

Your token authentication system is fully configured! Here's what's already done:

## ✅ What's Already Working

### 1. **Token Storage** 
- ✅ Token is stored in `mainStore.authToken`
- ✅ Token persists across page refreshes (via Pinia persist)
- ✅ User data is also persisted

### 2. **Token Acquisition**
- ✅ OAuth 2.0 flow implemented (`/auth/shopify/authorize` → `/auth/shopify/callback`)
- ✅ Token is received from Shopify OAuth callback
- ✅ Token is saved automatically in `auth/callback.vue`

### 3. **Token Usage**
- ✅ Token is sent with API requests via `Authorization: Bearer <token>` header
- ✅ Token is used in:
  - `/api/user/me` - Get current user profile
  - All post/comment operations (create, delete, vote)
  - All authenticated endpoints

### 4. **Backend Validation**
- ✅ Backend validates JWT tokens using `requireJwt` middleware
- ✅ Token is verified on protected routes
- ✅ User ID is extracted from token for authorization

## 🔄 How It Works

### Step 1: Get a Token (OAuth Flow)

**Option A: Via Shopify OAuth (Recommended)**
```
1. User visits: http://localhost:3001/auth/shopify/authorize?shop=thebarwardrobe.myshopify.com
2. User logs in to Shopify and authorizes
3. Shopify redirects to: /auth/callback?token=...
4. Token is automatically saved to mainStore
```

**Option B: Manual Token (For Testing)**
```javascript
// In browser console or code:
const mainStore = useMainStore()
mainStore.setAuthSession({ 
  token: 'your-jwt-token-here',
  user: { id: 'user-id', ... }
})
```

### Step 2: Token is Automatically Used

Once you have a token:
- ✅ It's automatically sent with all API requests
- ✅ Backend validates it on protected routes
- ✅ User data is fetched from `/api/user/me`
- ✅ Token persists across page refreshes

### Step 3: Token Persistence

- ✅ Token is saved to `localStorage` via Pinia persist
- ✅ On page refresh, token is automatically restored
- ✅ User stays logged in until token expires (7 days) or is cleared

## 📋 What You Need to Do

### **Nothing! Everything is already configured.** 🎉

However, if you want to test or use the OAuth flow:

### To Get a Token via OAuth:

1. **Configure Shopify App** (if not done):
   - Set redirect URI: `http://localhost:3001/auth/shopify/callback`
   - Enable scopes: `read_customers`, `read_customer_tags`

2. **Start OAuth Flow**:
   ```
   Visit: http://localhost:3001/auth/shopify/authorize?shop=thebarwardrobe.myshopify.com
   ```

3. **Token is Automatically Saved**:
   - After OAuth completes, token is saved
   - User is redirected to frontend
   - Token persists across refreshes

## 🔍 How to Check if Token is Working

### Check Token in Browser Console:
```javascript
// Open browser console (F12)
const { useMainStore } = await import('/app/stores/main.js')
const store = useMainStore()
console.log('Token:', store.authToken)
console.log('User:', store.user)
```

### Check Token in Network Tab:
1. Open DevTools → Network tab
2. Make any API request (create post, vote, etc.)
3. Check request headers:
   - Should see: `Authorization: Bearer <your-token>`

### Test Token Endpoint:
```javascript
// In browser console:
const token = useMainStore().authToken
fetch('http://localhost:3001/api/user/me', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log)
```

## 🛠️ Token Configuration

### Token Expiration
- **Default**: 7 days
- **Location**: `server/src/utils/jwt.ts`
- **Change**: Modify `expiresIn: '7d'` in `signJwt()`

### Token Secret
- **Location**: `server/.env`
- **Variable**: `JWT_SECRET`
- **Default**: `supersecretjwtkey_change_in_production`
- **⚠️ Change this in production!**

## 📝 Files Involved

### Frontend:
- `app/stores/main.js` - Stores token and user
- `app/utils/shopify.js` - Gets token for API requests
- `app/stores/posts.js` - Uses token in `getHeaders()`
- `app/pages/auth/callback.vue` - Receives and saves token
- `app/plugins/shopify-auth.client.ts` - Hydrates user from token

### Backend:
- `server/src/routes/auth.ts` - OAuth flow, generates token
- `server/src/utils/jwt.ts` - Token signing/verification
- `server/src/routes/user.ts` - Protected route using token
- `server/src/routes/post.ts` - Uses token for user identification

## ✅ Summary

**Everything is done!** Your token system is:
- ✅ Storing tokens
- ✅ Persisting across refreshes
- ✅ Sending with requests
- ✅ Validating on backend
- ✅ Working with OAuth flow

**You don't need to do anything** - just use the OAuth flow to get a token, and everything else happens automatically!

## 🚀 Next Steps (Optional)

1. **Test OAuth Flow**: Visit `/auth/shopify/authorize` to get a token
2. **Check Token**: Verify token is saved in `mainStore`
3. **Test API**: Make a request and check headers in Network tab
4. **Production**: Update `JWT_SECRET` in `.env` for production

---

**Your token authentication is complete and ready to use!** 🎉

