# Supabase Setup: Create Tables & Steps From Step 6

Your `server/.env` is configured with Supabase and Shopify. Follow this to create tables in Supabase and complete setup.

---

## Part A: Create Tables in Supabase

You have two ways to create tables. Use **Option 1** for the quickest setup.

### Option 1: Push schema with Prisma (recommended)

This creates all tables from your Prisma schema in Supabase without migration files.

1. **Open a terminal** in your project and go to the server folder:
   ```bash
   cd server
   ```

2. **Ensure `.env` is loaded** (you already have `DATABASE_URL` pointing to Supabase in `server/.env`).

3. **Generate Prisma Client** (optional, for a clean run):
   ```bash
   npx prisma generate
   ```

4. **Push the schema to Supabase** (this creates the tables):
   ```bash
   npx prisma db push
   ```

   You should see something like:
   ```
   Datasource "db": PostgreSQL database "postgres" at "db.ejcrtccjiaoexwrshlmf.supabase.co:5432"
   The following migration(s) have been applied:
   ...
   Your database is now in sync with your schema.
   ```

5. **Verify in Supabase**:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Table Editor**.
   - You should see: `Community`, `Moderator`, `Post`, `PostVote`, `Comment`, `CommentVote`, `users`.

**If `prisma db push` fails with "Can't reach database server":**
- Run the command from your own machine (terminal in your project); the database must be reachable from your network.
- In Supabase Dashboard → **Settings** → **Database**, check **Connection string** and ensure you use the **URI** with your real password.
- If your project uses **Connection pooling**, use the **Session mode** (port 5432) URI for migrations and `db push`, not the pooler (6543).

### Option 2: Use migrations (for migration history)

Your existing migrations were created for SQLite. For a **new** Supabase (PostgreSQL) database, use a fresh PostgreSQL migration:

1. **In the server folder**, back up and remove the old migrations (they are SQLite-specific):
   ```bash
   cd server
   mv prisma/migrations prisma/migrations_backup
   ```

2. **Create a new initial migration for PostgreSQL**:
   ```bash
   npx prisma migrate dev --name init_postgresql
   ```

3. **Apply it to Supabase** (same as deploy):
   ```bash
   npx prisma migrate deploy
   ```

4. **Verify** in Supabase Table Editor as in Option 1.

---

## Part B: Steps From Step 6 Onwards

### Step 6: Run the backend and test DB connection

1. **Start the server** (from project root or `server`):
   ```bash
   cd server
   npm run dev
   ```

2. **Check health**:
   - Open: http://localhost:3001/
   - You should see: `{ "hello": "world" }`

3. **Test DB** (e.g. communities):
   - Open: http://localhost:3001/communities
   - You should get JSON (empty array `[]` or data if you seeded).

4. If you see DB errors, check:
   - `server/.env` has the correct `DATABASE_URL` (Supabase connection string with URL-encoded password).
   - You ran **Option 1** or **Option 2** above so tables exist.

---

### Step 7: Seed initial data (optional)

1. **From `server` folder**:
   ```bash
   cd server
   npm run seed
   ```

2. If the seed script expects SQLite or different schema, fix it to use your Prisma models and run again. Then hit `/communities` and `/posts` again to see data.

---

### Step 8: Deploy backend (e.g. Railway)

Your frontend is on Vercel: https://thready-ruby.vercel.app  
The **backend** (Fastify in `server/`) must be deployed separately (e.g. Railway) so Shopify OAuth callback works.

1. **Deploy the server** to Railway (or another host):
   - Connect the repo, set **Root Directory** to `server`.
   - Add **PostgreSQL** is optional here; you are using **Supabase** as DB.

2. **Set environment variables** on Railway (same as `server/.env`):
   - `DATABASE_URL` = your Supabase connection string (same as in `.env`).
   - `SHOPIFY_CLIENT_ID`, `SHOPIFY_API_SECRET`, `SHOPIFY_SHOP`, `SHOPIFY_SHOP_DOMAIN`, `SHOPIFY_SHOP_ID`.
   - `JWT_SECRET`, `SESSION_SECRET`.
   - `FRONTEND_URL` = `https://thready-ruby.vercel.app`
   - `COMMUNITY_URL` = `https://thready-ruby.vercel.app`
   - `CALLBACK_URL` = `https://YOUR-RAILWAY-APP.up.railway.app/auth/shopify/callback`
   - `SHOPIFY_REDIRECT_URI` = same as `CALLBACK_URL`.

3. **Run migrations on production** (if you used Option 2):
   ```bash
   railway run npx prisma migrate deploy
   ```
   If you used **Option 1** (`db push`), tables are already in Supabase; no need to run migrations on Railway.

4. **Note the backend URL**, e.g. `https://your-app.up.railway.app`.

---

### Step 9: Configure Shopify redirect URLs

1. Go to [Shopify Partners](https://partners.shopify.com) → your app → **App setup** → **URLs**.
2. Under **Redirect URLs**, add your **backend** callback URL (not Vercel):
   ```
   https://YOUR-RAILWAY-APP.up.railway.app/auth/shopify/callback
   ```
   (Replace with your real Railway URL.)
3. Save.

---

### Step 10: Point frontend (Vercel) to backend

1. **Vercel** → your project → **Settings** → **Environment Variables**.
2. Add:
   - **Name:** `VITE_API_BASE`
   - **Value:** `https://YOUR-RAILWAY-APP.up.railway.app`
   - Environment: Production (and Preview if you want).
3. **Redeploy** the Nuxt app on Vercel so it uses the new `VITE_API_BASE`.

Now “Sign in with Shopify” on https://thready-ruby.vercel.app will use your backend and Supabase.

---

### Step 11: Production callback in `server/.env`

When your backend is live on Railway, **on your local machine** you can keep using local callback for local dev. On **Railway**, the env vars you set in Step 8 (`CALLBACK_URL` and `SHOPIFY_REDIRECT_URI`) are what matter. No need to change the repo’s `server/.env` for production unless you want to document the production URL there.

---

## Summary checklist

- [ ] `server/.env` configured (Supabase + Shopify + Vercel URL).
- [ ] Tables created in Supabase (Option 1: `npx prisma db push` or Option 2: new migration + `migrate deploy`).
- [ ] Backend runs locally and returns `/` and `/communities`.
- [ ] Backend deployed (e.g. Railway) with same env vars.
- [ ] Shopify Redirect URL = backend callback (e.g. Railway).
- [ ] Vercel env `VITE_API_BASE` = backend URL; frontend redeployed.

---

## Connection string note

Your Supabase password contains `#` and `@`. In `DATABASE_URL` these must be URL-encoded:

- `#` → `%23`
- `@` → `%40`

So in `.env` the password part is: `s4H%23%23J7XDJq%40hFv` (already set in your `server/.env`).

---

## Useful commands

```bash
# Server folder
cd server

# Create tables in Supabase (Option 1)
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (browse Supabase data)
npx prisma studio

# Run server
npm run dev
```

If you want, we can next add seed data for communities and posts or adjust the seed script for Supabase.
