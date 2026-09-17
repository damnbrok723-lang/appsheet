import * as React from "react";
import { cn } from "@/lib/utils";

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className={cn("relative overflow-hidden", className)} ref={ref} {...props}>
        <div className="h-full w-full overflow-y-auto" ref={ref}>
          {children}
        </div>
      </div>
    );
  }
);
ScrollArea.displayName = "ScrollArea";

export interface ScrollAreaViewportProps extends React.HTMLAttributes<HTMLDivElement> {}

const ScrollAreaViewport = React.forwardRef<HTMLDivElement, ScrollAreaViewportProps>(
  ({ className, ...props }, ref) => {
    return <div className={cn("h-full w-full", className)} ref={ref} {...props} />;
  }
);
ScrollAreaViewport.displayName = "ScrollAreaViewport";

export { ScrollArea, ScrollAreaViewport };
