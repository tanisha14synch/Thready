# Vercel Backend Deployment Guide 🚀

## Overview
Yeh guide aapko backend ko Vercel par deploy karne me help karega. Aapka pura project (frontend + backend) ab Vercel par hosted hoga.

## Step 1: Vercel Me Separate Project Banana Backend Ke Liye

### Option A: Monorepo Setup (Recommended)

1. **Vercel Dashboard** → **Add New Project**
2. **Import Git Repository** → Apna repository select karein
3. **Root Directory** set karein: `server`
4. **Framework Preset**: Other
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist` (ya leave empty)
7. **Install Command**: `npm install`
8. **Deploy**

### Option B: Separate Repository (Alternative)

Agar aap separate repository banana chahte hain backend ke liye, to:
1. `server` folder ko separate repository me push karein
2. Vercel me new project create karein
3. Us repository ko connect karein

---

## Step 2: Vercel Environment Variables Set Karein

Backend project me **Settings** → **Environment Variables** me yeh add karein:

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres.ejcrtccjiaoexwrshlmf:s4H##J7XDJq@hFv@aws-1-ap-south-1.pooler.supabase.com:5432/postgres

# Shopify Credentials
SHOPIFY_CLIENT_ID=7e98895f9eb682f3bf2bcd7f7b5c67cf
SHOPIFY_API_SECRET=c176d6c703481b2c51994dab53a6e193
SHOPIFY_SHOP=thebarwardrobe.myshopify.com
SHOPIFY_SHOP_DOMAIN=thebarwardrobe.myshopify.com
SHOPIFY_SHOP_ID=71806648457

# JWT Secrets
JWT_SECRET=supersecretjwtkey_change_in_production
SESSION_SECRET=supersecretjwtkey_change_in_production

# Frontend URL (Vercel Frontend Project)
FRONTEND_URL=https://thready-ruby.vercel.app
COMMUNITY_URL=https://thready-ruby.vercel.app

# IMPORTANT: Backend Callback URL (Vercel Backend URL - deploy ke baad mil jayega)
CALLBACK_URL=https://YOUR-BACKEND-PROJECT.vercel.app/auth/shopify/callback
SHOPIFY_REDIRECT_URI=https://YOUR-BACKEND-PROJECT.vercel.app/auth/shopify/callback

# Node Environment
NODE_ENV=production
VERCEL=1
```

**Note**: `YOUR-BACKEND-PROJECT.vercel.app` ko apne actual Vercel backend URL se replace karein (deploy ke baad mil jayega).

---

## Step 3: Frontend Vercel Project Me Environment Variable Update Karein

Frontend project (`thready-ruby`) me **Settings** → **Environment Variables**:

1. **Add/Update**:
   - **Name**: `VITE_API_BASE`
   - **Value**: `https://YOUR-BACKEND-PROJECT.vercel.app` (backend Vercel URL)
   - **Environment**: Production ✅

2. **Redeploy** frontend project

---

## Step 4: Shopify App Me Redirect URL Update Karein

1. **Shopify Partners Dashboard**: https://partners.shopify.com
2. **Apps** → Your App → **App setup**
3. **Customer Account API access scopes** enable karein
4. **Allowed redirection URL(s)** me:
   - ❌ **REMOVE**: Frontend Vercel URL (agar hai to)
   - ❌ **REMOVE**: localhost URLs (agar hai to)
   - ✅ **ADD**: `https://YOUR-BACKEND-PROJECT.vercel.app/auth/shopify/callback`
5. **Save**

---

## Step 5: Deploy & Test

1. **Backend Deploy**: Vercel automatically deploy karega
2. **Backend URL Note Karein**: Deploy ke baad URL mil jayega
3. **Environment Variables Update Karein**: Backend URL ke according
4. **Frontend Redeploy**: `VITE_API_BASE` update ke baad
5. **Test**: Login flow test karein

---

## File Structure

```
Thready/
├── app/                    # Frontend (Nuxt) - Vercel Project 1
├── server/                 # Backend (Fastify) - Vercel Project 2
│   ├── api/
│   │   └── index.ts       # Vercel serverless handler
│   ├── src/
│   │   ├── server.ts      # Fastify server export
│   │   └── index.ts        # Local dev entry
│   └── vercel.json         # Vercel config
└── package.json            # Root (frontend)
```

---

## Flow

```
User clicks "Sign in with Shopify" on Frontend (Vercel)
  ↓
Frontend redirects to: https://YOUR-BACKEND-PROJECT.vercel.app/auth/shopify/login
  ↓
Backend generates state/nonce and redirects to Shopify
  ↓
User logs in on Shopify
  ↓
Shopify redirects to: https://YOUR-BACKEND-PROJECT.vercel.app/auth/shopify/callback
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

## Important Notes

1. **Two Vercel Projects**: Frontend aur backend dono alag projects honge
2. **Backend URL**: Shopify app me sirf backend URL add karein
3. **Frontend URL**: Backend environment variables me frontend URL set karein
4. **CORS**: Backend me `FRONTEND_URL` set karna zaroori hai
5. **Cookies**: Vercel me cookies kaam karte hain, domain properly set karein

---

## Troubleshooting

### Problem: "Function not found" error
**Solution**: 
- Check karein `vercel.json` me correct path hai
- Check karein `api/index.ts` file exist karti hai

### Problem: Prisma errors
**Solution**:
- Check karein `postinstall` script Prisma generate kar rahi hai
- Check karein `DATABASE_URL` correctly set hai

### Problem: Callback redirect nahi ho raha
**Solution**:
- Check karein Shopify app me backend URL hai
- Check karein backend environment variables me `FRONTEND_URL` set hai
- Check karein frontend me `VITE_API_BASE` set hai

---

## Quick Checklist

- [ ] Backend Vercel project create kiya (Root Directory: `server`)
- [ ] Backend environment variables set kiye
- [ ] Backend deploy kiya aur URL note kiya
- [ ] Frontend me `VITE_API_BASE` update kiya
- [ ] Frontend redeploy kiya
- [ ] Shopify app me redirect URL update kiya (backend URL)
- [ ] Test kiya - login flow kaam kar raha hai

---

**Iske baad dono projects Vercel par successfully deploy ho jayengi!** 🎉
