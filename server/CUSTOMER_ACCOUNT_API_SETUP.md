# Customer Account API OAuth Implementation ✅

This document explains the **Customer Account API OAuth 2.0** implementation according to the master plan. This is different from Admin API OAuth - it's specifically designed for **customer authentication**.

## 🎯 What Changed

### Previous Implementation (Admin API OAuth)
- Used `/admin/oauth/authorize` endpoint
- Required shop owner/admin authentication
- Used Admin API to fetch customer data

### New Implementation (Customer Account API OAuth)
- Uses `/authentication/oauth/authorize` endpoint
- Designed for **customer** authentication
- Uses Customer Account API GraphQL to fetch customer data
- Includes CSRF protection with `state` and `nonce`
- Uses HTTP-only cookies for session management

## 📋 Setup Instructions

### Step 1: Configure Shopify App

1. Go to [Shopify Admin](https://admin.shopify.com/)
2. Navigate to **Settings → Apps and sales channels → Develop apps**
3. Select your app (or create a new one)
4. Go to **Configuration** tab
5. Under **Customer Account API access scopes**, enable:
   - ✅ `customer_read_customers` - Read customer data
   - ✅ `customer_read_orders` - Read order history
   - ✅ `customer_read_customer_merge` - (optional) Merged customer data

6. Set **Allowed redirection URL(s)**:
   ```
   http://localhost:3001/auth/shopify/callback
   ```
   (For production, use your actual domain)

7. **Enable New Customer Accounts**:
   - Go to **Settings → Customer accounts**
   - Select **"New customer accounts"** (NOT Classic)
   - This enables the Customer Account API authentication flow

### Step 2: Install Dependencies

```bash
cd server
npm install @fastify/cookie jsonwebtoken
```

### Step 3: Update Environment Variables

Your `.env` file should include:

```env
# Shopify App Credentials
SHOPIFY_CLIENT_ID=your_client_id_here
SHOPIFY_API_SECRET=your_client_secret_here

# Shopify Shop Domain
SHOPIFY_SHOP=thebarwardrobe.myshopify.com
SHOPIFY_SHOP_DOMAIN=thebarwardrobe.myshopify.com

# Customer Account API OAuth callback URL
CALLBACK_URL=http://localhost:3001/auth/shopify/callback

# Community URL (for cookie domain and redirects)
COMMUNITY_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Session secret for cookie signing
SESSION_SECRET=your_secure_random_string_minimum_32_characters

# JWT Secret
JWT_SECRET=your_jwt_secret_minimum_32_characters

# Backend Port
PORT=3001
```

### Step 4: Test the Flow

1. **Start your backend server**:
   ```bash
   cd server
   npm run dev
   ```

2. **Navigate to login endpoint**:
   ```
   http://localhost:3001/auth/shopify/login
   ```

3. **You'll be redirected to Shopify login page**

4. **Log in with a customer account** (not admin)

5. **After authorization, you'll be redirected back** to your app with a session cookie set

## 🔄 OAuth Flow

```
User → GET /auth/shopify/login
  ↓
Backend generates state & nonce
  ↓
Redirect to: https://{shop}.myshopify.com/authentication/oauth/authorize
  ↓
User logs in on Shopify
  ↓
Shopify redirects to: /auth/shopify/callback?code=...&state=...
  ↓
Backend validates state (CSRF protection)
  ↓
Backend exchanges code for token at: https://shopify.com/authentication/oauth/token
  ↓
Backend fetches customer profile via Customer Account API GraphQL
  ↓
Backend creates/updates user in database
  ↓
Backend sets HTTP-only session cookie
  ↓
Backend redirects to frontend with token (for backward compatibility)
```

## 📡 API Endpoints

### Customer Account API OAuth Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/shopify/login` | GET | Initiates OAuth flow, redirects to Shopify |
| `/auth/shopify/callback` | GET | Handles OAuth callback, sets session cookie |
| `/auth/me` | GET | Returns current authenticated user from cookie |
| `/auth/logout` | POST | Clears session cookie |
| `/auth/refresh` | POST | Refreshes session token |

### Example Usage

**Login**:
```javascript
// Redirect user to login
window.location.href = 'http://localhost:3001/auth/shopify/login?returnTo=/dashboard'
```

**Check Authentication**:
```javascript
// Fetch current user
const response = await fetch('http://localhost:3001/auth/me', {
  credentials: 'include' // Important: include cookies
})
const data = await response.json()
if (data.authenticated) {
  console.log('User:', data.user)
}
```

**Logout**:
```javascript
await fetch('http://localhost:3001/auth/logout', {
  method: 'POST',
  credentials: 'include'
})
```

## 🔐 Security Features

✅ **CSRF Protection**: Random `state` parameter validated on callback  
✅ **OIDC Nonce**: Additional security with `nonce` parameter  
✅ **HTTP-Only Cookies**: Session tokens stored in HTTP-only cookies (prevents XSS)  
✅ **Secure Cookies**: Cookies marked as `secure` in production (HTTPS only)  
✅ **SameSite Protection**: Cookies set with `sameSite: 'lax'` (CSRF protection)  
✅ **State Expiry**: States expire after 10 minutes  
✅ **Token Expiry**: JWT tokens expire after 7 days  

## 📁 File Structure

```
server/
├── src/
│   ├── controllers/
│   │   └── authController.ts          # Updated with Customer Account API flow
│   ├── routes/
│   │   └── auth.ts                    # Updated routes
│   ├── utils/
│   │   ├── customerAccountOAuth.ts    # NEW: Customer Account API utilities
│   │   ├── stateStore.ts             # NEW: State management for CSRF
│   │   └── jwt.ts                    # Updated with session JWT support
│   ├── services/
│   │   └── customerAccountService.ts  # NEW: Customer Account service layer
│   └── index.ts                      # Updated with cookie plugin
└── .env                              # Updated environment variables
```

## 🔍 Key Differences from Admin API OAuth

| Feature | Admin API OAuth | Customer Account API OAuth |
|---------|----------------|---------------------------|
| **Endpoint** | `/admin/oauth/authorize` | `/authentication/oauth/authorize` |
| **Token Exchange** | `https://{shop}/admin/oauth/access_token` | `https://shopify.com/authentication/oauth/token` |
| **Customer Data** | Admin API REST | Customer Account API GraphQL |
| **Who Can Auth** | Shop owners/admins | Customers |
| **Scopes** | `read_customers`, `read_customer_tags` | `openid email customer-account-api:full` |
| **Session** | JWT in query param | HTTP-only cookie + JWT |

## ⚠️ Important Notes

1. **Redirect URI Must Match Exactly**: The `CALLBACK_URL` in your `.env` must **exactly match** what's configured in Shopify app settings (no trailing slashes, exact protocol)

2. **New Customer Accounts Required**: Your Shopify store must have **"New customer accounts"** enabled (not Classic)

3. **HTTPS in Production**: Shopify requires HTTPS in production. Use a service like ngrok for local testing, or deploy to a server with SSL

4. **Cookie Domain**: Cookies are set for the root domain (e.g., `.yourdomain.com`) to work across subdomains

5. **State Management**: Currently uses in-memory storage. For production with multiple servers, use Redis or a database

## 🐛 Troubleshooting

### "Invalid state parameter"
- State expired (10 minutes) or wasn't stored correctly
- Check `stateStore.ts` implementation
- In production, ensure state storage is shared across servers

### "Token exchange failed"
- Verify `SHOPIFY_CLIENT_ID` and `SHOPIFY_API_SECRET`
- Check `CALLBACK_URL` matches exactly in Shopify settings
- Authorization code expires quickly - user must complete flow promptly

### "Customer not found" or GraphQL errors
- Verify Customer Account API scopes are enabled in Shopify app
- Confirm "New customer accounts" setting is active
- Check that user is logging in as a customer (not admin)

### Cookie not set
- Check browser dev tools → Application → Cookies
- Verify `COMMUNITY_URL` or `FRONTEND_URL` is set correctly
- In production, ensure HTTPS is used (cookies require HTTPS with `secure: true`)

## 📚 References

- [Shopify Customer Account API Documentation](https://shopify.dev/docs/api/customer)
- [OAuth 2.0 for Customer Accounts](https://shopify.dev/docs/apps/auth/customer-accounts)
- [Master Plan Document](./Shopify_Customer_Auth_Master_Plan.md)
