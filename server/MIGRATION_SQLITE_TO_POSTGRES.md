# SQLite to PostgreSQL Migration Guide

Since Railway doesn't support SQLite (ephemeral filesystem), you need to migrate to PostgreSQL.

## What Changed in Code

✅ **Updated Files:**
- `prisma/schema.prisma` - Changed `provider` from `"sqlite"` to `"postgresql"`
- `package.json` - Added `prisma generate` to build script and migration commands
- `railway.toml` - Added Railway configuration

## Migration Steps

### Step 1: Create New Migration for PostgreSQL

After deploying to Railway with PostgreSQL, you'll need to create a fresh migration:

```bash
# In Railway CLI or locally with PostgreSQL connection
npx prisma migrate dev --name init_postgresql
```

Or if you want to use existing migrations:

```bash
# Deploy existing migrations to PostgreSQL
npx prisma migrate deploy
```

### Step 2: Migrate Existing Data (If You Have Any)

If you have data in your local SQLite database (`dev.db`), you can export and import it:

**Option A: Export from SQLite, Import to PostgreSQL**

1. **Export SQLite data**:
   ```bash
   sqlite3 dev.db .dump > backup.sql
   ```

2. **Clean up SQLite-specific syntax** (PostgreSQL uses different syntax):
   - Remove `AUTOINCREMENT` → PostgreSQL uses `SERIAL` or `GENERATED ALWAYS AS IDENTITY`
   - Update `INTEGER PRIMARY KEY` → `SERIAL PRIMARY KEY` or `UUID`
   - Remove SQLite-specific functions

3. **Import to PostgreSQL**:
   ```bash
   # Connect to Railway PostgreSQL
   railway run psql $DATABASE_URL < backup.sql
   ```

**Option B: Use Prisma Studio (Easier)**

1. **Export from SQLite**:
   ```bash
   # Temporarily switch back to SQLite
   # In schema.prisma: provider = "sqlite"
   npx prisma studio
   # Manually copy data or use Prisma's export feature
   ```

2. **Import to PostgreSQL**:
   ```bash
   # Switch to PostgreSQL
   # In schema.prisma: provider = "postgresql"
   # Set DATABASE_URL to Railway PostgreSQL
   npx prisma studio
   # Manually paste data or use Prisma's import feature
   ```

**Option C: Start Fresh (Recommended for Development)**

If you don't have important production data:
1. Deploy to Railway with PostgreSQL
2. Run `npx prisma migrate deploy`
3. Seed database if needed: `railway run npm run seed`

## Important Differences: SQLite vs PostgreSQL

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| Provider | `"sqlite"` | `"postgresql"` |
| DATABASE_URL | `file:./dev.db` | `postgresql://user:pass@host:port/db` |
| UUID | Uses `@default(uuid())` | Uses `@default(uuid())` ✅ Same |
| Auto-increment | `@id @default(autoincrement())` | `@id @default(autoincrement())` ✅ Same |
| String IDs | Works | Works ✅ Same |
| JSON fields | `String` (JSON string) | `String` (JSON string) ✅ Same |

**Good News:** Your Prisma schema is already compatible! The models use `String @id @default(uuid())` which works in both databases.

## Testing Locally with PostgreSQL

If you want to test PostgreSQL locally before deploying:

1. **Install PostgreSQL locally** (or use Docker):
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Create database
   createdb thready_dev
   ```

2. **Update `.env`**:
   ```bash
   DATABASE_URL="postgresql://localhost:5432/thready_dev"
   ```

3. **Run migrations**:
   ```bash
   npx prisma migrate dev
   ```

4. **Test your app**:
   ```bash
   npm run dev
   ```

## Railway-Specific Notes

- **DATABASE_URL**: Railway automatically provides this when you add PostgreSQL service
- **Migrations**: Run `npx prisma migrate deploy` after deployment (not `migrate dev`)
- **Prisma Client**: Generated automatically during build (`prisma generate` in build script)
- **Connection Pooling**: Railway handles this automatically

## Troubleshooting

### "Relation does not exist" Error

This means migrations haven't run. Fix:
```bash
railway run npx prisma migrate deploy
```

### "Connection refused" Error

- Check `DATABASE_URL` is set correctly
- Verify PostgreSQL service is running in Railway
- Ensure service is linked to your server

### Migration Conflicts

If you have migration conflicts:
```bash
# Reset database (⚠️ DELETES ALL DATA)
railway run npx prisma migrate reset

# Then deploy migrations
railway run npx prisma migrate deploy
```

## Next Steps

1. ✅ Deploy to Railway (follow `RAILWAY_DEPLOYMENT.md`)
2. ✅ Run migrations: `railway run npx prisma migrate deploy`
3. ✅ Test your endpoints
4. ✅ Update frontend to use Railway URL
