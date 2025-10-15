import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Check, Clock, X } from "lucide-react";
import type { Stock, StockHistory, StockRequest } from "@shared/schema";

interface StockDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock?: Stock;
}

export function StockDetailModal({ open, onOpenChange, stock }: StockDetailModalProps) {
  const { data: history, isLoading: historyLoading } = useQuery<StockHistory[]>({
    queryKey: ["/api/stocks", stock?.id, "history"],
    enabled: open && !!stock?.id,
  });

  const { data: requests } = useQuery<StockRequest[]>({
    queryKey: ["/api/stocks", stock?.id, "requests"],
    enabled: open && !!stock?.id,
  });

  if (!stock) return null;

  const pendingRequests = requests?.filter(r => r.status === "pending")?.length || 0;
  const totalAllocated = requests?.filter(r => r.status === "approved")
    ?.reduce((sum, r) => sum + r.quantity, 0) || 0;

  const getActivityIcon = (changeType: string) => {
    switch (changeType) {
      case "added":
        return <Plus className="text-green-600 w-4 h-4" />;
      case "request_approved":
        return <Check className="text-blue-600 w-4 h-4" />;
      case "removed":
        return <X className="text-red-600 w-4 h-4" />;
      default:
        return <Clock className="text-yellow-600 w-4 h-4" />;
    }
  };

  const getActivityBgColor = (changeType: string) => {
    switch (changeType) {
      case "added":
        return "bg-green-50";
      case "request_approved":
        return "bg-blue-50";
      case "removed":
        return "bg-red-50";
      default:
        return "bg-yellow-50";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto" data-testid="modal-stock-detail">
        <DialogHeader className="flex flex-row items-center space-x-4 space-y-0">
          <img 
            src={stock.imageUrl || "https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"} 
            alt={stock.name} 
            className="w-16 h-16 object-cover rounded-lg"
            data-testid={`img-stock-detail-${stock.id}`}
          />
          <div>
            <DialogTitle data-testid={`text-stock-detail-name-${stock.id}`}>
              {stock.name}
            </DialogTitle>
            <p className="text-muted-foreground" data-testid={`text-stock-detail-code-${stock.id}`}>
              Code: {stock.code}
            </p>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Stats */}
          <div className="lg:col-span-1">
            <h4 className="font-semibold text-foreground mb-4">Current Status</h4>
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Current Stock</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-current-stock">
                  {stock.quantity}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold text-yellow-600" data-testid="text-pending-requests">
                  {pendingRequests}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total Allocated</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-total-allocated">
                  {totalAllocated}
                </p>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-foreground mb-4">Recent Activity</h4>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {historyLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                history?.slice(0, 10).map((item) => (
                  <div 
                    key={item.id} 
                    className={`flex items-start space-x-3 p-3 rounded-lg ${getActivityBgColor(item.changeType)}`}
                    data-testid={`activity-${item.id}`}
                  >
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      {getActivityIcon(item.changeType)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {item.changeType === "added" && "Stock Added"}
                        {item.changeType === "request_approved" && "Request Approved"}
                        {item.changeType === "removed" && "Stock Removed"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(item as any).user && `${(item as any).user.firstName || (item as any).user.email} • `}
                        {Math.abs(item.quantity)} units • {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
