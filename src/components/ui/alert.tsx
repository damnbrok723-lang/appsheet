import * as React from "react";
import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "warning" | "success";
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        className={cn(
          "relative w-full rounded-lg border p-4",
          variant === "default" && "bg-background text-foreground",
          variant === "destructive" && "border-destructive/50 bg-destructive/5 text-destructive dark:border-destructive/50",
          variant === "warning" && "border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
          variant === "success" && "border-emerald-500/50 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Alert.displayName = "Alert";

export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, ...props }, ref) => {
    return <h5 className={cn("font-semibold leading-none tracking-tight", className)} ref={ref} {...props} />;
  }
);
AlertTitle.displayName = "AlertTitle";

export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className, ...props }, ref) => {
    return <p className={cn("text-sm [&_a]:underline [&_a]:underline-offset-4", className)} ref={ref} {...props} />;
  }
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
