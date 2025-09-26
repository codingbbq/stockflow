import jwt from "jsonwebtoken";
import { createClient } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';
import { storage } from "./storage";

// Create Supabase client with service role key for server-side operations
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
	console.warn('SUPABASE_URL not found. Authentication middleware will not work properly.');
}

if (!supabaseServiceKey) {
	console.warn('SUPABASE_SERVICE_ROLE_KEY not found. Admin operations will not work properly.');
}

// Service role client for admin operations
export const supabaseAdmin =
	supabaseServiceKey && supabaseUrl
		? createClient(supabaseUrl, supabaseServiceKey, {
				auth: {
					autoRefreshToken: false,
					persistSession: false,
				},
		  })
		: null;

// Regular client for JWT verification
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
export const supabase =
	supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export interface AuthenticatedRequest extends Request {
	user?: {
		id: string;
		email?: string;
		is_admin?: boolean;
	};
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret";

// Middleware to verify JWT tokens from Supabase
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  console.log('Debug: authenticateToken middleware called for', req.method, req.originalUrl);

  // Check for token in cookie first, then authorization header
  const token =
    req.cookies.auth_token ||
    (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    // Verify JWT and extract payload
   const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email?: string; is_admin?: boolean };
    // Fetch user profile from your local users table
    const user = await storage.getUser(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      is_admin: user.isAdmin || false,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check if user is admin
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	console.log('Debug: requireAdmin middleware called for', req.method, req.originalUrl, 'user:', req.user?.id, 'isAdmin:', req.user?.is_admin);
	if (!req.user) {
		return res.status(401).json({ message: 'Authentication required' });
	}

	if (!req.user.is_admin) {
		return res.status(403).json({ message: 'Admin access required' });
	}

	next();
};