# Vercel Nuxt + Backend Setup Guide 🚀

## Overview
Aapka pura project (frontend + backend) ek hi Vercel project me deploy hoga. Nuxt automatically backend routes ko handle karega.

## Important: Folder Structure

```
Thready/
├── app/                    # Nuxt frontend pages
├── server/                 # Fastify backend + Nuxt server API routes
│   ├── api/               # Nuxt server API routes (Vercel me deploy hoga)
│   │   └── [...].ts       # All backend routes handler
│   ├── src/               # Fastify backend code
│   │   ├── server.ts      # Fastify server export
│   │   ├── routes/        # Fastify routes
│   │   └── controllers/   # Controllers
│   └── prisma/            # Prisma schema
├── nuxt.config.ts         # Nuxt configuration
└── package.json           # Root package.json
```

## Step 1: Vercel Environment Variables Set Karein

Vercel project me **Settings** → **Environment Variables** me yeh add karein:

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

# Frontend URL (Vercel URL - same as backend)
FRONTEND_URL=https://thready-ruby.vercel.app
COMMUNITY_URL=https://thready-ruby.vercel.app

# IMPORTANT: Callback URL (Vercel URL - same project)
CALLBACK_URL=https://thready-ruby.vercel.app/auth/shopify/callback
SHOPIFY_REDIRECT_URI=https://thready-ruby.vercel.app/auth/shopify/callback

# Node Environment
NODE_ENV=production
```

---

## Step 2: Root package.json Me Backend Dependencies Add Karein

Root `package.json` me backend dependencies add karein taaki Nuxt server API routes kaam karein:

```json
{
  "dependencies": {
    // ... existing dependencies ...
    "@fastify/cookie": "^11.0.2",
    "@fastify/cors": "^11.2.0",
    "@prisma/adapter-pg": "^7.3.0",
    "@prisma/client": "^7.3.0",
    "pg": "^8.13.0",
    "dotenv": "^17.2.3",
    "fastify": "^5.6.2",
    "fastify-plugin": "^5.1.0"
  },
  "devDependencies": {
    // ... existing devDependencies ...
    "prisma": "^7.3.0",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3"
  }
}
```

---

## Step 3: Shopify App Me Redirect URL Update Karein

1. **Shopify Partners Dashboard**: https://partners.shopify.com
2. **Apps** → Your App → **App setup**
3. **Customer Account API access scopes** enable karein
4. **Allowed redirection URL(s)** me:
   - ✅ **ADD**: `https://thready-ruby.vercel.app/auth/shopify/callback`
   - ❌ **REMOVE**: localhost URLs (agar hai to)
5. **Save**

---

## Step 4: Frontend Environment Variables

Frontend me `VITE_API_BASE` set karein (optional, kyunki same domain par hai):

**Vercel** → **Settings** → **Environment Variables**:
- **Name**: `VITE_API_BASE`
- **Value**: `https://thready-ruby.vercel.app` (ya leave empty for relative URLs)
- **Environment**: Production ✅

---

## How It Works

### Local Development:
- Frontend: `http://localhost:3000` (Nuxt dev server)
- Backend: `http://localhost:3001` (Fastify server - separate)

### Production (Vercel):
- Frontend: `https://thready-ruby.vercel.app` (Nuxt)
- Backend: `https://thready-ruby.vercel.app/api/*` (Nuxt server API routes)
- Callback: `https://thready-ruby.vercel.app/auth/shopify/callback`

### Flow:
```
User clicks "Sign in with Shopify"
  ↓
Frontend redirects to: /auth/shopify/login (same domain)
  ↓
Nuxt server API route handles request → Fastify server
  ↓
Backend redirects to Shopify
  ↓
Shopify redirects to: /auth/shopify/callback (same domain)
  ↓
Nuxt server API route handles callback → Fastify server
  ↓
Backend redirects to: /auth/callback?token=... (frontend page)
  ↓
User logged in! ✅
```

---

## Important Notes

1. **Same Domain**: Frontend aur backend dono same Vercel URL par honge
2. **Nuxt Server API Routes**: `server/api/[...].ts` file sab backend routes handle karegi
3. **Fastify Server**: Backend logic Fastify server me hai, Nuxt routes usko use karti hain
4. **Callback URL**: Shopify me Vercel URL add karein (`https://thready-ruby.vercel.app/auth/shopify/callback`)

---

## Quick Checklist

- [ ] Vercel environment variables set kiye (specially `CALLBACK_URL`)
- [ ] Root `package.json` me backend dependencies add kiye
- [ ] Shopify app me redirect URL update kiya (`https://thready-ruby.vercel.app/auth/shopify/callback`)
- [ ] Deploy kiya aur test kiya

---

**Iske baad sab kuch same Vercel project me kaam karega!** 🎉
