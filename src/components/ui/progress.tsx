import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, ...props }, ref) => {
    return (
      <div
        className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
        ref={ref}
        {...props}
      >
        <div
          className="h-full w-full bg-primary transition-all"
          style={{ width: `${((value ?? 0) / max) * 100}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
