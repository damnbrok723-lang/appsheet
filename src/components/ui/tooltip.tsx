import * as React from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ className, ...props }, ref) => {
    return <div className={cn("relative", className)} ref={ref} {...props} />;
  }
);
Tooltip.displayName = "Tooltip";

export interface TooltipTriggerProps extends React.HTMLAttributes<HTMLDivElement> {}

const TooltipTrigger = React.forwardRef<HTMLDivElement, TooltipTriggerProps>(
  ({ className, ...props }, ref) => {
    return <div className={cn("", className)} ref={ref} {...props} />;
  }
);
TooltipTrigger.displayName = "TooltipTrigger";

export interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "bottom" | "left" | "right";
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, side = "top", ...props }, ref) => {
    return (
      <div
        className={cn(
          "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md animate-in fade-in-80",
          side === "top" && "slide-in-from-bottom-2",
          side === "bottom" && "slide-in-from-top-2",
          side === "left" && "slide-in-from-right-2",
          side === "right" && "slide-in-from-left-2"
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent };
