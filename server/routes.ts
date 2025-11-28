import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { storage } from './storage';
import { stocks as stocksTable, insertStockSchema, insertStockRequestSchema } from '@shared/schema';
import { z } from 'zod';
import { authenticateToken, requireAdmin, type AuthenticatedRequest } from './auth';
import { db } from './db';
import { sql } from 'drizzle-orm';
export async function registerRoutes(app: Express): Promise<Server> {
	// Authentication routes
	app.post('/api/auth/signin', async (req, res) => {
		try {
			const { email, password } = req.body;
			const { access_token, user, error } = await storage.signInWithPassword(email, password);

			if (error) {
				return res.status(401).json({ message: error.message });
			}

			if (access_token) {
				// Set session cookie (you'd implement proper session management here)
				res.cookie('auth_token', access_token, {
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'strict',
					maxAge: 24 * 60 * 60 * 1000, // 24 hours
				});

				res.json({
					access_token,
					user,
					error,
				});
			}
		} catch (error) {
			console.error('Signin error:', error);
			res.status(500).json({ message: 'Internal server error' });
		}
	});

	app.post('/api/auth/signup', async (req, res) => {
		try {
			const { email, password, firstName, lastName } = req.body;
			const { user, error } = await storage.newUserSignUp({
				email,
				password,
				firstName,
				lastName,
			});
			if (error) {
				return res.status(400).json({ message: error.message });
			}
			res.json({ message: 'Signup successful. Your account will be activated by Admin' });
		} catch (error) {
			console.error('Signup error:', error);
			res.status(500).json({ message: 'Internal server error' });
		}
	});

	app.post('/api/auth/signout', async (req, res) => {
		try {
			res.clearCookie('auth_token');
			res.json({ message: 'Signed out successfully' });
		} catch (error) {
			console.error('Signout error:', error);
			res.status(500).json({ message: 'Internal server error' });
		}
	});

	app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
		try {
			if (!req.user) {
				return res.status(401).json({ message: 'Not authenticated' });
			}
			res.json({ user: req.user });
		} catch (error) {
			console.error('Auth check error:', error);
			res.status(500).json({ message: 'Internal server error', error });
		}
	});

	// Public stock routes (read-only, no auth required)
	// Example: GET /api/stocks?page=1&limit=8
	app.get('/api/stocks', async (req, res) => {
		try {
			const page = Number(req.query.page) || 1;
			const limit = Number(req.query.limit) || 8;
			const offset = (page - 1) * limit;

			const stocks = await db.query.stocks.findMany({
				offset,
				limit,
			});

			const totalResult = await db.select({ count: sql`count(*)` }).from(stocksTable);
			const total = Number(totalResult[0]?.count ?? 0);
			const totalPages = Math.max(1, Math.ceil(total / limit));
			res.json({ stocks, totalPages });
		} catch (error) {
			console.error('Error fetching stocks:', error);
			res.status(500).json({ message: 'Failed to fetch stocks' });
		}
	});

	app.get('/api/stocks/:id', async (req, res) => {
		try {
			const stock = await storage.getStockById(req.params.id);
			if (!stock) {
				return res.status(404).json({ message: 'Stock not found' });
			}
			res.json(stock);
		} catch (error) {
			console.error('Error fetching stock:', error);
			res.status(500).json({ message: 'Failed to fetch stock' });
		}
	});

	// PROTECTED ROUTES - Require authentication

	// Admin-only stock management routes
	app.post(
		'/api/admin/stocks',
		authenticateToken,
		requireAdmin,
		async (req: AuthenticatedRequest, res) => {
			try {
				console.log('Debug: Received request to create stock with body:', req.body);
				const stockData = insertStockSchema.parse(req.body);
				const stock = await storage.createStock(stockData);
				res.json(stock);
			} catch (error) {
				console.error('Error creating stock:', error);
				if (error instanceof z.ZodError) {
					return res
						.status(400)
						.json({ message: 'Invalid stock data', errors: error.issues });
				}
				res.status(500).json({ message: 'Failed to create stock' });
			}
		}
	);

	app.put(
		'/api/admin/stocks/:id',
		authenticateToken,
		requireAdmin,
		async (req: AuthenticatedRequest, res) => {
			try {
				const stockData = insertStockSchema.partial().parse(req.body);
				const stock = await storage.updateStock(req.params.id, stockData);
				res.json(stock);
			} catch (error) {
				console.error('Error updating stock:', error);
				res.status(500).json({ message: 'Failed to update stock' });
			}
		}
	);

	app.delete(
		'/api/stocks/:id',
		authenticateToken,
		requireAdmin,
		async (req: AuthenticatedRequest, res) => {
			try {
				await storage.deleteStock(req.params.id);
				res.json({ message: 'Stock deleted successfully' });
			} catch (error) {
				console.error('Error deleting stock:', error);
				res.status(500).json({ message: 'Failed to delete stock' });
			}
		}
	);

	// Authenticated stock request routes
	app.post('/api/requests', authenticateToken, async (req: AuthenticatedRequest, res) => {
		try {
			if (!req.user) {
				return res.status(401).json({ message: 'Authentication required' });
			}

			const requestData = insertStockRequestSchema.parse({
				...req.body,
				userId: req.user.id, // Use authenticated user ID
			});

			// Check if stock exists and has enough quantity
			const stock = await storage.getStockById(requestData.stockId);
			if (!stock) {
				return res.status(404).json({ message: 'Stock not found' });
			}

			if (stock.quantity < requestData.quantity) {
				return res.status(400).json({ message: 'Insufficient stock quantity' });
			}

			const request = await storage.createStockRequest(requestData);
			res.json(request);
		} catch (error) {
			console.error('Error creating request:', error);
			if (error instanceof z.ZodError) {
				return res
					.status(400)
					.json({ message: 'Invalid request data', errors: error.issues });
			}
			res.status(500).json({ message: 'Failed to create request' });
		}
	});

	// Admin-only: view all requests
	app.get(
		'/api/requests',
		authenticateToken,
		requireAdmin,
		async (req: AuthenticatedRequest, res) => {
			try {
				const requests = await storage.getStockRequests();
				res.json(requests);
			} catch (error) {
				console.error('Error fetching requests:', error);
				res.status(500).json({ message: 'Failed to fetch requests' });
			}
		}
	);

	// Current user can view their own requests
	app.get('/api/requests/user', authenticateToken, async (req: AuthenticatedRequest, res) => {
		try {
			if (!req.user) {
				return res.status(401).json({ message: 'Authentication required' });
			}
			console.log('Debug : Calling Get Stock Request By User');
			const requests = await storage.getStockRequestsByUser(req.user.id);
			res.json(requests);
		} catch (error) {
			console.error('Error fetching user requests:', error);
			res.status(500).json({ message: 'Failed to fetch requests' });
		}
	});

	// Users can view their own requests (with userId parameter)
	app.get(
		'/api/requests/user/:userId',
		authenticateToken,
		async (req: AuthenticatedRequest, res) => {
			try {
				if (!req.user) {
					return res.status(401).json({ message: 'Authentication required' });
				}

				const requestedUserId = req.params.userId;

				// Users can only view their own requests unless they're admin
				if (requestedUserId !== req.user.id && !req.user.is_admin) {
					return res.status(403).json({ message: 'Can only view your own requests' });
				}

				const requests = await storage.getStockRequestsByUser(requestedUserId);
				res.json(requests);
			} catch (error) {
				console.error('Error fetching user requests:', error);
				res.status(500).json({ message: 'Failed to fetch requests' });
			}
		}
	);

	// Admin-only: approve requests
	app.put(
		'/api/requests/:id/approve',
		authenticateToken,
		requireAdmin,
		async (req: AuthenticatedRequest, res) => {
			try {
				if (!req.user) {
					return res.status(401).json({ message: 'Authentication required' });
				}

				const { adminNotes } = req.body;
				const requestId = req.params.id;

				// Get the request details
				const requests = await storage.getStockRequests();
				const request = requests.find((r) => r.id === requestId);
				if (!request) {
					return res.status(404).json({ message: 'Request not found' });
				}

				// Update stock quantity
				const stock = await storage.getStockById(request.stockId);
				if (!stock) {
					return res.status(404).json({ message: 'Stock not found' });
				}

				if (stock.quantity < request.quantity) {
					return res.status(400).json({ message: 'Insufficient stock quantity' });
				}

				const newQuantity = stock.quantity - request.quantity;
				await storage.updateStockQuantity(request.stockId, newQuantity);

				// Update request status with actual admin ID
				const updatedRequest = await storage.updateRequestStatus(
					requestId,
					'approved',
					adminNotes,
					req.user.id
				);

				// Create history entry
				await storage.createStockHistory({
					stockId: request.stockId,
					changeType: 'request_approved',
					quantity: -request.quantity,
					userId: request.userId,
					requestId: requestId,
					notes: `Request approved by admin: ${request.quantity} units allocated`,
				});

				res.json(updatedRequest);
			} catch (error) {
				console.error('Error approving request:', error);
				res.status(500).json({ message: 'Failed to approve request' });
			}
		}
	);

	// Admin-only: deny requests
	app.put(
		'/api/requests/:id/deny',
		authenticateToken,
		requireAdmin,
		async (req: AuthenticatedRequest, res) => {
			try {
				if (!req.user) {
					return res.status(401).json({ message: 'Authentication required' });
				}

				const { adminNotes } = req.body;
				const requestId = req.params.id;

				const updatedRequest = await storage.updateRequestStatus(
					requestId,
					'denied',
					adminNotes,
					req.user.id
				);
				res.json(updatedRequest);
			} catch (error) {
				console.error('Error denying request:', error);
				res.status(500).json({ message: 'Failed to deny request' });
			}
		}
	);

	// Stock history - authenticated users only
	app.patch(
		'/api/admin/stocks/:id/adjust-quantity',
		authenticateToken,
		requireAdmin,
		async (req: AuthenticatedRequest, res) => {
			try {
				const { id } = req.params;
				const { changeType, quantity, comment } = req.body;

				// Validate input
				if (!changeType || !['added', 'removed'].includes(changeType)) {
					return res.status(400).json({ message: 'Invalid adjustment type' });
				}

				if (!quantity || quantity <= 0) {
					return res.status(400).json({ message: 'Quantity must be greater than 0' });
				}

				if (!comment || comment.trim() === '') {
					return res.status(400).json({ message: 'Comment is required' });
				}

				// Get current stock
				const stock = await storage.getStockById(id);
				if (!stock) {
					return res.status(404).json({ message: 'Stock not found' });
				}

				// Calculate new quantity
				const adjustmentAmount = changeType === 'added' ? quantity : -quantity;
				const newQuantity = stock.quantity + adjustmentAmount;

				// Prevent negative stock
				if (newQuantity < 0) {
					return res.status(400).json({
						message: `Cannot remove ${quantity} items. Only ${stock.quantity} available in stock.`,
					});
				}

				// Update stock quantity in stocks table
				await storage.updateStock(id, { quantity: newQuantity });

				// Insert record into stock_history
				await storage.createStockHistory({
					stockId: id,
					changeType: changeType,
					quantity: quantity,
					userId: req.user?.id || null,
					notes: comment,
					requestId: null,
				});

				// Get updated stock
				const updatedStock = await storage.getStockById(id);

				return res.json({
					message: 'Stock quantity adjusted successfully',
					stock: updatedStock,
				});
			} catch (error) {
				console.error('Error adjusting stock quantity:', error);
				return res.status(500).json({
					message: 'Failed to adjust stock quantity',
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		}
	);

	// Update Stock count and post it in Stock History table
	// Stock history - authenticated users only
	app.get(
		'/api/stocks/:id/history',
		authenticateToken,
		async (req: AuthenticatedRequest, res) => {
			try {
				const history = await storage.getStockHistory(req.params.id);
				res.json(history);
			} catch (error) {
				console.error('Error fetching stock history:', error);
				res.status(500).json({ message: 'Failed to fetch stock history' });
			}
		}
	);

	// Stock requests for specific stock - admin only
	app.get(
		'/api/stocks/:id/requests',
		authenticateToken,
		requireAdmin,
		async (req: AuthenticatedRequest, res) => {
			try {
				const requests = await storage.getStockRequestsByStock(req.params.id);
				res.json(requests);
			} catch (error) {
				console.error('Error fetching stock requests:', error);
				res.status(500).json({ message: 'Failed to fetch stock requests' });
			}
		}
	);

	// Dashboard stats - admin only
	app.get(
		'/api/dashboard/stats',
		authenticateToken,
		requireAdmin,
		async (req: AuthenticatedRequest, res) => {
			try {
				const stats = await storage.getDashboardStats();
				res.json(stats);
			} catch (error) {
				console.error('Error fetching dashboard stats:', error);
				res.status(500).json({ message: 'Failed to fetch dashboard stats' });
			}
		}
	);

	// NEW SECURE ADMIN ENDPOINTS

	// Admin-only: Get all users
	app.get(
		'/api/admin/users',
		authenticateToken,
		requireAdmin,
		async (req: AuthenticatedRequest, res) => {
			try {
				const users = await storage.getAllUsers();
				res.json(users);
			} catch (error) {
				console.error('Error fetching users:', error);
				res.status(500).json({ message: 'Failed to fetch users' });
			}
		}
	);

	// Admin-only: Add new User
	app.post(
		'/api/admin/user',
		authenticateToken,
		requireAdmin,
		async (req: AuthenticatedRequest, res) => {
			try {
				const user = await storage.createNewUser({
					email: req.body.email,
					password: req.body.password_hash,
					firstName: req.body.firstName,
					lastName: req.body.lastName,
					isActive: req.body.isActive,
				});
				res.json(user);
			} catch (error) {
				console.error('Error fetching users:', error);
				res.status(500).json({ message: 'Failed to fetch users' });
			}
		}
	);

	// Admin-only: Toggle user admin status (SECURE)
	app.put(
		'/api/admin/users/:userId/toggle-active',
		authenticateToken,
		requireAdmin,
		async (req: AuthenticatedRequest, res) => {
			try {
				const { userId } = req.params;
				const { isActive } = req.body;
				const userData = await storage.toggleIsActive(userId, isActive);
				res.json(userData);
			} catch (error) {
				console.error('Error updating user status:', error);
				res.status(500).json({ message: 'Failed to update user active status' });
			}
		}
	);

	// Admin-only: Get all requests (with detailed info)
	app.get(
		'/api/admin/requests',
		authenticateToken,
		requireAdmin,
		async (req: AuthenticatedRequest, res) => {
			try {
				const requests = await storage.getStockRequests();
				res.json(requests);
			} catch (error) {
				console.error('Error fetching admin requests:', error);
				res.status(500).json({ message: 'Failed to fetch admin requests', error });
			}
		}
	);

	// Admin-only: Get dashboard stats
	app.get(
		'/api/admin/dashboard/stats',
		authenticateToken,
		requireAdmin,
		async (req: AuthenticatedRequest, res) => {
			try {
				const stats = await storage.getDashboardStats();
				res.json(stats);
			} catch (error) {
				console.error('Error fetching admin dashboard stats:', error);
				res.status(500).json({ message: 'Failed to fetch admin dashboard stats' });
			}
		}
	);

	// Admin-only: Delete stock (secure version)
	app.delete(
		'/api/admin/stocks/:id',
		authenticateToken,
		requireAdmin,
		async (req: AuthenticatedRequest, res) => {
			try {
				await storage.deleteStock(req.params.id);
				res.json({ message: 'Stock deleted successfully' });
			} catch (error) {
				console.error('Error deleting stock:', error);
				res.status(500).json({ message: 'Failed to delete stock' });
			}
		}
	);

	// Admin-only: Approve request (secure version)
	app.put(
		'/api/admin/requests/:id/approve',
		authenticateToken,
		requireAdmin,
		async (req: AuthenticatedRequest, res) => {
			try {
				if (!req.user) {
					return res.status(401).json({ message: 'Authentication required' });
				}

				const { adminNotes } = req.body;
				const requestId = req.params.id;

				// Get the request details
				const requests = await storage.getStockRequests();
				const request = requests.find((r) => r.id === requestId);
				if (!request) {
					return res.status(404).json({ message: 'Request not found' });
				}

				// Update stock quantity
				const stock = await storage.getStockById(request.stockId);
				if (!stock) {
					return res.status(404).json({ message: 'Stock not found' });
				}

				if (stock.quantity < request.quantity) {
					return res.status(400).json({ message: 'Insufficient stock quantity' });
				}

				const newQuantity = stock.quantity - request.quantity;
				await storage.updateStockQuantity(request.stockId, newQuantity);

				// Update request status with actual admin ID
				const updatedRequest = await storage.updateRequestStatus(
					requestId,
					'approved',
					adminNotes,
					req.user.id
				);

				// Create history entry
				await storage.createStockHistory({
					stockId: request.stockId,
					changeType: 'request_approved',
					quantity: -request.quantity,
					userId: request.userId,
					requestId: requestId,
					notes: `Request approved by admin (${req.user.email}): ${request.quantity} units allocated`,
				});

				res.json(updatedRequest);
			} catch (error) {
				console.error('Error approving request:', error);
				res.status(500).json({ message: 'Failed to approve request' });
			}
		}
	);

	// Admin-only: Deny request (secure version)
	app.put(
		'/api/admin/requests/:id/deny',
		authenticateToken,
		requireAdmin,
		async (req: AuthenticatedRequest, res) => {
			try {
				if (!req.user) {
					return res.status(401).json({ message: 'Authentication required' });
				}

				const { adminNotes } = req.body;
				const requestId = req.params.id;

				const updatedRequest = await storage.updateRequestStatus(
					requestId,
					'denied',
					adminNotes,
					req.user.id
				);
				res.json(updatedRequest);
			} catch (error) {
				console.error('Error denying request:', error);
				res.status(500).json({ message: 'Failed to deny request' });
			}
		}
	);

	const httpServer = createServer(app);
	return httpServer;
}
