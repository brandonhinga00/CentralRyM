import { createClient } from '@supabase/supabase-js';
import session from 'express-session';
import type { Express, RequestHandler } from 'express';
import connectPg from 'connect-pg-simple';
import { storage } from './storage';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: 'sessions',
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set('trust proxy', 1);
  app.use(getSession());

  // Middleware to verify Supabase JWT
  app.use(async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '') ||
                  req.query.access_token as string;

    if (token) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          req.user = user;
        }
      } catch (err) {
        // Invalid token, continue without user
      }
    }
    next();
  });

  // Login endpoint - redirect to Supabase auth
  app.get('/api/login', async (req, res) => {
    const response = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${req.protocol}://${req.get('host')}/api/callback`,
      },
    });

    if (response.error) {
      res.status(500).json({ error: response.error.message });
    } else {
      res.redirect(response.data.url);
    }
  });

  // Callback endpoint
  app.get('/api/callback', async (req, res) => {
    const { code } = req.query;

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code as string);

      if (error) {
        res.status(500).json({ error: error.message });
      } else {
        // Store session
        (req.session as any).user = data.user;
        (req.session as any).access_token = data.session?.access_token;
        res.redirect('/');
      }
    } else {
      res.status(400).json({ error: 'No code provided' });
    }
  });

  // Logout
  app.get('/api/logout', async (req, res) => {
    await supabase.auth.signOut();
    req.session.destroy(() => {
      res.redirect('/');
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.user || (req.session as any).user) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};