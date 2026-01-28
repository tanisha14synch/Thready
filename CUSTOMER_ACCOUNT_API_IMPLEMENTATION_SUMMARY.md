# Customer Account API OAuth Implementation Summary ✅

## Overview

Your backend has been updated to implement **Shopify Customer Account API OAuth 2.0** according to the master plan. This enables customers to authenticate using their Shopify store credentials.

## ✅ What Was Implemented

### 1. **New OAuth Utilities** (`server/src/utils/customerAccountOAuth.ts`)
   - `buildCustomerAccountAuthUrl()` - Creates Customer Account API authorization URLs
   - `exchangeCustomerAccountCodeForToken()` - Exchanges code for token via Shopify.com endpoint
   - `fetchCustomerAccountProfile()` - Fetches customer data via Customer Account API GraphQL
   - `generateStateAndNonce()` - CSRF protection utilities
   - `extractRootDomain()` - Cookie domain extraction

### 2. **State Management** (`server/src/utils/stateStore.ts`)
   - In-memory state store for OAuth CSRF protection
   - State expiry (10 minutes)
   - Automatic cleanup of expired states

### 3. **Customer Account Service** (`server/src/services/customerAccountService.ts`)
   - Service layer for Customer Account API operations
   - `getCustomerProfile()` - Fetch customer profile
   - `getCustomerOrders()` - Fetch customer orders

### 4. **Updated Auth Controller** (`server/src/controllers/authController.ts`)
   - `initiateCustomerAccountOAuth()` - Initiates Customer Account API OAuth flow
   - `handleCustomerAccountCallback()` - Handles OAuth callback with state validation
   - `getCurrentSession()` - Returns user from session cookie
   - `logout()` - Clears session cookie
   - `refreshSession()` - Refreshes session token
   - Legacy endpoints maintained for backward compatibility

### 5. **Updated Routes** (`server/src/routes/auth.ts`)
   - `GET /auth/shopify/login` - Initiates OAuth flow
   - `GET /auth/shopify/callback` - Handles OAuth callback
   - `GET /auth/me` - Returns current user
   - `POST /auth/logout` - Logs out user
   - `POST /auth/refresh` - Refreshes session

### 6. **Server Updates** (`server/src/index.ts`)
   - Registered `@fastify/cookie` plugin
   - Configured CORS with credentials support
   - Added `trustProxy` for reverse proxy support

### 7. **JWT Updates** (`server/src/utils/jwt.ts`)
   - Added `signSessionJwt()` for session tokens
   - Added `SessionJwtPayload` type for customer account data

## 🔄 How to Use

### Step 1: Install Dependencies

```bash
cd server
npm install @fastify/cookie jsonwebtoken
npm install --save-dev @types/jsonwebtoken  # If using TypeScript
```

### Step 2: Configure Shopify App

1. Go to Shopify Admin → Settings → Apps and sales channels → Develop apps
2. Select your app → Configuration
3. Enable **Customer Account API access scopes**:
   - `customer_read_customers`
   - `customer_read_orders`
4. Set redirect URI: `http://localhost:3001/auth/shopify/callback`
5. Go to Settings → Customer accounts → Enable **"New customer accounts"**

### Step 3: Update Environment Variables

Add to your `.env` file:

```env
SHOPIFY_SHOP_DOMAIN=thebarwardrobe.myshopify.com
CALLBACK_URL=http://localhost:3001/auth/shopify/callback
COMMUNITY_URL=http://localhost:3000
SESSION_SECRET=your_secure_random_string_minimum_32_characters
```

### Step 4: Test the Flow

1. Start backend: `npm run dev`
2. Navigate to: `http://localhost:3001/auth/shopify/login`
3. You'll be redirected to Shopify login
4. Log in as a customer (not admin)
5. After authorization, you'll be redirected back with a session cookie

## 📡 API Endpoints

### Customer Account API OAuth

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/shopify/login` | GET | Redirects to Shopify for customer login |
| `/auth/shopify/callback` | GET | Handles OAuth callback, sets cookie |
| `/auth/me` | GET | Returns authenticated user from cookie |
| `/auth/logout` | POST | Clears session cookie |
| `/auth/refresh` | POST | Refreshes session token |

### Example Frontend Usage

```javascript
// Login
window.location.href = 'http://localhost:3001/auth/shopify/login?returnTo=/dashboard'

// Check auth status
const res = await fetch('http://localhost:3001/auth/me', {
  credentials: 'include'
})
const data = await res.json()
if (data.authenticated) {
  console.log('User:', data.user)
}

// Logout
await fetch('http://localhost:3001/auth/logout', {
  method: 'POST',
  credentials: 'include'
})
```

## 🔐 Security Features

✅ **CSRF Protection**: Random `state` parameter validated on callback  
✅ **OIDC Nonce**: Additional security layer  
✅ **HTTP-Only Cookies**: Prevents XSS attacks  
✅ **Secure Cookies**: HTTPS-only in production  
✅ **SameSite Protection**: CSRF mitigation  
✅ **State Expiry**: 10-minute expiration  
✅ **Token Expiry**: 7-day JWT expiration  

## 🔍 Key Differences from Admin API OAuth

| Feature | Admin API | Customer Account API |
|---------|-----------|---------------------|
| **Who** | Shop owners/admins | Customers |
| **Auth URL** | `/admin/oauth/authorize` | `/authentication/oauth/authorize` |
| **Token Endpoint** | `https://{shop}/admin/oauth/access_token` | `https://shopify.com/authentication/oauth/token` |
| **Data API** | Admin API REST | Customer Account API GraphQL |
| **Scopes** | `read_customers` | `openid email customer-account-api:full` |
| **Session** | JWT in query param | HTTP-only cookie |

## 📁 Files Created/Modified

### New Files
- `server/src/utils/customerAccountOAuth.ts`
- `server/src/utils/stateStore.ts`
- `server/src/services/customerAccountService.ts`
- `server/CUSTOMER_ACCOUNT_API_SETUP.md`

### Modified Files
- `server/src/controllers/authController.ts`
- `server/src/routes/auth.ts`
- `server/src/index.ts`
- `server/src/utils/jwt.ts`
- `server/.env`

## ⚠️ Important Notes

1. **Redirect URI Must Match**: `CALLBACK_URL` must exactly match Shopify app settings
2. **New Customer Accounts**: Must be enabled in Shopify settings
3. **HTTPS Required**: In production, Shopify requires HTTPS
4. **State Storage**: Currently in-memory; use Redis for production with multiple servers
5. **Cookie Domain**: Set correctly for subdomain sharing

## 🐛 Troubleshooting

- **"Invalid state"**: State expired or not stored (check stateStore)
- **"Token exchange failed"**: Verify credentials and callback URL
- **"Customer not found"**: Check scopes and customer accounts setting
- **Cookie not set**: Verify domain and HTTPS in production

## 📚 Documentation

- See `server/CUSTOMER_ACCOUNT_API_SETUP.md` for detailed setup instructions
- See `Shopify_Customer_Auth_Master_Plan.md` for the original master plan

## ✅ Next Steps

1. Install dependencies: `npm install @fastify/cookie jsonwebtoken`
2. Configure Shopify app with Customer Account API scopes
3. Enable "New customer accounts" in Shopify settings
4. Test the OAuth flow
5. Update frontend to use new endpoints (optional - backward compatible)

---

**Status**: ✅ Implementation Complete  
**Date**: 2026-01-27
