"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Calendar,
  Bell,
  ClipboardCheck,
  FileBarChart,
  FileText,
  Megaphone,
  UserCheck,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const sharedMenuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tasks", href: "/tasks", icon: FolderKanban },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Monitoring", href: "/monitoring", icon: ClipboardCheck },
  { name: "Laporan", href: "/reports", icon: FileBarChart },
  { name: "Dokumen", href: "/documents", icon: FileText },
  { name: "Pengumuman", href: "/announcements", icon: Megaphone },
  { name: "Kehadiran", href: "/attendance", icon: UserCheck },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

const managerMenuItems = [
  ...sharedMenuItems.slice(0, 2),
  { name: "Team", href: "/team", icon: Users },
  ...sharedMenuItems.slice(2),
];

const adminMenuItems = [
  ...managerMenuItems,
  { name: "Admin Dashboard", href: "/dashboard/admin", icon: ShieldCheck },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Departments", href: "/admin/departments", icon: ShieldCheck },
  { name: "Teams", href: "/admin/teams", icon: Users },
  { name: "Audit Log", href: "/audit-logs", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((response) => response.ok ? response.json() : null)
      .then((session) => {
        if (active) setRole(session?.user?.role ?? null);
      })
      .catch(() => {
        if (active) setRole(null);
      });
    return () => { active = false; };
  }, []);

  const visibleMenuItems = role === "ADMIN" ? adminMenuItems : role === "MANAGER" ? managerMenuItems : sharedMenuItems;

  return (
    <aside className={cn("flex h-full min-h-0 flex-col border-r bg-background transition-all duration-200", collapsed ? "w-16" : "w-64")}>
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && <span className="text-lg font-bold">OfficeHub</span>}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {visibleMenuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.name} href={item.href} prefetch onMouseEnter={() => router.prefetch(item.href)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground", isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground")}>
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-2">
        <Link href="/settings" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground")}>
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
