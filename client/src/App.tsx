import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import PublicCatalog from "@/pages/public-catalog";
import UserDashboard from "@/pages/user-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  return (
    <Switch>
      <Route path="/" component={PublicCatalog} />
      <Route path="/dashboard">
        {isAuthenticated && user ? (
          user.isAdmin ? <AdminDashboard /> : <UserDashboard />
        ) : (
          <PublicCatalog />
        )}
      </Route>
      <Route path="/admin">
        {isAuthenticated && user?.isAdmin ? <AdminDashboard /> : <PublicCatalog />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
