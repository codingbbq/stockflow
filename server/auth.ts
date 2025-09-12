import { createClient } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';

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

// Middleware to verify JWT tokens from Supabase
export const authenticateToken = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) => {
  console.log('Debug: authenticateToken middleware called for', req.method, req.originalUrl);
	if (!supabase) {
		console.error('Supabase not configured properly');
		return res.status(500).json({ message: 'Authentication service not available' });
	}

	// Check for token in cookie first, then authorization header
	const token =
		req.cookies.auth_token ||
		(req.headers.authorization && req.headers.authorization.split(' ')[1]);

	if (!token) {
		return res.status(401).json({ message: 'Access token required' });
	}

	try {
		// Verify the JWT token with Supabase
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser(token);

		if (error || !user) {
			return res.status(401).json({ message: 'Invalid or expired token' });
		}

		// Get user profile from database to check admin status
		if (supabaseAdmin) {
			const { data: profile, error: profileError } = await supabaseAdmin
				.from('profiles')
				.select('id, email, first_name, last_name, is_admin')
				.eq('id', user.id)
				.single();

			if (profileError) {
				console.error('Error fetching user profile:', profileError);
				return res.status(500).json({ message: 'Error verifying user' });
			}

			req.user = {
				id: user.id,
				email: user.email,
				is_admin: profile?.is_admin || false,
			};
		} else {
			req.user = {
				id: user.id,
				email: user.email,
				is_admin: false,
			};
		}

		next();
	} catch (error) {
		console.error('Authentication error:', error);
		return res.status(401).json({ message: 'Invalid token' });
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

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) => {
	if (!supabase) {
		return next();
	}

	const authHeader = req.headers.authorization;
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return next();
	}

	try {
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser(token);

		if (!error && user && supabaseAdmin) {
			const { data: profile } = await supabaseAdmin
				.from('profiles')
				.select('id, email, first_name, last_name, is_admin')
				.eq('id', user.id)
				.single();

			req.user = {
				id: user.id,
				email: user.email,
				is_admin: profile?.is_admin || false,
			};
		}
	} catch (error) {
		console.error('Optional auth error:', error);
	}

	next();
};
