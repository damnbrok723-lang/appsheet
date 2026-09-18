"use client";

import { LayoutDashboard, ClipboardList, Factory, FileBarChart, Activity } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const mobileItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Stok NCR", href: "/stok-ncr", icon: ClipboardList },
  { name: "Output Repair", href: "/output-repair", icon: Factory },
  { name: "Laporan", href: "/reports", icon: FileBarChart },
  { name: "Monitoring", href: "/monitoring", icon: Activity },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)] md:hidden">
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
