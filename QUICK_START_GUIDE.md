# Quick Start Guide - Customer Account API OAuth ✅

## ✅ Your Credentials Are Configured

Your Shopify credentials are already set in `server/.env`:
- **Client ID**: `7e98895f9eb682f3bf2bcd7f7b5c67cf`
- **Secret**: `c176d6c703481b2c51994dab53a6e193`
- **Shop Domain**: `thebarwardrobe.myshopify.com`

## 🚀 Next Steps to Enable Customer Login

### Step 1: Configure Shopify App Settings

1. **Go to Shopify Admin**:
   - Navigate to: **Settings → Apps and sales channels → Develop apps**
   - Select your app (or create a new one)

2. **Enable Customer Account API Scopes**:
   - Go to **Configuration** tab
   - Scroll to **"Customer Account API access scopes"**
   - Enable these scopes:
     - ✅ `customer_read_customers` - Read customer data
     - ✅ `customer_read_orders` - Read order history
     - ✅ `customer_read_customer_merge` - (optional) Merged customer data

3. **Set Redirect URI**:
   - Under **"Allowed redirection URL(s)"**, add:
     ```
     http://localhost:3001/auth/shopify/callback
     ```
   - **Important**: This must match exactly (no trailing slash)

4. **Enable New Customer Accounts**:
   - Go to **Settings → Customer accounts**
   - Select **"New customer accounts"** (NOT Classic)
   - Save changes

### Step 2: Start Your Backend Server

```bash
cd server
npm run dev
```

The server will start on `http://localhost:3001`

### Step 3: Test Customer Login

**Option A: Direct Browser**
```
http://localhost:3001/auth/shopify/login
```

**Option B: With Return URL**
```
http://localhost:3001/auth/shopify/login?returnTo=/dashboard
```

**What happens:**
1. You'll be redirected to Shopify login page
2. Log in with a **customer account** (not admin)
3. Authorize the app
4. You'll be redirected back to your app with a session cookie set

### Step 4: Check Authentication Status

```javascript
// In your frontend or browser console
fetch('http://localhost:3001/auth/me', {
  credentials: 'include' // Important: include cookies
})
  .then(res => res.json())
  .then(data => {
    if (data.authenticated) {
      console.log('Logged in as:', data.user)
    } else {
      console.log('Not authenticated')
    }
  })
```

## 📡 Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/shopify/login` | GET | Redirects to Shopify for customer login |
| `/auth/shopify/callback` | GET | Handles OAuth callback (automatic) |
| `/auth/me` | GET | Returns current authenticated user |
| `/auth/logout` | POST | Logs out user |
| `/auth/refresh` | POST | Refreshes session token |

## 🔍 Verify Your Setup

### Check 1: Environment Variables
```bash
cd server
cat .env | grep SHOPIFY
```

Should show:
- `SHOPIFY_CLIENT_ID=7e98895f9eb682f3bf2bcd7f7b5c67cf`
- `SHOPIFY_API_SECRET=c176d6c703481b2c51994dab53a6e193`
- `SHOPIFY_SHOP=thebarwardrobe.myshopify.com`

### Check 2: Dependencies Installed
```bash
cd server
npm list @fastify/cookie jsonwebtoken
```

Should show both packages installed.

### Check 3: Server Running
```bash
curl http://localhost:3001/
```

Should return: `{"hello":"world"}`

## ⚠️ Common Issues

### "Invalid redirect_uri"
- **Fix**: Make sure the redirect URI in Shopify app settings **exactly matches** `http://localhost:3001/auth/shopify/callback`
- No trailing slash, exact protocol (http vs https)

### "Customer Account API scopes not enabled"
- **Fix**: Go to Shopify app → Configuration → Enable Customer Account API scopes
- Make sure "New customer accounts" is enabled in Settings → Customer accounts

### "State parameter expired"
- **Fix**: Complete the OAuth flow within 10 minutes
- If testing, try the flow again

### Cookie not set
- **Fix**: Make sure you're using `credentials: 'include'` in fetch requests
- Check browser dev tools → Application → Cookies
- In production, ensure HTTPS is enabled

## 📚 Documentation

- **Detailed Setup**: See `server/CUSTOMER_ACCOUNT_API_SETUP.md`
- **Implementation Summary**: See `CUSTOMER_ACCOUNT_API_IMPLEMENTATION_SUMMARY.md`
- **Master Plan**: See `Shopify_Customer_Auth_Master_Plan.md`

## ✅ Ready to Test!

Your backend is configured and ready. Just:
1. Configure Shopify app settings (Step 1 above)
2. Start the server: `npm run dev`
3. Visit: `http://localhost:3001/auth/shopify/login`

Happy testing! 🎉
