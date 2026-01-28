# Railway Deployment Guide

This guide walks you through deploying your Fastify server to Railway.

## Prerequisites

- GitHub account (for GitHub deployment)
- Railway account (sign up at https://railway.app)
- Your Shopify app credentials

## Step-by-Step Deployment

### Step 1: Create Railway Project

1. Go to https://railway.app and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"** (recommended)
   - Authorize Railway to access your GitHub
   - Select your repository: `Thready`
   - Railway will detect it's a Node.js project

### Step 2: Add PostgreSQL Database

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create a PostgreSQL instance
4. The `DATABASE_URL` environment variable will be automatically set

### Step 3: Configure Service Settings

1. Click on your **server service** in Railway
2. Go to **Settings** tab
3. Set **Root Directory** to: `server`
4. Railway will auto-detect:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`

### Step 4: Set Environment Variables

In Railway → Your Service → **Variables** tab, add these environment variables:

#### Required Variables:

```bash
# Shopify App Credentials
SHOPIFY_CLIENT_ID=7e98895f9eb682f3bf2bcd7f7b5c67cf
SHOPIFY_API_SECRET=c176d6c703481b2c51994dab53a6e193

# Shopify Shop Domain
SHOPIFY_SHOP=thebarwardrobe.myshopify.com
SHOPIFY_SHOP_DOMAIN=thebarwardrobe.myshopify.com

# Shopify Customer Account Shop ID
SHOPIFY_SHOP_ID=71806648457

# JWT Secret (IMPORTANT: Generate a secure random string!)
# Use: openssl rand -base64 32
JWT_SECRET=your_secure_random_string_here
SESSION_SECRET=your_secure_random_string_here

# Frontend URL (your Nuxt app production URL)
FRONTEND_URL=https://thebarwadrobe.com/forum
COMMUNITY_URL=https://thebarwadrobe.com/forum

# Backend Port (Railway sets this automatically, but keep for fallback)
PORT=3001
```

#### Auto-Set Variables (from PostgreSQL service):

- `DATABASE_URL` - Automatically set when you link PostgreSQL service

#### Variables to Set After Getting Railway URL:

```bash
# Shopify OAuth Redirect URI (set this AFTER deployment)
# Format: https://your-app-name.up.railway.app/auth/shopify/callback
CALLBACK_URL=https://your-app-name.up.railway.app/auth/shopify/callback
SHOPIFY_REDIRECT_URI=https://your-app-name.up.railway.app/auth/shopify/callback
```

**Note:** You'll update `CALLBACK_URL` and `SHOPIFY_REDIRECT_URI` after you get your Railway URL in Step 6.

### Step 5: Link PostgreSQL to Your Service

1. In your **server service** → **Variables** tab
2. Click **"New Variable"**
3. Select **"Reference Variable"**
4. Choose your **PostgreSQL service** → `DATABASE_URL`
5. This links the database to your server

### Step 6: Deploy and Get Your Railway URL

1. Railway will automatically deploy when you push to GitHub
2. Or manually trigger: **Service** → **Deployments** → **"Redeploy"**
3. Wait for deployment to complete (check logs if errors occur)
4. Go to **Settings** → **Networking** tab
5. Click **"Generate Domain"** (or use custom domain)
6. Copy your Railway URL (e.g., `https://your-app-name.up.railway.app`)

### Step 7: Run Database Migrations

After first deployment, run migrations:

**Option A: Via Railway Dashboard**
1. Go to **Service** → **Deployments** → Click latest deployment
2. Click **"Run Command"**
3. Run: `npx prisma migrate deploy`

**Option B: Via Railway CLI**
```bash
npm i -g @railway/cli
railway login
railway link  # Link to your project
railway run npx prisma migrate deploy
```

### Step 8: Update Shopify Redirect URLs

1. Go to **Shopify Partners** → Your App → **App setup** → **URLs**
2. In **Redirect URLs**, add:
   ```
   https://your-app-name.up.railway.app/auth/shopify/callback
   ```
   (Replace `your-app-name.up.railway.app` with your actual Railway URL)
3. **Save** changes

### Step 9: Update Railway Environment Variables

1. Go back to Railway → Your Service → **Variables**
2. Update these variables with your Railway URL:
   ```bash
   CALLBACK_URL=https://your-app-name.up.railway.app/auth/shopify/callback
   SHOPIFY_REDIRECT_URI=https://your-app-name.up.railway.app/auth/shopify/callback
   ```
3. Railway will automatically redeploy

### Step 10: Test Your Deployment

1. **Health Check**: Visit `https://your-app-name.up.railway.app/`
   - Should return: `{ "hello": "world" }`

2. **Auth Endpoint**: Visit `https://your-app-name.up.railway.app/auth/shopify/login`
   - Should redirect to Shopify login

3. **Test Login Flow**:
   - Click "Sign in with Shopify" in your frontend
   - Should redirect to Shopify → back to your callback → back to frontend

## Troubleshooting

### Build Fails

- **Check logs**: Railway → Service → Deployments → Click deployment → View logs
- **Common issues**:
  - Missing environment variables
  - TypeScript compilation errors
  - Prisma generate failing

### Database Connection Errors

- **Verify**: `DATABASE_URL` is set and linked from PostgreSQL service
- **Check**: PostgreSQL service is running
- **Run migrations**: `railway run npx prisma migrate deploy`

### 401 / Redirect Errors

- **Verify**: Shopify Redirect URLs match Railway URL exactly (no trailing slash)
- **Check**: `CALLBACK_URL` and `SHOPIFY_REDIRECT_URI` match Shopify settings
- **Ensure**: Both use HTTPS (not HTTP)

### CORS Errors

- **Check**: `FRONTEND_URL` and `COMMUNITY_URL` match your frontend domain
- **Verify**: Frontend is making requests to Railway URL (not localhost)

### Port Errors

- Railway sets `PORT` automatically
- Your code already uses `process.env.PORT || 3001`
- Should work automatically

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | Auto-set by Railway |
| `SHOPIFY_CLIENT_ID` | ✅ | Shopify app client ID | `7e98895f9eb682f3bf2bcd7f7b5c67cf` |
| `SHOPIFY_API_SECRET` | ✅ | Shopify app secret | `c176d6c703481b2c51994dab53a6e193` |
| `SHOPIFY_SHOP` | ✅ | Shop domain | `thebarwardrobe.myshopify.com` |
| `SHOPIFY_SHOP_DOMAIN` | ✅ | Shop domain (same as above) | `thebarwardrobe.myshopify.com` |
| `SHOPIFY_SHOP_ID` | ✅ | Customer Account Shop ID | `71806648457` |
| `JWT_SECRET` | ✅ | Secret for JWT signing | Generate secure random string |
| `SESSION_SECRET` | ✅ | Secret for session cookies | Generate secure random string |
| `CALLBACK_URL` | ✅ | OAuth callback URL | `https://your-app.up.railway.app/auth/shopify/callback` |
| `SHOPIFY_REDIRECT_URI` | ✅ | Same as CALLBACK_URL | `https://your-app.up.railway.app/auth/shopify/callback` |
| `FRONTEND_URL` | ✅ | Frontend app URL | `https://thebarwadrobe.com/forum` |
| `COMMUNITY_URL` | ✅ | Community/frontend URL | `https://thebarwadrobe.com/forum` |
| `PORT` | ⚠️ | Server port (auto-set by Railway) | `3001` |
| `SHOPIFY_ADMIN_TOKEN` | ❌ | Admin API token (if needed) | Optional |

## Generating Secure Secrets

Use one of these methods to generate secure `JWT_SECRET` and `SESSION_SECRET`:

**Option 1: OpenSSL**
```bash
openssl rand -base64 32
```

**Option 2: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3: Online**
- Use https://randomkeygen.com/ (use "CodeIgniter Encryption Keys")

## Next Steps After Deployment

1. ✅ Update frontend `.env` to use Railway backend URL:
   ```bash
   VITE_API_BASE=https://your-app-name.up.railway.app
   ```

2. ✅ Test authentication flow end-to-end

3. ✅ Monitor Railway logs for any errors

4. ✅ Set up custom domain (optional):
   - Railway → Settings → Networking → Custom Domain
   - Update Shopify Redirect URLs accordingly

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check deployment logs in Railway dashboard for detailed error messages
