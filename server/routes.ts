import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertStockSchema, insertStockRequestSchema, insertStockHistorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public stock routes
  app.get("/api/stocks", async (req, res) => {
    try {
      const stocks = await storage.getAllStocks();
      res.json(stocks);
    } catch (error) {
      console.error("Error fetching stocks:", error);
      res.status(500).json({ message: "Failed to fetch stocks" });
    }
  });

  app.get("/api/stocks/:id", async (req, res) => {
    try {
      const stock = await storage.getStockById(req.params.id);
      if (!stock) {
        return res.status(404).json({ message: "Stock not found" });
      }
      res.json(stock);
    } catch (error) {
      console.error("Error fetching stock:", error);
      res.status(500).json({ message: "Failed to fetch stock" });
    }
  });

  // Protected user routes
  app.post("/api/requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestData = insertStockRequestSchema.parse({
        ...req.body,
        userId,
      });

      // Check if stock exists and has enough quantity
      const stock = await storage.getStockById(requestData.stockId);
      if (!stock) {
        return res.status(404).json({ message: "Stock not found" });
      }

      if (stock.quantity < requestData.quantity) {
        return res.status(400).json({ message: "Insufficient stock quantity" });
      }

      const request = await storage.createStockRequest(requestData);
      res.json(request);
    } catch (error) {
      console.error("Error creating request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create request" });
    }
  });

  app.get("/api/requests/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getStockRequestsByUser(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching user requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  // Admin routes
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Failed to verify admin access" });
    }
  };

  app.post("/api/admin/stocks", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stockData = insertStockSchema.parse(req.body);
      const stock = await storage.createStock(stockData);
      res.json(stock);
    } catch (error) {
      console.error("Error creating stock:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid stock data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create stock" });
    }
  });

  app.put("/api/admin/stocks/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stockData = insertStockSchema.partial().parse(req.body);
      const stock = await storage.updateStock(req.params.id, stockData);
      res.json(stock);
    } catch (error) {
      console.error("Error updating stock:", error);
      res.status(500).json({ message: "Failed to update stock" });
    }
  });

  app.delete("/api/admin/stocks/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteStock(req.params.id);
      res.json({ message: "Stock deleted successfully" });
    } catch (error) {
      console.error("Error deleting stock:", error);
      res.status(500).json({ message: "Failed to delete stock" });
    }
  });

  app.get("/api/admin/requests", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const requests = await storage.getStockRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.put("/api/admin/requests/:id/approve", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { adminNotes } = req.body;
      const requestId = req.params.id;
      const adminId = req.user.claims.sub;

      // Get the request details
      const requests = await storage.getStockRequests();
      const request = requests.find(r => r.id === requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Update stock quantity
      const stock = await storage.getStockById(request.stockId);
      if (!stock) {
        return res.status(404).json({ message: "Stock not found" });
      }

      if (stock.quantity < request.quantity) {
        return res.status(400).json({ message: "Insufficient stock quantity" });
      }

      const newQuantity = stock.quantity - request.quantity;
      await storage.updateStockQuantity(request.stockId, newQuantity);

      // Update request status
      const updatedRequest = await storage.updateRequestStatus(requestId, "approved", adminNotes, adminId);

      // Create history entry
      await storage.createStockHistory({
        stockId: request.stockId,
        changeType: "request_approved",
        quantity: -request.quantity,
        userId: request.userId,
        requestId: requestId,
        notes: `Request approved by admin: ${request.quantity} units allocated`,
      });

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error approving request:", error);
      res.status(500).json({ message: "Failed to approve request" });
    }
  });

  app.put("/api/admin/requests/:id/deny", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { adminNotes } = req.body;
      const requestId = req.params.id;
      const adminId = req.user.claims.sub;

      const updatedRequest = await storage.updateRequestStatus(requestId, "denied", adminNotes, adminId);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error denying request:", error);
      res.status(500).json({ message: "Failed to deny request" });
    }
  });

  app.get("/api/admin/stocks/:id/history", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const history = await storage.getStockHistory(req.params.id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching stock history:", error);
      res.status(500).json({ message: "Failed to fetch stock history" });
    }
  });

  app.get("/api/admin/stocks/:id/requests", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const requests = await storage.getStockRequestsByStock(req.params.id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching stock requests:", error);
      res.status(500).json({ message: "Failed to fetch stock requests" });
    }
  });

  app.get("/api/admin/dashboard/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
