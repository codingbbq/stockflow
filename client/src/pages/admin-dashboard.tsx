import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { NavigationHeader } from "@/components/navigation-header";
import { AddStockModal } from "@/components/add-stock-modal";
import { AddUserModal } from "@/components/add-user-modal";
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
  const { isAuthenticated, profile, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addStockModalOpen, setAddStockModalOpen] = useState(false);
  const [stockDetailModalOpen, setStockDetailModalOpen] = useState(false);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | undefined>();
  const [requestFilter, setRequestFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // All hooks must be called before any conditional returns
  const { data: stocks, isLoading: stocksLoading } = useQuery<Stock[]>({
    queryKey: ["/api/stocks"],
    enabled: isAuthenticated && profile?.is_admin, // Only fetch if authorized
  });

  const { data: requests, isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/requests"],
    enabled: isAuthenticated && profile?.is_admin, // Only fetch if authorized
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalStockItems: number;
    pendingRequests: number;
    lowStockItems: number;
    totalUsers: number;
  }>({
    queryKey: ["/api/admin/dashboard/stats"],
    enabled: isAuthenticated && profile?.is_admin, // Only fetch if authorized
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && profile?.is_admin, // Only fetch if authorized
  });

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!loading && (!isAuthenticated || !profile?.is_admin)) {
      window.location.href = "/login";
    }
  }, [isAuthenticated, profile, loading]);

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

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ id, isAdmin }: { id: string; isAdmin: boolean }) => {
      await apiRequest("PUT", `/api/admin/users/${id}/toggle-admin`, { isAdmin });
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "User admin status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error", 
        description: error.message || "Failed to update user admin status",
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

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if not admin
  if (!isAuthenticated || !profile?.is_admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => window.location.href = "/"}>
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your inventory system</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="stock-management" data-testid="tab-stock-management" className="text-xs sm:text-sm">Stock Mgmt</TabsTrigger>
            <TabsTrigger value="requests" data-testid="tab-requests" className="text-xs sm:text-sm">Requests</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users" className="text-xs sm:text-sm">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Stock Items</p>
                      <p className="text-xl sm:text-2xl font-bold text-foreground" data-testid="stat-total-stock">
                        {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalStockItems || 0}
                      </p>
                    </div>
                    <Box className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Pending Requests</p>
                      <p className="text-xl sm:text-2xl font-bold text-foreground" data-testid="stat-pending-requests">
                        {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.pendingRequests || 0}
                      </p>
                    </div>
                    <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Low Stock Items</p>
                      <p className="text-xl sm:text-2xl font-bold text-foreground" data-testid="stat-low-stock">
                        {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.lowStockItems || 0}
                      </p>
                    </div>
                    <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Users</p>
                      <p className="text-xl sm:text-2xl font-bold text-foreground" data-testid="stat-total-users">
                        {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalUsers || 0}
                      </p>
                    </div>
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                      {requests?.slice(0, 5).map((request) => (
                        <div key={request.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 space-y-2 sm:space-y-0">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-muted rounded-full flex items-center justify-center shrink-0">
                              <span className="text-xs font-medium">
                                {(request.user?.firstName?.[0] || request.user?.email?.[0] || "U").toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {(request as any).user?.firstName || (request as any).user?.email || "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(request as any).stock?.name} ({request.quantity} qty)
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

          <TabsContent value="stock-management" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Stock Management</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Add, edit, and manage your inventory</p>
              </div>
              <Button onClick={() => setAddStockModalOpen(true)} data-testid="button-add-stock" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                <span className="sm:inline">Add New Stock</span>
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm">Image</th>
                        <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm">Name</th>
                        <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm">Code</th>
                        <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm">Quantity</th>
                        <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm">Status</th>
                        <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm">Actions</th>
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

          <TabsContent value="requests" className="space-y-4 sm:space-y-6">
            <div className="mb-4 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Request Management</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Review and manage stock requests</p>
            </div>

            {/* Request Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <Select value={requestFilter} onValueChange={setRequestFilter}>
                    <SelectTrigger className="w-full sm:w-40" data-testid="select-request-filter">
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
                  <table className="w-full min-w-[768px]">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm">User</th>
                        <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm">Item</th>
                        <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm">Qty</th>
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
                        filteredRequests?.map((request) => (
                          <tr key={request.id} data-testid={`row-request-${request.id}`}>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium">
                                    {((request as any).user?.firstName?.[0] || (request as any).user?.email?.[0] || "U").toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {(request as any).user?.firstName || (request as any).user?.email || "Unknown"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {(request as any).user?.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={(request as any).stock?.imageUrl || "https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                                  alt={(request as any).stock?.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                                <div>
                                  <p className="font-medium text-foreground">{(request as any).stock?.name}</p>
                                  <p className="text-xs text-muted-foreground">{(request as any).stock?.code}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-foreground">{request.quantity}</td>
                            <td className="py-4 px-4 text-muted-foreground">
                              {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Unknown date'}
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

          <TabsContent value="users" className="space-y-4 sm:space-y-6">

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Users Management</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Add, edit, and manage your users</p>
              </div>
              <Button onClick={() => setAddUserModalOpen(true)} data-testid="button-add-user" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                <span className="sm:inline">Add New User</span>
              </Button>
            </div>

            <Card>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">User</th>
                        <th className="text-left py-3 px-4 font-medium">Email</th>
                        <th className="text-left py-3 px-4 font-medium">Joined</th>
                        <th className="text-left py-3 px-4 font-medium">Admin</th>
                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersLoading ? (
                        [...Array(5)].map((_, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-4 px-4">
                              <Skeleton className="h-10 w-full" />
                            </td>
                            <td className="py-4 px-4">
                              <Skeleton className="h-6 w-32" />
                            </td>
                            <td className="py-4 px-4">
                              <Skeleton className="h-6 w-20" />
                            </td>
                            <td className="py-4 px-4">
                              <Skeleton className="h-6 w-16" />
                            </td>
                            <td className="py-4 px-4">
                              <Skeleton className="h-8 w-24" />
                            </td>
                          </tr>
                        ))
                      ) : (
                        users?.map((user: any) => (
                          <tr key={user.id} className="border-b hover:bg-muted/50">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-primary-foreground">
                                    {(user.first_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground" data-testid={`user-name-${user.id}`}>
                                    {user.first_name && user.last_name
                                      ? `${user.first_name} ${user.last_name}`
                                      : user.first_name || "Unknown User"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-muted-foreground" data-testid={`user-email-${user.id}`}>
                              {user.email}
                            </td>
                            <td className="py-4 px-4 text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={user.is_admin ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                {user.is_admin ? "Admin" : "User"}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <Button
                                size="sm"
                                variant={user.is_admin ? "destructive" : "default"}
                                onClick={() => toggleAdminMutation.mutate({ 
                                  id: user.id, 
                                  isAdmin: !user.is_admin 
                                })}
                                disabled={toggleAdminMutation.isPending}
                                data-testid={`button-toggle-admin-${user.id}`}
                              >
                                {user.is_admin ? "Remove Admin" : "Make Admin"}
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  {users && users.length === 0 && !usersLoading && (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-medium text-foreground">No users found</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Users will appear here once they sign up.
                      </p>
                    </div>
                  )}
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

      <AddUserModal
        open={addUserModalOpen}
        onOpenChange={setAddUserModalOpen}
      />
    </div>
  );
}
