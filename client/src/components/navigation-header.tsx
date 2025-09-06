
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Package } from "lucide-react";
import { Link, useLocation } from "wouter";

export function NavigationHeader() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = location.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Package className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              Stock Manager
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className={`transition-colors hover:text-foreground/80 ${
                location === "/" ? "text-foreground" : "text-foreground/60"
              }`}
            >
              Catalog
            </Link>
            <Link
              href="/admin"
              className={`transition-colors hover:text-foreground/80 ${
                isAdmin ? "text-foreground" : "text-foreground/60"
              }`}
            >
              Admin
            </Link>
          </nav>
        </div>

        {/* Mobile menu button */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="absolute top-14 left-0 right-0 z-50 md:hidden">
            <div className="border-b bg-background p-4 shadow-lg">
              <nav className="flex flex-col space-y-3">
                <Link
                  href="/"
                  className={`transition-colors hover:text-foreground/80 ${
                    location === "/" ? "text-foreground" : "text-foreground/60"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Catalog
                </Link>
                <Link
                  href="/admin"
                  className={`transition-colors hover:text-foreground/80 ${
                    isAdmin ? "text-foreground" : "text-foreground/60"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
