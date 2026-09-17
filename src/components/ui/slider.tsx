import * as React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    return (
      <div className={cn("relative flex w-full touch-none select-none items-center", className)} ref={ref} {...props}>
        <div className="relative h-1 w-full grow overflow-hidden rounded-full bg-secondary">
          <div className="absolute h-full bg-primary" style={{ width: `${((value?.[0] ?? 0) / max) * 100}%` }} />
        </div>
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
