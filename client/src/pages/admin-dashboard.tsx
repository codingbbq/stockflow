import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NavigationHeader } from "@/components/navigation-header";
import { AddStockModal } from "@/components/add-stock-modal";
import { StockDetailModal } from "@/components/stock-detail-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Box,
  Clock,
  AlertTriangle,
  Users,
  Plus,
  Edit,
  BarChart3,
  Trash2,
  Check,
  X,
} from "lucide-react";
import type { Stock, StockRequest } from "@shared/schema";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addStockModalOpen, setAddStockModalOpen] = useState(false);
  const [stockDetailModalOpen, setStockDetailModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | undefined>();
  const [requestFilter, setRequestFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: stocks, isLoading: stocksLoading } = useQuery<Stock[]>({
    queryKey: ["/api/stocks"],
  });

  const { data: requests, isLoading: requestsLoading } = useQuery<StockRequest[]>({
    queryKey: ["/api/admin/requests"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/dashboard/stats"],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes?: string }) => {
      await apiRequest("PUT", `/api/admin/requests/${id}/approve`, { adminNotes });
    },
    onSuccess: () => {
      toast({
        title: "Request approved",
        description: "Stock request has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    },
  });

  const denyMutation = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes?: string }) => {
      await apiRequest("PUT", `/api/admin/requests/${id}/deny`, { adminNotes });
    },
    onSuccess: () => {
      toast({
        title: "Request denied",
        description: "Stock request has been denied.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/requests"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to deny request",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/stocks/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Stock deleted",
        description: "Stock item has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete stock",
        variant: "destructive",
      });
    },
  });

  const filteredRequests = requests?.filter(request => {
    const matchesFilter = requestFilter === "all" || request.status === requestFilter;
    const matchesSearch = !searchTerm || 
      (request as any).user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request as any).user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request as any).stock?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your inventory system</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="stock-management" data-testid="tab-stock-management">Stock Management</TabsTrigger>
            <TabsTrigger value="requests" data-testid="tab-requests">Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Stock Items</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-total-stock">
                        {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalStockItems || 0}
                      </p>
                    </div>
                    <Box className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Pending Requests</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-pending-requests">
                        {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.pendingRequests || 0}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Low Stock Items</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-low-stock">
                        {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.lowStockItems || 0}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Users</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-total-users">
                        {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalUsers || 0}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {requestsLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {requests?.slice(0, 5).map((request: any) => (
                        <div key={request.id} className="flex items-center justify-between py-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {(request.user?.firstName?.[0] || request.user?.email?.[0] || "U").toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {request.user?.firstName || request.user?.email || "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {request.stock?.name} ({request.quantity} qty)
                              </p>
                            </div>
                          </div>
                          <Badge className={
                            request.status === "approved" ? "bg-green-100 text-green-800" :
                            request.status === "denied" ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"
                          }>
                            {request.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stock Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stocksLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : (
                      stocks?.filter(stock => stock.quantity <= 5).map((stock) => (
                        <div key={stock.id} className={`flex items-center space-x-3 p-3 rounded-lg ${
                          stock.quantity === 0 ? "bg-red-50" : "bg-yellow-50"
                        }`}>
                          {stock.quantity === 0 ? (
                            <X className="text-red-500 w-5 h-5" />
                          ) : (
                            <AlertTriangle className="text-yellow-500 w-5 h-5" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {stock.name} {stock.quantity === 0 ? "out of stock" : "low stock"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {stock.code} • {stock.quantity} remaining
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stock-management" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Stock Management</h2>
                <p className="text-muted-foreground">Add, edit, and manage your inventory</p>
              </div>
              <Button onClick={() => setAddStockModalOpen(true)} data-testid="button-add-stock">
                <Plus className="w-4 h-4 mr-2" />
                Add New Stock
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Image</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Code</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Quantity</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {stocksLoading ? (
                        [...Array(5)].map((_, i) => (
                          <tr key={i}>
                            {[...Array(6)].map((_, j) => (
                              <td key={j} className="py-3 px-4">
                                <Skeleton className="h-8 w-full" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        stocks?.map((stock) => (
                          <tr key={stock.id} data-testid={`row-stock-${stock.id}`}>
                            <td className="py-3 px-4">
                              <img
                                src={stock.imageUrl || "https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                                alt={stock.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            </td>
                            <td className="py-3 px-4 font-medium text-foreground">{stock.name}</td>
                            <td className="py-3 px-4 text-muted-foreground">{stock.code}</td>
                            <td className="py-3 px-4 text-foreground">{stock.quantity}</td>
                            <td className="py-3 px-4">
                              <Badge className={
                                stock.quantity === 0 ? "bg-red-100 text-red-800" :
                                stock.quantity <= 5 ? "bg-yellow-100 text-yellow-800" :
                                "bg-green-100 text-green-800"
                              }>
                                {stock.quantity === 0 ? "Out of Stock" :
                                 stock.quantity <= 5 ? "Low Stock" : "In Stock"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedStock(stock);
                                    setStockDetailModalOpen(true);
                                  }}
                                  data-testid={`button-view-stock-${stock.id}`}
                                >
                                  <BarChart3 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => deleteMutation.mutate(stock.id)}
                                  disabled={deleteMutation.isPending}
                                  data-testid={`button-delete-stock-${stock.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground">Request Management</h2>
              <p className="text-muted-foreground">Review and manage stock requests</p>
            </div>

            {/* Request Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4">
                  <Select value={requestFilter} onValueChange={setRequestFilter}>
                    <SelectTrigger className="w-40" data-testid="select-request-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Requests</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="denied">Denied</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Search by user or item..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-0"
                    data-testid="input-search-requests"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Requests Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-foreground">User</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Item</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Quantity</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {requestsLoading ? (
                        [...Array(5)].map((_, i) => (
                          <tr key={i}>
                            {[...Array(6)].map((_, j) => (
                              <td key={j} className="py-4 px-4">
                                <Skeleton className="h-8 w-full" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        filteredRequests?.map((request: any) => (
                          <tr key={request.id} data-testid={`row-request-${request.id}`}>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium">
                                    {(request.user?.firstName?.[0] || request.user?.email?.[0] || "U").toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {request.user?.firstName || request.user?.email || "Unknown"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {request.user?.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={request.stock?.imageUrl || "https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                                  alt={request.stock?.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                                <div>
                                  <p className="font-medium text-foreground">{request.stock?.name}</p>
                                  <p className="text-xs text-muted-foreground">{request.stock?.code}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-foreground">{request.quantity}</td>
                            <td className="py-4 px-4 text-muted-foreground">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={
                                request.status === "approved" ? "bg-green-100 text-green-800" :
                                request.status === "denied" ? "bg-red-100 text-red-800" :
                                "bg-yellow-100 text-yellow-800"
                              }>
                                {request.status}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              {request.status === "pending" ? (
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => approveMutation.mutate({ id: request.id })}
                                    disabled={approveMutation.isPending}
                                    data-testid={`button-approve-${request.id}`}
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => denyMutation.mutate({ id: request.id })}
                                    disabled={denyMutation.isPending}
                                    data-testid={`button-deny-${request.id}`}
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Deny
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">Completed</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AddStockModal
        open={addStockModalOpen}
        onOpenChange={setAddStockModalOpen}
      />

      <StockDetailModal
        open={stockDetailModalOpen}
        onOpenChange={setStockDetailModalOpen}
        stock={selectedStock}
      />
    </div>
  );
}
