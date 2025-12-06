import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { NavigationHeader } from "@/components/navigation-header";
import { Button } from "@/components/ui/button";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StockManagementTab from "@/components/admin-dashboard-tabs/StockManagementTab";
import UsersTab from "@/components/admin-dashboard-tabs/UsersTab";
import RequestsTab from "@/components/admin-dashboard-tabs/RequestsTab";
import OverviewTab from "@/components/admin-dashboard-tabs/OverviewTab";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { isAdmin, isAuthenticated, loading } = useAuth();
  const [location, navigate] = useLocation();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      navigate("/login");
    }
  }, [isAuthenticated, loading]);

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
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => navigate("/")}>
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
             <OverviewTab />
          </TabsContent>

          <TabsContent value="stock-management" className="space-y-4 sm:space-y-6">
            <StockManagementTab />
          </TabsContent>

          <TabsContent value="requests" className="space-y-4 sm:space-y-6">
              <RequestsTab />
          </TabsContent>

          <TabsContent value="users" className="space-y-4 sm:space-y-6">
              <UsersTab />            
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}
