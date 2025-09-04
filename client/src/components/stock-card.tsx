import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Ban } from "lucide-react";
import type { Stock } from "@shared/schema";

interface StockCardProps {
  stock: Stock;
  onRequestClick: (stock: Stock) => void;
}

export function StockCard({ stock, onRequestClick }: StockCardProps) {
  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: "Out of Stock", className: "bg-red-100 text-red-800" };
    if (quantity <= 5) return { label: "Low Stock", className: "bg-yellow-100 text-yellow-800" };
    return { label: "In Stock", className: "bg-green-100 text-green-800" };
  };

  const status = getStockStatus(stock.quantity);

  return (
    <div 
      className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow"
      data-testid={`card-stock-${stock.id}`}
    >
      <img 
        src={stock.imageUrl || "https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"} 
        alt={stock.name} 
        className="w-full h-48 object-cover rounded-t-lg"
        data-testid={`img-stock-${stock.id}`}
      />
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-foreground" data-testid={`text-stock-name-${stock.id}`}>
            {stock.name}
          </h3>
          <Badge className={status.className} data-testid={`badge-status-${stock.id}`}>
            {status.label}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm mb-3" data-testid={`text-stock-code-${stock.id}`}>
          Code: {stock.code}
        </p>
        <div className="flex justify-between items-center mb-4">
          <span 
            className={`text-2xl font-bold ${stock.quantity > 0 ? "text-primary" : "text-muted-foreground"}`}
            data-testid={`text-stock-quantity-${stock.id}`}
          >
            {stock.quantity}
          </span>
          <span className="text-muted-foreground text-sm">Available</span>
        </div>
        <Button
          onClick={() => onRequestClick(stock)}
          disabled={stock.quantity === 0}
          className="w-full"
          variant={stock.quantity === 0 ? "secondary" : "default"}
          data-testid={`button-request-stock-${stock.id}`}
        >
          {stock.quantity === 0 ? (
            <>
              <Ban className="w-4 h-4 mr-2" />
              Out of Stock
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Request Item
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
