"use client";

import { useEffect, useState } from "react";
import { LogOut, Menu, Search, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";

type UserSession = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

export function Header() {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search..."
              className="h-9 w-full rounded-lg border bg-transparent pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent sm:w-[300px] lg:w-[400px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationsDropdown />

          {user ? (
            <div className="flex items-center gap-2 border-l pl-3">
              <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold leading-tight">{user.name || "User"}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{user.role || "EMPLOYEE"}</p>
                </div>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-8 px-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                title="Keluar / Logout"
              >
                <LogOut className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
