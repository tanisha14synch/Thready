# Shopify OAuth – Deployment Checklist

Use this with the env variables you provided. The backend (Fastify) and frontend (Nuxt on Vercel) must both be deployed and configured.

---

## Backend (Fastify + Prisma + Supabase)

**Where to deploy:** Railway, Render, Fly.io, or any Node host. The backend must have a public URL (e.g. `https://your-app.up.railway.app`).

### Env variables (already in `server/.env`)

- `DATABASE_URL` – Supabase PostgreSQL connection string (full URL from Supabase dashboard)
- `SHOPIFY_CLIENT_ID` – from Shopify Partners
- `SHOPIFY_API_SECRET` – from Shopify Partners (client secret)
- `SHOPIFY_REDIRECT_URI` – **https://thready-ruby.vercel.app/auth/shopify/callback**
- `CALLBACK_URL` – same as above
- `SHOPIFY_SHOP` / `SHOPIFY_SHOP_DOMAIN` – **thebarwardrobe.myshopify.com**
- `JWT_SECRET` – strong secret for signing JWTs
- `FRONTEND_URL` / `COMMUNITY_URL` – **https://thready-ruby.vercel.app**

### After deploy

1. Run migrations: `cd server && npx prisma migrate deploy`
2. Generate client (if not in build): `npx prisma generate`
3. Set **CORS**: backend already uses `origin: process.env.FRONTEND_URL` so the frontend URL is allowed.

---

## Frontend (Nuxt on Vercel)

**URL:** https://thready-ruby.vercel.app

### Env variables (in Vercel Project Settings → Environment Variables)

| Variable | Value | Notes |
|----------|--------|--------|
| `NUXT_PUBLIC_API_BASE` | **Your backend URL** | e.g. `https://your-app.up.railway.app` – required for login and API calls |
| `NUXT_PUBLIC_SHOPIFY_SHOP` | `thebarwardrobe.myshopify.com` | Optional; used for “Log in with Shopify” link |

Without `NUXT_PUBLIC_API_BASE`, the app will call `http://localhost:3001` and login will fail in production.

---

## Shopify Partners

1. Open your app → **App setup** → **URLs**.
2. **Allowed redirection URL(s):** add exactly  
   **https://thready-ruby.vercel.app/auth/shopify/callback**

---

## Flow check

1. User clicks **Log in with Shopify** → browser goes to `{BACKEND_URL}/auth?shop=thebarwardrobe.myshopify.com`.
2. Backend redirects to Shopify OAuth.
3. User approves → Shopify redirects to **https://thready-ruby.vercel.app/auth/shopify/callback?code=...&shop=...&hmac=...&state=...**
4. Nuxt callback page calls backend **POST {BACKEND_URL}/auth/exchange** with `code`, `shop`, `hmac`, `state`.
5. Backend verifies HMAC/state, exchanges code for token, stores Shop in Supabase, returns JWT.
6. Frontend stores JWT in localStorage and redirects to `/`.

---

## If something is missing

- **Backend URL:** Deploy the `server/` app, then set `NUXT_PUBLIC_API_BASE` in Vercel to that URL.
- **DATABASE_URL:** Use the full connection string from Supabase (Project Settings → Database). If the password contains `#` or `@`, URL-encode them (`#` → `%23`, `@` → `%40`).
