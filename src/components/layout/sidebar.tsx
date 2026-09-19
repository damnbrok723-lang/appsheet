"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  BarChart3,
  ClipboardList,
  Wrench,
  FileBarChart,
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type UserSession = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  permissions?: string[];
};

import { hasPermission, CardId } from "@/lib/card-permissions";

const menuItems: { name: string; href: string; icon: LucideIcon; permission: CardId }[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "nav_dashboard" },
  { name: "Grafik SAP", href: "/grafik-sap", icon: BarChart3, permission: "nav_grafik_sap" },
  { name: "Stok NCR", href: "/stok-ncr", icon: ClipboardList, permission: "nav_stok_ncr" },
  { name: "Output Repair", href: "/output-repair", icon: Wrench, permission: "nav_repair" },
  { name: "Laporan", href: "/reports", icon: FileBarChart, permission: "nav_laporan" },
  { name: "Monitoring", href: "/monitoring", icon: Activity, permission: "nav_dashboard" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
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

  const userRole = user?.role ?? "EMPLOYEE";
  const userPermissions = user?.permissions;
  const filteredMenuItems = menuItems.filter(
    (item) => hasPermission(item.permission, userRole, userPermissions)
  );

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 flex h-screen flex-col border-r bg-background transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">OfficeHub</span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground font-semibold" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER USER PROFILE & LOGOUT */}
      <div className="border-t p-3 space-y-2 bg-muted/20">
        {!collapsed && user && (
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
              {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-foreground">{user.name || "User"}</p>
              <span className="inline-block text-[10px] font-medium px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                {user.role || "EMPLOYEE"}
              </span>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size={collapsed ? "icon" : "default"}
          onClick={handleLogout}
          className={cn(
            "w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-xs font-semibold",
            collapsed && "h-10 w-10 p-0 justify-center"
          )}
          title="Keluar / Logout"
        >
          <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
          {!collapsed && <span>Keluar / Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
