import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  isAdmin: boolean("is_admin").default(false),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stock items table
export const stocks = pgTable("stocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  quantity: integer("quantity").notNull().default(0),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stock requests table
export const stockRequests = pgTable("stock_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  stockId: varchar("stock_id").notNull(),
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, denied
  adminNotes: text("admin_notes"),
  approvedBy: varchar("approved_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stock history table for tracking quantity changes
export const stockHistory = pgTable("stock_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stockId: varchar("stock_id").notNull(),
  changeType: varchar("change_type", { length: 20 }).notNull(), // added, removed, request_approved
  quantity: integer("quantity").notNull(),
  userId: varchar("user_id"),
  requestId: varchar("request_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  requests: many(stockRequests),
  stockHistory: many(stockHistory),
}));

export const stocksRelations = relations(stocks, ({ many }) => ({
  requests: many(stockRequests),
  history: many(stockHistory),
}));

export const stockRequestsRelations = relations(stockRequests, ({ one }) => ({
  user: one(users, {
    fields: [stockRequests.userId],
    references: [users.id],
  }),
  stock: one(stocks, {
    fields: [stockRequests.stockId],
    references: [stocks.id],
  }),
  approver: one(users, {
    fields: [stockRequests.approvedBy],
    references: [users.id],
  }),
}));

export const stockHistoryRelations = relations(stockHistory, ({ one }) => ({
  stock: one(stocks, {
    fields: [stockHistory.stockId],
    references: [stocks.id],
  }),
  user: one(users, {
    fields: [stockHistory.userId],
    references: [users.id],
  }),
  request: one(stockRequests, {
    fields: [stockHistory.requestId],
    references: [stockRequests.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users)
.omit({
  id: true,
  createdAt: true,
})
.extend({
  email: z.string().email({ message: "Invalid email address" }),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  password_hash: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const insertStockSchema = createInsertSchema(stocks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, { message: "Name is required" }),
  code: z.string().min(1, { message: "Code is required" }),
  quantity: z.number().min(0, { message: "Quantity cannot be negative" }), 
  category: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  imageFile: z.any().optional(),
  description: z.string().nullable().optional(),
});

export const insertStockRequestSchema = createInsertSchema(stockRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
});

export const insertStockHistorySchema = createInsertSchema(stockHistory).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type SafeUser = Omit<User, 'password_hash' | 'isAdmin'>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Stock = typeof stocks.$inferSelect;
export type InsertStock = z.infer<typeof insertStockSchema>;
export type StockRequest = typeof stockRequests.$inferSelect;
export type InsertStockRequest = z.infer<typeof insertStockRequestSchema>;
export type StockHistory = typeof stockHistory.$inferSelect;
export type InsertStockHistory = z.infer<typeof insertStockHistorySchema>;
