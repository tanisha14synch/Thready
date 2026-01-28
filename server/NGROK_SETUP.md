# Ngrok Setup Guide for Local Development

यह guide आपको ngrok के साथ local development setup करने में मदद करेगा।

## Step 1: Ngrok Install करें

```bash
# macOS
brew install ngrok

# या download करें: https://ngrok.com/download
```

## Step 2: Ngrok Account बनाएं (Free)

1. https://ngrok.com पर जाएं
2. Free account बनाएं
3. Auth token copy करें

## Step 3: Ngrok Configure करें

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

## Step 4: Backend Server Start करें

```bash
cd server
npm run dev
# Server port 3001 पर चलेगा
```

## Step 5: Ngrok Tunnel Start करें (Backend के लिए)

**Terminal 1** (Backend server):
```bash
cd server
npm run dev
```

**Terminal 2** (Ngrok for backend):
```bash
ngrok http 3001
```

आपको एक URL मिलेगा जैसे:
```
Forwarding: https://abc123xyz.ngrok-free.app -> http://localhost:3001
```

**इस URL को note करें!** (Example: `https://abc123xyz.ngrok-free.app`)

## Step 6: Frontend के लिए Ngrok (Optional)

अगर आप frontend भी ngrok पर host करना चाहते हैं:

**Terminal 3** (Frontend):
```bash
cd app
npm run dev
# Frontend port 3000 पर चलेगा
```

**Terminal 4** (Ngrok for frontend):
```bash
ngrok http 3000
```

Frontend ngrok URL: `https://def456uvw.ngrok-free.app`

## Step 7: `.env` File Update करें

`server/.env` file में ngrok URLs add करें:

```env
# Backend ngrok URL (Terminal 2 से मिला URL)
CALLBACK_URL=https://abc123xyz.ngrok-free.app/auth/shopify/callback
SHOPIFY_REDIRECT_URI=https://abc123xyz.ngrok-free.app/auth/shopify/callback

# Frontend ngrok URL (अगर frontend भी ngrok पर है)
FRONTEND_URL=https://def456uvw.ngrok-free.app
COMMUNITY_URL=https://def456uvw.ngrok-free.app
```

**Important:** Backend server restart करें:
```bash
# Terminal में Ctrl+C दबाएं और फिर:
npm run dev
```

## Step 8: Shopify App में Redirect URL Add करें

1. Shopify Partners Dashboard जाएं: https://partners.shopify.com/
2. Apps → Your App → App setup
3. **Allowed redirection URL(s)** में add करें:
   ```
   https://abc123xyz.ngrok-free.app/auth/shopify/callback
   ```
4. Save करें

## Step 9: Test करें

1. Frontend खोलें: `http://localhost:3000` या ngrok frontend URL
2. "Sign in with Shopify" button click करें
3. Shopify login page खुलेगा
4. Login करने के बाद callback सही तरह से काम करना चाहिए

## Troubleshooting

### Problem: "Redirect URI mismatch" error
**Solution:** 
- Shopify app settings में exact same URL add करें जो `.env` में है
- No trailing slash
- HTTPS use करें (ngrok automatically HTTPS provide करता है)

### Problem: Ngrok URL हर बार change होता है
**Solution:** 
- Free ngrok में URL change होता है
- Paid plan में static domain मिलता है
- या हर बार Shopify app में new URL add करें

### Problem: CORS errors
**Solution:**
- `.env` में `FRONTEND_URL` और `COMMUNITY_URL` सही set करें
- Backend server restart करें

## Quick Reference

```bash
# Backend start
cd server && npm run dev

# Ngrok for backend (new terminal)
ngrok http 3001

# Frontend start (optional)
cd app && npm run dev

# Ngrok for frontend (optional, new terminal)
ngrok http 3000
```

## Production vs Development

**Development (ngrok):**
```env
CALLBACK_URL=https://abc123xyz.ngrok-free.app/auth/shopify/callback
FRONTEND_URL=https://def456uvw.ngrok-free.app
```

**Production:**
```env
CALLBACK_URL=https://thebarwardrobe.com/auth/shopify/callback
FRONTEND_URL=https://thebarwardrobe.com
```
