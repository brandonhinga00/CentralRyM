# Deployment Guide

## Prerequisites
- Railway account (railway.app)
- Supabase account (supabase.com)

## Setup Supabase
1. Create new project
2. Go to Settings > API to get:
   - Project URL
   - Anon key
3. Go to Settings > Database to get connection string (DATABASE_URL)
4. Enable Google OAuth in Authentication > Providers

## Setup Railway
1. Connect GitHub repo
2. Set environment variables:
   - `DATABASE_URL`: Supabase connection string
   - `SUPABASE_URL`: Supabase project URL
   - `SUPABASE_ANON_KEY`: Supabase anon key
   - `SESSION_SECRET`: Random string for sessions
   - `NODE_ENV`: production
3. Deploy

## Local Development
Create .env file with the same variables.

Run `npm run dev` for development.