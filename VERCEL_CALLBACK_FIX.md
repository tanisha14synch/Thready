# Vercel Callback Fix Guide 🔧

## Problem
Login ke baad callback nahi ho raha kyunki:
- Frontend Vercel par hai (`https://thready-ruby.vercel.app/`)
- Backend abhi localhost:3001 par hai
- Shopify app me redirect URL backend URL hona chahiye, frontend URL nahi

## Solution: 3 Steps

### Step 1: Backend Railway Par Deploy Karein

1. **Railway Account**: https://railway.app (free account bana lein)

2. **New Project Create Karein**:
   - "New Project" → "Deploy from GitHub repo"
   - Apna repository select karein
   - **Root Directory**: `server` set karein

3. **Environment Variables Set Karein** (Railway → Variables tab):
   ```env
   # Database
   DATABASE_URL=postgresql://postgres.ejcrtccjiaoexwrshlmf:s4H##J7XDJq@hFv@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
   
   # Shopify
   SHOPIFY_CLIENT_ID=7e98895f9eb682f3bf2bcd7f7b5c67cf
   SHOPIFY_API_SECRET=c176d6c703481b2c51994dab53a6e193
   SHOPIFY_SHOP=thebarwardrobe.myshopify.com
   SHOPIFY_SHOP_DOMAIN=thebarwardrobe.myshopify.com
   SHOPIFY_SHOP_ID=71806648457
   
   # JWT Secrets
   JWT_SECRET=supersecretjwtkey_change_in_production
   SESSION_SECRET=supersecretjwtkey_change_in_production
   
   # Frontend URL (Vercel)
   FRONTEND_URL=https://thready-ruby.vercel.app
   COMMUNITY_URL=https://thready-ruby.vercel.app
   
   # IMPORTANT: Backend Callback URL (Railway URL - yeh automatically mil jayega deploy ke baad)
   CALLBACK_URL=https://YOUR-RAILWAY-APP.up.railway.app/auth/shopify/callback
   SHOPIFY_REDIRECT_URI=https://YOUR-RAILWAY-APP.up.railway.app/auth/shopify/callback
   
   # Port (Railway automatically set karta hai)
   PORT=3001
   NODE_ENV=production
   ```

4. **Railway URL Note Karein**: Deploy ke baad aapko URL milega jaise:
   ```
   https://your-app-name.up.railway.app
   ```
   **Is URL ko note karein!**

---

### Step 2: Vercel Me Environment Variable Add Karein

1. **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. **Add Karein**:
   - **Name**: `VITE_API_BASE`
   - **Value**: `https://YOUR-RAILWAY-APP.up.railway.app` (Step 1 se Railway URL)
   - **Environment**: Production ✅ (aur Preview agar chahiye)

3. **Redeploy Karein**: Vercel automatically redeploy karega, ya manually "Redeploy" button click karein

---

### Step 3: Shopify App Me Redirect URL Update Karein

**IMPORTANT**: Shopify app me sirf **BACKEND URL** add karein, frontend URL nahi!

1. **Shopify Partners Dashboard**: https://partners.shopify.com
2. **Apps** → Your App → **App setup**
3. **Customer Account API access scopes** enable karein:
   - ✅ `customer_read_customers`
   - ✅ `customer_read_orders`
4. **Allowed redirection URL(s)** me:
   - ❌ **REMOVE**: `https://thready-ruby.vercel.app/auth/shopify/callback` (agar hai to)
   - ✅ **ADD**: `https://YOUR-RAILWAY-APP.up.railway.app/auth/shopify/callback`
5. **Save** karein

---

## Flow Ab Kaise Kaam Karega

```
User clicks "Sign in with Shopify" on Vercel
  ↓
Frontend redirects to: https://YOUR-RAILWAY-APP.up.railway.app/auth/shopify/login
  ↓
Backend generates state/nonce and redirects to Shopify
  ↓
User logs in on Shopify
  ↓
Shopify redirects to: https://YOUR-RAILWAY-APP.up.railway.app/auth/shopify/callback?code=...&state=...
  ↓
Backend validates, exchanges code, creates session
  ↓
Backend redirects to: https://thready-ruby.vercel.app/auth/callback?token=...
  ↓
Frontend callback page processes token
  ↓
User logged in! ✅
```

---

## Quick Checklist

- [ ] Railway par backend deploy kiya
- [ ] Railway URL note kiya
- [ ] Railway environment variables set kiye (specially `CALLBACK_URL` aur `FRONTEND_URL`)
- [ ] Vercel me `VITE_API_BASE` environment variable add kiya (Railway URL)
- [ ] Vercel redeploy kiya
- [ ] Shopify app me redirect URL update kiya (sirf backend URL, frontend URL remove kiya)
- [ ] Test kiya - login flow kaam kar raha hai

---

## Troubleshooting

### Problem: "Redirect URI mismatch" error
**Solution**: 
- Shopify app settings me exact Railway URL add karein
- No trailing slash
- HTTPS use karein

### Problem: Callback nahi ho raha
**Solution**:
- Check karein Railway backend running hai
- Check karein `VITE_API_BASE` Vercel me set hai
- Check karein Shopify app me backend URL hai (frontend URL nahi)

### Problem: CORS errors
**Solution**:
- Backend me `FRONTEND_URL` aur `COMMUNITY_URL` Vercel URL set karein
- Railway backend restart karein

---

## Important Notes

1. **Shopify Redirect URL**: Sirf backend URL hona chahiye, frontend URL nahi
2. **Vercel Environment Variable**: `VITE_API_BASE` Railway backend URL hona chahiye
3. **Backend Environment Variables**: `FRONTEND_URL` Vercel URL hona chahiye
4. **Callback Flow**: Shopify → Backend → Frontend (yeh sequence follow karein)

---

**Iske baad login flow perfectly kaam karega!** 🎉
