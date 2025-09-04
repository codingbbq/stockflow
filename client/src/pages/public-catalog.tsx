import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { NavigationHeader } from "@/components/navigation-header";
import { StockCard } from "@/components/stock-card";
import { RequestModal } from "@/components/request-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, Grid, List, Plus } from "lucide-react";
import type { Stock } from "@shared/schema";

export default function PublicCatalog() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | undefined>();

  const { data: stocks, isLoading } = useQuery<Stock[]>({
    queryKey: ["/api/stocks"],
  });

  const filteredStocks = stocks?.filter(stock => {
    const matchesSearch = stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stock.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || stock.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = stocks ? Array.from(new Set(stocks.map(s => s.category).filter(Boolean))) : [];

  const handleRequestClick = (stock: Stock) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to request stock items.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1500);
      return;
    }
    setSelectedStock(stock);
    setRequestModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-chart-3 text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Stock Catalog</h1>
          <p className="text-xl text-primary-foreground/90 mb-8">Browse available inventory and request items</p>
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search stocks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 bg-card text-foreground border-0 shadow-lg"
                data-testid="input-search-stocks"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* Stock Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Available Stock</h2>
              <p className="text-muted-foreground">Browse and request inventory items</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40" data-testid="select-category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category!}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg border border-border p-4">
                  <Skeleton className="w-full h-48 mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : filteredStocks && filteredStocks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStocks.map((stock) => (
                <StockCard
                  key={stock.id}
                  stock={stock}
                  onRequestClick={handleRequestClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-xl font-semibold text-foreground mb-2">No stocks found</p>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </section>

      <RequestModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
        stocks={stocks || []}
        selectedStock={selectedStock}
      />
    </div>
  );
}
