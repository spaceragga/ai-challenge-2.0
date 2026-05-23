import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CalendarDays, Ticket, LayoutDashboard, LogOut, Shield } from "lucide-react";

export function AppHeader() {
  const { user, isHost, signOut } = useAuth();
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/explore" className="flex items-center gap-2 font-semibold tracking-tight">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <CalendarDays className="h-4 w-4" />
          </div>
          EventPass
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/explore"><Button variant="ghost" size="sm">Explore</Button></Link>
          {user && <Link to="/tickets"><Button variant="ghost" size="sm"><Ticket className="mr-1 h-4 w-4"/>Tickets</Button></Link>}
          {user && isHost && (
            <>
              <Link to="/dashboard"><Button variant="ghost" size="sm"><Shield className="mr-1 h-4 w-4"/>Dashboard</Button></Link>
              <Link to="/my-events"><Button variant="ghost" size="sm"><LayoutDashboard className="mr-1 h-4 w-4"/>My Events</Button></Link>
            </>
          )}
          {user && !isHost && (
            <Link to="/host/register"><Button variant="ghost" size="sm">Become a host</Button></Link>
          )}
          {user ? (
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); nav({ to: "/explore" }); }}>
              <LogOut className="mr-1 h-4 w-4"/>Sign out
            </Button>
          ) : (
            <>
              <Link to="/sign-in"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link to="/sign-up"><Button size="sm">Sign up</Button></Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
