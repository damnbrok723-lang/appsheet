"use client";

import { useEffect, useState } from "react";
import { LogOut, Search, User as UserIcon } from "lucide-react";
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
    <header className="sticky top-0 z-20 shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 min-w-0 items-center justify-between gap-2 px-3 md:h-16 md:px-6">
        {/* LEFT: App name on mobile (since sidebar is hidden) + search on sm+ */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* App name visible on mobile only (md: sidebar has it) */}
          <span className="shrink-0 text-base font-bold text-primary md:hidden">
            OfficeHub
          </span>

          {/* Search: hidden on very small screens, shown on sm+ */}
          <div className="relative hidden sm:block flex-1 max-w-xs lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Cari..."
              aria-label="Cari"
              className="h-9 w-full rounded-lg border bg-transparent pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        {/* RIGHT: notifications + user info + logout */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <NotificationsDropdown />

          {user ? (
            <div className="flex items-center gap-1.5 border-l pl-2 sm:gap-2 sm:pl-3">
              {/* Profile link with avatar */}
              <Link
                href="/profile"
                className="flex items-center gap-1.5 hover:opacity-80 transition min-w-0"
                aria-label="Profil saya"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs sm:h-8 sm:w-8">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
                </div>
                {/* Name + role: only on sm+ to prevent cramping */}
                <div className="hidden sm:block text-left min-w-0">
                  <p className="truncate text-xs font-semibold leading-tight max-w-[100px] lg:max-w-[140px]">
                    {user.name || "User"}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {user.role || "EMPLOYEE"}
                  </p>
                </div>
              </Link>

              {/* Logout button: icon only on mobile, icon+text on sm+ */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 sm:w-auto sm:px-2"
                title="Keluar / Logout"
                aria-label="Keluar"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:ml-1 sm:text-xs sm:font-semibold">
                  Logout
                </span>
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
