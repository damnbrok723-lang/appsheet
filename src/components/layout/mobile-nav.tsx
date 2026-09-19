"use client";

import { LayoutDashboard, ClipboardList, Wrench, FileBarChart, Activity, User, BarChart3 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

import { useEffect, useState } from "react";
import { hasPermission, CardId } from "@/lib/card-permissions";

const mobileItems: { name: string; href: string; icon: LucideIcon; permission?: CardId }[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "nav_dashboard" },
  { name: "Grafik SAP", href: "/grafik-sap", icon: BarChart3, permission: "nav_grafik_sap" },
  { name: "Stok NCR", href: "/stok-ncr", icon: ClipboardList, permission: "nav_stok_ncr" },
  { name: "Output Repair", href: "/output-repair", icon: Wrench, permission: "nav_repair" },
  { name: "Laporan", href: "/reports", icon: FileBarChart, permission: "nav_laporan" },
  { name: "Monitoring", href: "/monitoring", icon: Activity, permission: "nav_dashboard" },
  { name: "Profil", href: "/profile", icon: User }, // Always show
];

type UserSession = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  permissions?: string[];
};

export function MobileNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const userRole = user?.role ?? "EMPLOYEE";
  const userPermissions = user?.permissions;
  const filteredItems = mobileItems.filter(
    (item) => !item.permission || hasPermission(item.permission, userRole, userPermissions)
  );

  return (
    <nav
      aria-label="Navigasi utama mobile"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/97 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around px-1 py-1">
        {filteredItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href)) ||
            (item.href === "/dashboard" && pathname === "/");

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium transition-all duration-150",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Active pill indicator */}
              {isActive && (
                <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary" />
              )}
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-150",
                  isActive && "scale-110"
                )}
              />
              <span className="truncate w-full text-center leading-tight">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
