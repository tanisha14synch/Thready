# Shopify OAuth 2.0 Example

This directory contains a standalone example demonstrating the complete Shopify OAuth 2.0 Authorization Code Flow.

## Files

- `shopify-oauth-example.js` - Complete OAuth 2.0 implementation with Express.js
- `README.md` - This file

## Quick Start

### Option 1: Run as Standalone Example (Express.js)

1. **Install Express** (if not already installed):
   ```bash
   cd server
   npm install express
   ```

2. **Update configuration** in `shopify-oauth-example.js`:
   - Replace `{API_KEY}` with your `SHOPIFY_CLIENT_ID`
   - Replace `{API_SECRET}` with your `SHOPIFY_API_SECRET`
   - Replace `{SHOP_NAME}` with your shop domain
   - Update `{REDIRECT_URI}` if needed

3. **Run the example**:
   ```bash
   node examples/shopify-oauth-example.js
   ```

4. **Test the flow**:
   - Open: `http://localhost:3001/auth/shopify/authorize?shop=thebarwardrobe.myshopify.com`
   - Log in to Shopify
   - Authorize the app
   - See the results!

### Option 2: Use with Your Existing Fastify Server

The OAuth implementation is already integrated into your Fastify server:

1. **Use the existing endpoints**:
   - `GET /auth/shopify/authorize?shop=thebarwardrobe.myshopify.com`
   - `GET /auth/shopify/callback` (handled automatically by Shopify)

2. **The implementation is in**:
   - `server/src/utils/shopifyOAuth.ts` - OAuth utilities
   - `server/src/routes/auth.ts` - OAuth routes

## Configuration

Make sure your `.env` file has:

```env
SHOPIFY_CLIENT_ID=7e98895f9eb682f3bf2bcd7f7b5c67cf
SHOPIFY_API_SECRET=c176d6c703481b2c51994dab53a6e193
SHOPIFY_SHOP=thebarwardrobe.myshopify.com
SHOPIFY_REDIRECT_URI=http://localhost:3001/auth/shopify/callback
```

## OAuth Flow Steps

1. **User clicks "Connect with Shopify"** → Redirects to `/auth/shopify/authorize`
2. **Backend generates authorization URL** → Redirects user to Shopify
3. **User logs in and authorizes** → Shopify redirects back with code
4. **Backend exchanges code for token** → Gets access token
5. **Backend fetches customer data** → Uses access token to call Shopify API
6. **Backend creates/updates user** → Stores in database
7. **Backend generates JWT** → Redirects to frontend with token

## What the Example Does

The example script demonstrates:

- ✅ Generating Shopify OAuth authorization URLs
- ✅ Verifying HMAC signatures for security
- ✅ Exchanging authorization codes for access tokens
- ✅ Fetching customer data using access tokens
- ✅ Complete error handling and logging

## Differences from Production

The example is simplified for learning. In production, you should:

- Store access tokens securely (encrypted)
- Implement token refresh if needed
- Add CSRF protection with state parameter
- Use HTTPS (required by Shopify)
- Add comprehensive error handling
- Implement rate limiting
- Add logging and monitoring

## Next Steps

After understanding the OAuth flow:

1. Integrate with your existing Fastify server (already done!)
2. Connect to your database to store user data
3. Generate JWT tokens for your app
4. Redirect to your frontend with authentication

## Documentation

See `../SHOPIFY_OAUTH_SETUP.md` for detailed setup instructions.

