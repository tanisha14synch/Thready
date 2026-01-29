# Vercel Environment Variables Setup 🔧

## Problem
OAuth redirect URL me `localhost:3001` aa raha hai kyunki Vercel environment variables set nahi hain.

## Solution: Vercel Me Environment Variables Set Karein

### Step 1: Vercel Dashboard Me Jao

1. **Vercel Dashboard**: https://vercel.com/dashboard
2. **Your Project** (`thready-ruby`) → **Settings** → **Environment Variables**

### Step 2: Yeh Environment Variables Add Karein

**IMPORTANT**: Har variable ke liye **Production**, **Preview**, aur **Development** dono me add karein:

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

# Frontend URL
FRONTEND_URL=https://thready-ruby.vercel.app
COMMUNITY_URL=https://thready-ruby.vercel.app

# IMPORTANT: Callback URL (Vercel URL)
CALLBACK_URL=https://thready-ruby.vercel.app/auth/shopify/callback
SHOPIFY_REDIRECT_URI=https://thready-ruby.vercel.app/auth/shopify/callback

# Node Environment
NODE_ENV=production
VERCEL=1
```

### Step 3: Redeploy Karein

Environment variables add karne ke baad:
1. **Deployments** tab me jao
2. Latest deployment ke liye **"Redeploy"** click karein
3. Ya phir git push karein - Vercel automatically redeploy karega

---

## Important Notes

1. **All Environments**: Har variable ko **Production**, **Preview**, aur **Development** me add karein
2. **No Trailing Slash**: URLs me trailing slash mat add karein
3. **Exact Match**: Shopify app me exact same URL add karein jo `CALLBACK_URL` me hai

---

## Verification

Environment variables set karne ke baad:
1. Vercel me redeploy karein
2. Login flow test karein
3. OAuth URL me ab `https://thready-ruby.vercel.app/auth/shopify/callback` dikhna chahiye (localhost nahi)

---

**Iske baad OAuth redirect sahi URL par hoga!** ✅
