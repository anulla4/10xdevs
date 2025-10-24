import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  isAuthenticated: boolean;
  user?: { email?: string };
}

export function Header({ isAuthenticated, user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 md:px-6">
        {/* Logo / Brand */}
        <div className="flex items-center gap-6">
          <a
            href={isAuthenticated ? "/panel" : "/"}
            className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl">🌿</span>
            <span className="hidden sm:inline">Nature Log</span>
          </a>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* User info */}
              {user?.email && (
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground mr-2">
                  <User className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
              )}

              {/* Panel link */}
              <Button variant="ghost" size="sm" asChild>
                <a href="/panel">Panel</a>
              </Button>

              {/* Logout button */}
              <Button variant="outline" size="sm" asChild>
                <a href="/auth/logout" className="flex items-center gap-2" data-test-id="nav-logout">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Wyloguj</span>
                </a>
              </Button>
            </>
          ) : (
            <>
              {/* Login button */}
              <Button variant="ghost" size="sm" asChild>
                <a href="/auth/login" data-test-id="nav-login">Zaloguj się</a>
              </Button>

              {/* Register button */}
              <Button size="sm" asChild>
                <a href="/auth/register">Zarejestruj się</a>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
