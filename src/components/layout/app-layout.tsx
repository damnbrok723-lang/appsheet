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
        {/* 
          h-[100dvh] = dynamic viewport height (handles mobile browser chrome).
          overflow-hidden on the shell: only the main scroll area can scroll.
          w-screen max-w-full prevents body wider than viewport.
        */}
        <div className="flex h-[100dvh] w-full max-w-full overflow-hidden bg-background">
          {/* Sidebar: only shown on md+ screens */}
          {!isAuthPage && (
            <div className="hidden shrink-0 md:flex md:flex-col">
              <Sidebar />
            </div>
          )}

          {/* Right column: header + main content + mobile bottom nav */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {!isAuthPage && <Header />}

            {/*
              Main scroll area.
              pb-[calc(4rem+env(safe-area-inset-bottom))] on mobile:
                4rem = mobile nav height, + iOS home indicator.
              md:pb-6 resets to normal on desktop.
            */}
            <main
              className={
                isAuthPage
                  ? "flex-1 overflow-y-auto overflow-x-hidden"
                  : "min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:p-4 sm:pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:p-6 md:pb-0"
              }
            >
              {/* Inner wrapper: full width, never wider than container */}
              <div className="mx-auto w-full max-w-full">
                {children}
              </div>
            </main>

            {!isAuthPage && <MobileNav />}
          </div>
        </div>
      </ToastProvider>
    </QueryProvider>
  );
}
