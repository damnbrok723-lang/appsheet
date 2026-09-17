import * as React from "react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Spinner.displayName = "Spinner";

export { Spinner };
