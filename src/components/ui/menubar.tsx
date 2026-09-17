import * as React from "react";
import { cn } from "@/lib/utils";

export interface MenubarProps extends React.HTMLAttributes<HTMLDivElement> {}

const Menubar = React.forwardRef<HTMLDivElement, MenubarProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex h-10 items-center space-x-1 rounded-md border bg-background p-1",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Menubar.displayName = "Menubar";

export interface MenubarMenuProps extends React.HTMLAttributes<HTMLDivElement> {}

const MenubarMenu = React.forwardRef<HTMLDivElement, MenubarMenuProps>(
  ({ className, ...props }, ref) => {
    return <div className={cn("relative", className)} ref={ref} {...props} />;
  }
);
MenubarMenu.displayName = "MenubarMenu";

export interface MenubarTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {}

const MenubarTrigger = React.forwardRef<HTMLButtonElement, MenubarTriggerProps>(
  ({ className, ...props }, ref) => {
    return (
      <button
        className={cn(
          "flex cursor-pointer items-center rounded-sm px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
MenubarTrigger.displayName = "MenubarTrigger";

export interface MenubarItemProps extends React.HTMLAttributes<HTMLDivElement> {}

const MenubarItem = React.forwardRef<HTMLDivElement, MenubarItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
MenubarItem.displayName = "MenubarItem";

export { Menubar, MenubarMenu, MenubarTrigger, MenubarItem };
