import * as React from "react";
import { cn } from "@/lib/utils";

export interface HoverCardProps extends React.HTMLAttributes<HTMLDivElement> {}

const HoverCard = React.forwardRef<HTMLDivElement, HoverCardProps>(
  ({ className, ...props }, ref) => {
    return <div className={cn("relative", className)} ref={ref} {...props} />;
  }
);
HoverCard.displayName = "HoverCard";

export interface HoverCardTriggerProps extends React.HTMLAttributes<HTMLDivElement> {}

const HoverCardTrigger = React.forwardRef<HTMLDivElement, HoverCardTriggerProps>(
  ({ className, ...props }, ref) => {
    return <div className={cn("", className)} ref={ref} {...props} />;
  }
);
HoverCardTrigger.displayName = "HoverCardTrigger";

export interface HoverCardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const HoverCardContent = React.forwardRef<HTMLDivElement, HoverCardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "z-50 w-64 overflow-hidden rounded-md border bg-popover p-4 text-popover-foreground shadow-md animate-in fade-in-80",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
HoverCardContent.displayName = "HoverCardContent";

export { HoverCard, HoverCardTrigger, HoverCardContent };
