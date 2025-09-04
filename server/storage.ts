import {
  users,
  stocks,
  stockRequests,
  stockHistory,
  type User,
  type UpsertUser,
  type Stock,
  type InsertStock,
  type StockRequest,
  type InsertStockRequest,
  type StockHistory,
  type InsertStockHistory,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Stock operations
  getAllStocks(): Promise<Stock[]>;
  getStockById(id: string): Promise<Stock | undefined>;
  createStock(stock: InsertStock): Promise<Stock>;
  updateStock(id: string, stock: Partial<InsertStock>): Promise<Stock>;
  deleteStock(id: string): Promise<void>;
  updateStockQuantity(id: string, newQuantity: number): Promise<Stock>;
  
  // Stock request operations
  createStockRequest(request: InsertStockRequest): Promise<StockRequest>;
  getStockRequests(): Promise<StockRequest[]>;
  getStockRequestsByUser(userId: string): Promise<StockRequest[]>;
  getStockRequestsByStock(stockId: string): Promise<StockRequest[]>;
  updateRequestStatus(id: string, status: string, adminNotes?: string, approvedBy?: string): Promise<StockRequest>;
  
  // Stock history operations
  createStockHistory(history: InsertStockHistory): Promise<StockHistory>;
  getStockHistory(stockId: string): Promise<StockHistory[]>;
  
  // Dashboard stats
  getDashboardStats(): Promise<{
    totalStockItems: number;
    pendingRequests: number;
    lowStockItems: number;
    totalUsers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Stock operations
  async getAllStocks(): Promise<Stock[]> {
    return await db.select().from(stocks).orderBy(desc(stocks.createdAt));
  }

  async getStockById(id: string): Promise<Stock | undefined> {
    const [stock] = await db.select().from(stocks).where(eq(stocks.id, id));
    return stock;
  }

  async createStock(stock: InsertStock): Promise<Stock> {
    const [newStock] = await db.insert(stocks).values(stock).returning();
    
    // Create history entry
    await this.createStockHistory({
      stockId: newStock.id,
      changeType: "added",
      quantity: stock.quantity,
      notes: "Initial stock creation",
    });
    
    return newStock;
  }

  async updateStock(id: string, stock: Partial<InsertStock>): Promise<Stock> {
    const [updatedStock] = await db
      .update(stocks)
      .set({ ...stock, updatedAt: new Date() })
      .where(eq(stocks.id, id))
      .returning();
    return updatedStock;
  }

  async deleteStock(id: string): Promise<void> {
    await db.delete(stocks).where(eq(stocks.id, id));
  }

  async updateStockQuantity(id: string, newQuantity: number): Promise<Stock> {
    const [updatedStock] = await db
      .update(stocks)
      .set({ quantity: newQuantity, updatedAt: new Date() })
      .where(eq(stocks.id, id))
      .returning();
    return updatedStock;
  }

  // Stock request operations
  async createStockRequest(request: InsertStockRequest): Promise<StockRequest> {
    const [newRequest] = await db.insert(stockRequests).values(request).returning();
    return newRequest;
  }

  async getStockRequests(): Promise<StockRequest[]> {
    return await db
      .select({
        id: stockRequests.id,
        userId: stockRequests.userId,
        stockId: stockRequests.stockId,
        quantity: stockRequests.quantity,
        reason: stockRequests.reason,
        status: stockRequests.status,
        adminNotes: stockRequests.adminNotes,
        approvedBy: stockRequests.approvedBy,
        createdAt: stockRequests.createdAt,
        updatedAt: stockRequests.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        stock: {
          id: stocks.id,
          name: stocks.name,
          code: stocks.code,
          imageUrl: stocks.imageUrl,
        },
      })
      .from(stockRequests)
      .leftJoin(users, eq(stockRequests.userId, users.id))
      .leftJoin(stocks, eq(stockRequests.stockId, stocks.id))
      .orderBy(desc(stockRequests.createdAt));
  }

  async getStockRequestsByUser(userId: string): Promise<StockRequest[]> {
    return await db
      .select()
      .from(stockRequests)
      .where(eq(stockRequests.userId, userId))
      .orderBy(desc(stockRequests.createdAt));
  }

  async getStockRequestsByStock(stockId: string): Promise<StockRequest[]> {
    return await db
      .select({
        id: stockRequests.id,
        userId: stockRequests.userId,
        stockId: stockRequests.stockId,
        quantity: stockRequests.quantity,
        reason: stockRequests.reason,
        status: stockRequests.status,
        adminNotes: stockRequests.adminNotes,
        approvedBy: stockRequests.approvedBy,
        createdAt: stockRequests.createdAt,
        updatedAt: stockRequests.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(stockRequests)
      .leftJoin(users, eq(stockRequests.userId, users.id))
      .where(eq(stockRequests.stockId, stockId))
      .orderBy(desc(stockRequests.createdAt));
  }

  async updateRequestStatus(id: string, status: string, adminNotes?: string, approvedBy?: string): Promise<StockRequest> {
    const [updatedRequest] = await db
      .update(stockRequests)
      .set({
        status,
        adminNotes,
        approvedBy,
        updatedAt: new Date(),
      })
      .where(eq(stockRequests.id, id))
      .returning();
    return updatedRequest;
  }

  // Stock history operations
  async createStockHistory(history: InsertStockHistory): Promise<StockHistory> {
    const [newHistory] = await db.insert(stockHistory).values(history).returning();
    return newHistory;
  }

  async getStockHistory(stockId: string): Promise<StockHistory[]> {
    return await db
      .select({
        id: stockHistory.id,
        stockId: stockHistory.stockId,
        changeType: stockHistory.changeType,
        quantity: stockHistory.quantity,
        userId: stockHistory.userId,
        requestId: stockHistory.requestId,
        notes: stockHistory.notes,
        createdAt: stockHistory.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(stockHistory)
      .leftJoin(users, eq(stockHistory.userId, users.id))
      .where(eq(stockHistory.stockId, stockId))
      .orderBy(desc(stockHistory.createdAt));
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalStockItems: number;
    pendingRequests: number;
    lowStockItems: number;
    totalUsers: number;
  }> {
    const [totalStockItems] = await db
      .select({ count: sql<number>`count(*)` })
      .from(stocks);

    const [pendingRequests] = await db
      .select({ count: sql<number>`count(*)` })
      .from(stockRequests)
      .where(eq(stockRequests.status, "pending"));

    const [lowStockItems] = await db
      .select({ count: sql<number>`count(*)` })
      .from(stocks)
      .where(sql`${stocks.quantity} <= 5`);

    const [totalUsers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    return {
      totalStockItems: totalStockItems.count,
      pendingRequests: pendingRequests.count,
      lowStockItems: lowStockItems.count,
      totalUsers: totalUsers.count,
    };
  }
}

export const storage = new DatabaseStorage();

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export { type User, type Stock, type StockRequest, type StockHistory };
