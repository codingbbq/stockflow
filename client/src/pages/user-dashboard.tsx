import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Clock, CheckCircle, XCircle } from "lucide-react";
import type { StockRequest } from "@shared/schema";

export default function UserDashboard() {
  const { user } = useAuth();

  const { data: requests, isLoading } = useQuery<StockRequest[]>({
    queryKey: ["/api/requests/user"],
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "denied":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "denied":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter(r => r.status === "pending").length || 0,
    approved: requests?.filter(r => r.status === "approved").length || 0,
    denied: requests?.filter(r => r.status === "denied").length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.firstName || user?.email}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Requests</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="stat-total-requests">
                    {stats.total}
                  </p>
                </div>
                <ClipboardList className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-requests">
                    {stats.pending}
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
                  <p className="text-muted-foreground text-sm">Approved</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="stat-approved-requests">
                    {stats.approved}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Denied</p>
                  <p className="text-2xl font-bold text-red-600" data-testid="stat-denied-requests">
                    {stats.denied}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>My Stock Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : requests && requests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-foreground">Item</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Quantity</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {requests.map((request) => (
                      <tr key={request.id} data-testid={`row-user-request-${request.id}`}>
                        <td className="py-4 px-4">
                          <div className="font-medium text-foreground">{request.stockId}</div>
                          <div className="text-xs text-muted-foreground">{request.reason}</div>
                        </td>
                        <td className="py-4 px-4 text-foreground">{request.quantity}</td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(request.status)}
                            <Badge className={getStatusBadge(request.status)}>
                              {request.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground text-sm">
                          {request.adminNotes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl font-semibold text-foreground mb-2">No requests yet</p>
                <p className="text-muted-foreground">Start by requesting some stock items</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
