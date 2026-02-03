# Shopify OAuth – Deployment Checklist

Use this with the env variables you provided. The backend (Fastify) and frontend (Nuxt on Vercel) must both be deployed and configured.

**Fixed callback URL (use everywhere):** `https://thready-ruby.vercel.app/auth/shopify/callback`

---

## Audit summary (what was wrong and what was fixed)

- **Hardcoded Shopify login URLs:** None in the frontend. The frontend uses same-origin `/auth/shopify`; only Nitro server routes build the Shopify URL (shopify.com/authentication/.../login). Building that URL on the server is correct.
- **runtimeConfig.public.shopifyLoginUrl:** Not used and not defined. We do not expose a public Shopify login URL; the frontend must never point directly at Shopify.
- **redirect_uri pointing to shopify.com:** If redirect_uri were set to Shopify’s own callback (e.g. shopify.com/.../account/callback), users would land on Shopify after login and stay there. We use `runtimeConfig.private.shopifyRedirectUri = https://thready-ruby.vercel.app/auth/shopify/callback` everywhere so Shopify sends users back to our Nitro callback, which then redirects to /profile.

---

## Auth flow (Nitro)

Login flow must be:

**Frontend → /auth/shopify → Shopify Login → /auth/shopify/callback → /profile**

1. User clicks **Log in with Shopify** → browser goes to **same-origin** `/auth/shopify?shop=thebarwardrobe.myshopify.com` (Nitro route).
2. Nitro builds the Shopify Customer Account login URL (with `redirect_uri = https://thready-ruby.vercel.app/auth/shopify/callback`) and redirects 302 to Shopify.
3. User logs in on Shopify → Shopify redirects to **https://thready-ruby.vercel.app/auth/shopify/callback?code=...&state=...**
4. Nitro callback exchanges the code for tokens, signs a JWT, redirects 302 to `/auth/callback?token=...`
5. Vue page `/auth/callback` stores the token and redirects to **/profile**.

No hardcoded Shopify URLs in the frontend; redirect_uri is always our app’s callback so users are not stuck on shopify.com/.../account/callback.

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
| `NUXT_PUBLIC_API_BASE` | **Your backend URL** | e.g. `https://your-app.up.railway.app` – required for /auth/me and API calls |
| `NUXT_PUBLIC_SHOPIFY_SHOP` | `thebarwardrobe.myshopify.com` | Optional; used for “Log in with Shopify” link (shop query param) |
| `SHOPIFY_CLIENT_ID` | From Shopify Partners | Required for Nitro /auth/shopify and /auth/shopify/callback |
| `SHOPIFY_API_SECRET` | From Shopify Partners | Required for Nitro callback (token exchange) |
| `SHOPIFY_SHOP_ID` | Shop’s numeric ID | Required for Shopify Customer Account login URL |
| `SHOPIFY_REDIRECT_URI` | **https://thready-ruby.vercel.app/auth/shopify/callback** | Must match Shopify Partners “Allowed redirection URL(s)” |
| `JWT_SECRET` | Strong secret | Required for Nitro callback (signing JWT) |

Without `NUXT_PUBLIC_API_BASE`, the app will call `http://localhost:3001` and /auth/me will fail in production.

---

## Shopify Partners

1. Open your app → **App setup** → **URLs**.
2. **Allowed redirection URL(s):** add exactly  
   **https://thready-ruby.vercel.app/auth/shopify/callback**

---

## Verification checklist

- **URLs to test in browser**
  - Open https://thready-ruby.vercel.app → click **Log in with Shopify**.
  - You should be redirected to Shopify login, then after login to **https://thready-ruby.vercel.app/auth/shopify/callback** (briefly), then to **/auth/callback**, then to **/profile**.
  - You must not land on shopify.com/.../account/callback and stay there.

- **Shopify Partners settings**
  - **Allowed redirection URL(s)** must include exactly: `https://thready-ruby.vercel.app/auth/shopify/callback`.
  - No trailing slash; protocol and host must match your deployed app.

- **Environment variables**
  - **Vercel (Nuxt):** `SHOPIFY_CLIENT_ID`, `SHOPIFY_API_SECRET`, `SHOPIFY_SHOP_ID`, `SHOPIFY_REDIRECT_URI` (= fixed callback URL), `JWT_SECRET`, `NUXT_PUBLIC_API_BASE`, optionally `NUXT_PUBLIC_SHOPIFY_SHOP`.
  - **Backend (if used for /auth/me):** `SHOPIFY_REDIRECT_URI`, `SHOPIFY_CLIENT_ID`, `SHOPIFY_API_SECRET`, `JWT_SECRET`, `FRONTEND_URL`.

---

## If something is missing

- **Backend URL:** Deploy the `server/` app, then set `NUXT_PUBLIC_API_BASE` in Vercel to that URL.
- **DATABASE_URL:** Use the full connection string from Supabase (Project Settings → Database). If the password contains `#` or `@`, URL-encode them (`#` → `%23`, `@` → `%40`).
