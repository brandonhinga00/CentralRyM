# Migration Plan: From Replit to Free Hosting

## Current Setup Analysis
- **Frontend**: React with Vite, TypeScript
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Drizzle
- **Auth**: Replit OAuth (OIDC) with Passport.js
- **Hosting**: Replit (paid, expensive)

## Recommended Hosting Solution
- **App Hosting**: Railway (free tier: 512MB RAM, 1GB disk, full-stack Node.js support)
- **Database**: Supabase (free tier: 500MB PostgreSQL, 50MB bandwidth/month)
- **Auth**: Supabase Auth (free, replaces Replit Auth)

**Why this combination?**
- Railway supports full Express apps easily
- Supabase provides generous free DB limits
- Supabase Auth integrates well with PostgreSQL

## Migration Steps

### 1. Setup New Accounts
- Create Railway account (railway.app)
- Create Supabase account (supabase.com)
- Create new projects in both

### 2. Database Migration
- Export current Neon database:
  ```bash
  pg_dump $NEON_DATABASE_URL > backup.sql
  ```
- In Supabase, create new project and get DATABASE_URL
- Update `drizzle.config.ts`:
  ```ts
  dbCredentials: {
    url: process.env.DATABASE_URL, // new Supabase URL
  },
  ```
- Run schema migration:
  ```bash
  npm run db:push
  ```
- Import data if needed (optional, since developing):
  ```bash
  psql $SUPABASE_DATABASE_URL < backup.sql
  ```

### 3. Authentication Migration
- Install Supabase client:
  ```bash
  npm install @supabase/supabase-js
  ```
- Update schema: Modify users table to match Supabase auth.users if needed
- Replace `server/replitAuth.ts` with Supabase auth logic
- Update client-side auth in `client/src/lib/authUtils.ts`
- Remove Replit-specific env vars (REPLIT_DOMAINS, etc.)
- Add Supabase env vars: SUPABASE_URL, SUPABASE_ANON_KEY

### 4. Code Changes
- Remove Replit-specific plugins from devDependencies
- Update build scripts if needed
- Ensure app works with new env vars

### 5. Deployment to Railway
- Connect GitHub repo to Railway
- Set environment variables in Railway dashboard
- Deploy app
- Test functionality

### 6. Post-Migration
- Update domain/DNS if needed
- Test all features
- Monitor usage to stay within free limits

## Environment Variables Needed
- `DATABASE_URL`: Supabase connection string
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anon key
- `SESSION_SECRET`: For session management
- `NODE_ENV`: production
- `PORT`: 3000 (or Railway default)

## Potential Challenges
- Auth migration requires code changes
- Data import might need adjustments
- Free tiers have limits; monitor usage

## Alternatives Considered
- **Railway only**: Limited DB storage
- **Vercel + Supabase**: Requires converting Express to serverless functions
- **Render + Supabase**: Similar to Railway, good option

## Cost Estimation
- Railway: Free (upgrade if needed ~$5/month)
- Supabase: Free (upgrade if DB grows ~$25/month)
- Total: $0/month initially