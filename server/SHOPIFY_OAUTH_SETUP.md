# Shopify OAuth 2.0 Setup Guide

This guide explains how to set up and use the OAuth 2.0 Authorization Code Flow for your Shopify app.

## Overview

The OAuth 2.0 flow allows your app to:
1. Request permission from shop owners to access their customer data
2. Securely obtain an access token
3. Use the access token to fetch customer information via Shopify Admin API

## Prerequisites

1. **Shopify App Created**: You have a Shopify app in your Partner Dashboard
2. **Credentials**: You have your `SHOPIFY_CLIENT_ID` and `SHOPIFY_API_SECRET`
3. **Backend Running**: Your server is running on `http://localhost:3001`

## Step 1: Configure Shopify App Settings

1. Go to [Shopify Partner Dashboard](https://partners.shopify.com/)
2. Navigate to **Apps** → **Your App** → **App Setup**
3. Under **App URL**, set:
   - **Allowed redirection URL(s)**: `http://localhost:3001/auth/shopify/callback`
   - For production, use: `https://yourdomain.com/auth/shopify/callback`

4. Under **Admin API integration**, enable these scopes:
   - ✅ `read_customers`
   - ✅ `read_customer_tags`

5. **Save** your changes

## Step 2: Environment Variables

Make sure your `server/.env` file contains:

```env
SHOPIFY_CLIENT_ID=7e98895f9eb682f3bf2bcd7f7b5c67cf
SHOPIFY_API_SECRET=c176d6c703481b2c51994dab53a6e193
SHOPIFY_SHOP=thebarwardrobe.myshopify.com
SHOPIFY_REDIRECT_URI=http://localhost:3001/auth/shopify/callback
FRONTEND_URL=http://localhost:3000
PORT=3001
JWT_SECRET=supersecretjwtkey_change_in_production
```

## Step 3: OAuth Flow Endpoints

### 1. Initiate OAuth (`GET /auth/shopify/authorize`)

**Purpose**: Redirects the user to Shopify's authorization page.

**Usage**:
```
GET http://localhost:3001/auth/shopify/authorize?shop=thebarwardrobe.myshopify.com
```

**What happens**:
- User is redirected to Shopify
- User sees a permission request screen
- User clicks "Install app" or "Allow"
- Shopify redirects back to your callback URL

### 2. Handle Callback (`GET /auth/shopify/callback`)

**Purpose**: Receives the authorization code and exchanges it for an access token.

**This endpoint is called automatically by Shopify** - you don't need to call it directly.

**What happens**:
1. Shopify redirects to: `http://localhost:3001/auth/shopify/callback?code=...&shop=...&hmac=...`
2. Backend verifies HMAC signature
3. Exchanges code for access token
4. Fetches customer data
5. Creates/updates user in database
6. Generates JWT
7. Redirects to frontend: `http://localhost:3000/auth/callback?token=...`

## Step 4: Testing the OAuth Flow

### Option A: Direct Browser Test

1. Start your backend server:
   ```bash
   cd server
   npm run dev
   ```

2. Open browser and navigate to:
   ```
   http://localhost:3001/auth/shopify/authorize?shop=thebarwardrobe.myshopify.com
   ```

3. You'll be redirected to Shopify login
4. Log in with your shop owner/admin credentials
5. Authorize the app
6. You'll be redirected back to your frontend with a JWT token

### Option B: Frontend Integration

Add a "Connect with Shopify" button in your frontend:

```vue
<template>
  <button @click="connectShopify">
    Connect with Shopify
  </button>
</template>

<script setup>
const connectShopify = () => {
  const shop = 'thebarwardrobe.myshopify.com'
  window.location.href = `http://localhost:3001/auth/shopify/authorize?shop=${shop}`
}
</script>
```

## Step 5: Understanding the Flow

```
┌─────────┐                    ┌──────────┐                    ┌─────────┐
│ Browser │                    │ Shopify  │                    │ Backend │
└────┬────┘                    └────┬─────┘                    └────┬────┘
     │                               │                               │
     │ 1. GET /auth/shopify/authorize│                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
     │ 2. Redirect to Shopify OAuth  │                               │
     │<──────────────────────────────┤                               │
     │                               │                               │
     │ 3. User logs in & authorizes  │                               │
     │──────────────────────────────>│                               │
     │                               │                               │
     │ 4. Redirect with code         │                               │
     │<──────────────────────────────┤                               │
     │                               │                               │
     │ 5. GET /auth/shopify/callback?code=...&shop=...&hmac=...     │
     ├──────────────────────────────────────────────────────────────>│
     │                               │                               │
     │                               │ 6. Exchange code for token   │
     │                               │<──────────────────────────────┤
     │                               │                               │
     │                               │ 7. Return access_token        │
     │                               ├──────────────────────────────>│
     │                               │                               │
     │                               │ 8. Fetch customers            │
     │                               │<──────────────────────────────┤
     │                               │                               │
     │                               │ 9. Return customer data       │
     │                               ├──────────────────────────────>│
     │                               │                               │
     │ 10. Redirect to frontend with JWT                            │
     │<──────────────────────────────────────────────────────────────┤
