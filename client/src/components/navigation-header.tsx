import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Box, Users, ShoppingCart, LogIn, LogOut, Settings, Menu, X } from "lucide-react";

export function NavigationHeader() {
  const { isAuthenticated, profile, signOut } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
                <Box className="text-primary-foreground w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">StockFlow</h1>
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
            {isAuthenticated && profile?.is_admin && (
              <Link 
                href="/admin" 
                className={`transition-colors ${location === "/admin" ? "text-foreground" : "text-muted-foreground hover:text-primary"}`}
                data-testid="nav-admin"
              >
                Admin
              </Link>
            )}
          </nav>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                    {profile?.first_name || profile?.email}
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

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link 
                href="/" 
                className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                  location === "/" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                onClick={() => setMobileMenuOpen(false)}
                data-testid="mobile-nav-stock-catalog"
              >
                Stock Catalog
              </Link>
              {isAuthenticated && (
                <Link 
                  href="/dashboard" 
                  className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    location === "/dashboard" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="mobile-nav-dashboard"
                >
                  Dashboard
                </Link>
              )}
              {isAuthenticated && profile?.is_admin && (
                <Link 
                  href="/admin" 
                  className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    location === "/admin" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="mobile-nav-admin"
                >
                  Admin
                </Link>
              )}

              {/* Mobile Auth Section */}
              <div className="pt-4 border-t border-border mt-4">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="px-3 py-2">
                      <span className="text-sm text-muted-foreground block truncate">
                        {profile?.first_name || profile?.email}
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleLogout}
                      className="w-full justify-start"
                      data-testid="mobile-button-logout"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleLogin}
                    className="w-full justify-start"
                    data-testid="mobile-button-login"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}