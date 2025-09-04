import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Box, Users, ShoppingCart, LogIn, LogOut, Settings } from "lucide-react";

export function NavigationHeader() {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Box className="text-primary-foreground w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-foreground">StockFlow</h1>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`transition-colors ${location === "/" ? "text-foreground" : "text-muted-foreground hover:text-primary"}`}
              data-testid="nav-stock-catalog"
            >
              Stock Catalog
            </Link>
            {isAuthenticated && (
              <Link 
                href="/dashboard" 
                className={`transition-colors ${location === "/dashboard" ? "text-foreground" : "text-muted-foreground hover:text-primary"}`}
                data-testid="nav-dashboard"
              >
                Dashboard
              </Link>
            )}
            {isAuthenticated && user?.isAdmin && (
              <Link 
                href="/admin" 
                className={`transition-colors ${location === "/admin" ? "text-foreground" : "text-muted-foreground hover:text-primary"}`}
                data-testid="nav-admin"
              >
                Admin
              </Link>
            )}
          </nav>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  {user?.firstName || user?.email}
                </span>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleLogin}
                data-testid="button-login"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
