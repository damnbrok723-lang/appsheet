"use client";

import { LayoutDashboard, FolderKanban, Users, Calendar, BarChart3, ClipboardCheck, FileBarChart, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const employeeItems = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tasks", href: "/tasks", icon: FolderKanban },
  { name: "Monitoring", href: "/monitoring", icon: ClipboardCheck },
  { name: "Laporan", href: "/reports", icon: FileBarChart },
  { name: "More", href: "/notifications", icon: BarChart3 },
];

const managerItems = [
  ...employeeItems.slice(0, 2),
  { name: "Team", href: "/team", icon: Users },
  { name: "Laporan", href: "/reports", icon: FileBarChart },
  { name: "More", href: "/notifications", icon: BarChart3 },
];

const adminItems = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Admin", href: "/dashboard/admin", icon: ShieldCheck },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Audit", href: "/audit-logs", icon: ShieldCheck },
  { name: "More", href: "/notifications", icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((response) => response.ok ? response.json() : null)
      .then((session) => { if (active) setRole(session?.user?.role ?? null); })
      .catch(() => { if (active) setRole(null); });
    return () => { active = false; };
  }, []);

  const mobileItems = role === "ADMIN" ? adminItems : role === "MANAGER" ? managerItems : employeeItems;

  return (
    <nav className="z-20 shrink-0 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-center justify-around py-1">
        {mobileItems.map((item) => {
          const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/");
          return (
            <Link key={item.name} href={item.href} className={cn("flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors", isActive ? "text-primary" : "text-muted-foreground")}>
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
