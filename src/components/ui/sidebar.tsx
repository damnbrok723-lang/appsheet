import * as React from "react";
import { cn } from "@/lib/utils";

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-background transition-transform",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Sidebar.displayName = "Sidebar";

export interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ className, ...props }, ref) => {
    return <div className={cn("flex h-16 items-center border-b px-4", className)} ref={ref} {...props} />;
  }
);
SidebarHeader.displayName = "SidebarHeader";

export interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarContent = React.forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ className, ...props }, ref) => {
    return <div className={cn("flex-1 overflow-y-auto py-4", className)} ref={ref} {...props} />;
  }
);
SidebarContent.displayName = "SidebarContent";

export interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarFooter = React.forwardRef<HTMLDivElement, SidebarFooterProps>(
  ({ className, ...props }, ref) => {
    return <div className={cn("border-t p-4", className)} ref={ref} {...props} />;
  }
);
SidebarFooter.displayName = "SidebarFooter";

export interface SidebarTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {}

const SidebarTrigger = React.forwardRef<HTMLButtonElement, SidebarTriggerProps>(
  ({ className, ...props }, ref) => {
    return (
      <button
        className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground", className)}
        ref={ref}
        {...props}
      />
    );
  }
);
SidebarTrigger.displayName = "SidebarTrigger";

export { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger };
