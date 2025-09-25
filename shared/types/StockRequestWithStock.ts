import type { StockRequest, Stock } from "@shared/schema";

type StockFields = Pick<Stock, "name" | "code" | "imageUrl">;

export type StockRequestWithStock = Omit<StockRequest, "stockId" | "approvedBy"> & {
  stockId: string;
  stock: StockFields | null; 
};