```

## API Reference

### `generateAuthUrl(shop, scopes, state?)`

Generates the Shopify OAuth authorization URL.

**Parameters**:
- `shop`: Shop domain (e.g., "thebarwardrobe.myshopify.com")
- `scopes`: Array of permission scopes (default: ["read_customers", "read_customer_tags"])
- `state`: Optional state parameter for CSRF protection

**Returns**: Full Shopify OAuth authorization URL

### `exchangeCodeForToken(shop, code)`

Exchanges authorization code for access token.

**Parameters**:
- `shop`: Shop domain
- `code`: Authorization code from Shopify callback

**Returns**: `{ access_token, scope, shop }`

### `verifyShopifyHMAC(query)`

Verifies HMAC signature from Shopify callback.

**Parameters**:
- `query`: Query parameters from callback URL

**Returns**: `true` if valid, `false` otherwise

### `fetchCustomersWithToken(shop, accessToken, customerId?)`

Fetches customer data using OAuth access token.

**Parameters**:
- `shop`: Shop domain
- `accessToken`: OAuth access token
- `customerId`: Optional customer ID (if not provided, fetches all customers)

**Returns**: Customer object or array of customers

## Troubleshooting

### Error: "Invalid request signature"
- **Cause**: HMAC verification failed
- **Solution**: Check that `SHOPIFY_API_SECRET` matches your app's secret

### Error: "Failed to exchange code for token"
- **Cause**: Invalid authorization code or credentials
- **Solution**: 
  - Ensure code hasn't expired (codes expire quickly)
  - Verify `SHOPIFY_CLIENT_ID` and `SHOPIFY_API_SECRET` are correct
  - Check that redirect URI matches exactly in Shopify app settings

### Error: "Shop parameter is required"
- **Cause**: No shop parameter provided
- **Solution**: Include `?shop=yourstore.myshopify.com` in the authorize URL

### Error: "OAuth authorization failed"
- **Cause**: User denied permission or other OAuth error
- **Solution**: Check the `error` parameter in the callback for details

## Production Considerations

1. **HTTPS**: Use HTTPS in production (Shopify requires it)
2. **State Parameter**: Implement state parameter for CSRF protection
3. **Token Storage**: Consider encrypting access tokens if storing in database
4. **Token Refresh**: Implement token refresh if needed (Shopify tokens don't expire by default)
5. **Error Handling**: Add comprehensive error handling and logging
6. **Rate Limiting**: Implement rate limiting on OAuth endpoints

## Next Steps

After successful OAuth:
- User is authenticated with JWT
- User data is stored in database
- You can use the access token to fetch additional customer data
- Frontend receives JWT and can make authenticated API calls

## Support

For Shopify OAuth documentation:
- [Shopify OAuth Documentation](https://shopify.dev/docs/apps/auth/oauth)
- [Shopify Admin API](https://shopify.dev/docs/api/admin-rest)




