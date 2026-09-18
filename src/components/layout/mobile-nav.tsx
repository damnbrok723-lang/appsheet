"use client";

import { LayoutDashboard, ClipboardList, Factory, FileBarChart, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const mobileItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Stok NCR", href: "/stok-ncr", icon: ClipboardList },
  { name: "Repair", href: "/output-repair", icon: Factory },
  { name: "Laporan", href: "/reports", icon: FileBarChart },
  { name: "Profil", href: "/profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama mobile"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/97 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around px-1 py-1">
        {mobileItems.map((item) => {
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
