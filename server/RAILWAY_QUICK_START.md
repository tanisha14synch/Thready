# Railway Deployment - Quick Start Checklist

## ✅ Code Changes (Already Done)

- [x] Updated `prisma/schema.prisma` → PostgreSQL provider
- [x] Updated `package.json` → Added Prisma generate to build
- [x] Created `railway.toml` → Railway configuration
- [x] Created deployment guides

## 📋 Manual Steps Checklist

### 1. Railway Setup
- [ ] Sign up at https://railway.app
- [ ] Create new project → "Deploy from GitHub repo"
- [ ] Select your `Thready` repository
- [ ] Set Root Directory to: `server`

### 2. Add PostgreSQL Database
- [ ] Click "+ New" → "Database" → "Add PostgreSQL"
- [ ] Link PostgreSQL service to your server service (Reference Variable → DATABASE_URL)

### 3. Set Environment Variables
Go to Railway → Your Service → Variables, add:

**Required:**
- [ ] `SHOPIFY_CLIENT_ID=7e98895f9eb682f3bf2bcd7f7b5c67cf`
- [ ] `SHOPIFY_API_SECRET=c176d6c703481b2c51994dab53a6e193`
- [ ] `SHOPIFY_SHOP=thebarwardrobe.myshopify.com`
- [ ] `SHOPIFY_SHOP_DOMAIN=thebarwardrobe.myshopify.com`
- [ ] `SHOPIFY_SHOP_ID=71806648457`
- [ ] `JWT_SECRET=<generate secure random string>`
- [ ] `SESSION_SECRET=<generate secure random string>`
- [ ] `FRONTEND_URL=https://thebarwadrobe.com/forum`
- [ ] `COMMUNITY_URL=https://thebarwadrobe.com/forum`
- [ ] `PORT=3001`

**Generate Secrets:**
```bash
# Run this command to generate secure secrets:
openssl rand -base64 32
# Copy the output and use for JWT_SECRET and SESSION_SECRET
```

### 4. Deploy & Get URL
- [ ] Wait for Railway to deploy (or trigger manually)
- [ ] Go to Settings → Networking → Generate Domain
- [ ] Copy your Railway URL: `https://your-app-name.up.railway.app`

### 5. Update Environment Variables (After Getting URL)
- [ ] `CALLBACK_URL=https://your-app-name.up.railway.app/auth/shopify/callback`
- [ ] `SHOPIFY_REDIRECT_URI=https://your-app-name.up.railway.app/auth/shopify/callback`

### 6. Run Database Migrations
- [ ] Railway → Service → Deployments → Latest → "Run Command"
- [ ] Run: `npx prisma migrate deploy`

### 7. Update Shopify Settings
- [ ] Go to Shopify Partners → Your App → App setup → URLs
- [ ] Add Redirect URL: `https://your-app-name.up.railway.app/auth/shopify/callback`
- [ ] Save changes

### 8. Test Deployment
- [ ] Visit: `https://your-app-name.up.railway.app/` → Should see `{ "hello": "world" }`
- [ ] Visit: `https://your-app-name.up.railway.app/auth/shopify/login` → Should redirect to Shopify
- [ ] Test full login flow from frontend

### 9. Update Frontend
- [ ] Update frontend `.env` or environment variables:
  ```bash
  VITE_API_BASE=https://your-app-name.up.railway.app
  ```
- [ ] Redeploy frontend (if needed)

## 🚀 Quick Commands Reference

```bash
# Generate secure secrets
openssl rand -base64 32

# Run migrations (in Railway)
railway run npx prisma migrate deploy

# Check logs
railway logs

# Connect to database
railway run psql $DATABASE_URL
```

## 📚 Full Documentation

- **Detailed Guide**: See `RAILWAY_DEPLOYMENT.md`
- **Migration Guide**: See `MIGRATION_SQLITE_TO_POSTGRES.md`

## ⚠️ Important Notes

1. **DATABASE_URL** is automatically set when you link PostgreSQL service
2. **Redirect URLs** must match EXACTLY in Shopify and Railway (no trailing slashes)
3. **Use HTTPS** for all production URLs (Railway provides HTTPS automatically)
4. **Secrets** - Generate new secure secrets, don't use the example values in production

## 🆘 Need Help?

- Check Railway logs: Railway → Service → Deployments → View logs
- Check `RAILWAY_DEPLOYMENT.md` for detailed troubleshooting
- Railway Discord: https://discord.gg/railway
