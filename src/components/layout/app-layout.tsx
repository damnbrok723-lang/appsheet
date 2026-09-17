"use client";

import { QueryProvider } from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { usePathname } from "next/navigation";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <QueryProvider>
      <ToastProvider>
        <div className="flex h-[100dvh] overflow-hidden bg-background">
          {!isAuthPage && <div className="hidden h-full min-h-0 shrink-0 md:block"><Sidebar /></div>}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {!isAuthPage && <Header />}
            <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-24 md:p-6 md:pb-6">
              {children}
            </main>
            {!isAuthPage && <MobileNav />}
          </div>
        </div>
      </ToastProvider>
    </QueryProvider>
  );
}
