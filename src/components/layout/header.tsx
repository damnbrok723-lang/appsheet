"use client";

import { LogOut, Menu, Search, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";

export function Header() {
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    queryClient.clear();
    await signOut({ callbackUrl: "/login" });
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
            <input type="search" placeholder="Search..." className="h-9 w-full rounded-lg border bg-transparent pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent sm:w-[300px] lg:w-[400px]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsDropdown />
          <Button variant="ghost" size="icon" asChild={false}>
            <Link href="/profile"><User className="h-5 w-5" /></Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} disabled={isLoggingOut} aria-label="Keluar" title="Keluar">
            <LogOut className={isLoggingOut ? "h-5 w-5 animate-pulse" : "h-5 w-5"} />
          </Button>
        </div>
      </div>
    </header>
  );
}
