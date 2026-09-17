import * as React from "react";
import { cn } from "@/lib/utils";

export interface AlertDialogProps extends React.DialogHTMLAttributes<HTMLDialogElement> {}

const AlertDialog = React.forwardRef<HTMLDialogElement, AlertDialogProps>(
  ({ className, ...props }, ref) => {
    return <dialog className={cn("rounded-lg border bg-background shadow-lg", className)} ref={ref} {...props} />;
  }
);
AlertDialog.displayName = "AlertDialog";

export interface AlertDialogContentProps extends React.DialogHTMLAttributes<HTMLDivElement> {}

const AlertDialogContent = React.forwardRef<HTMLDivElement, AlertDialogContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className
        )}
        ref={ref}
      >
        {children}
      </div>
    );
  }
);
AlertDialogContent.displayName = "AlertDialogContent";

export interface AlertDialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const AlertDialogHeader = React.forwardRef<HTMLDivElement, AlertDialogHeaderProps>(
  ({ className, ...props }, ref) => {
    return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} ref={ref} {...props} />;
  }
);
AlertDialogHeader.displayName = "AlertDialogHeader";

export interface AlertDialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const AlertDialogFooter = React.forwardRef<HTMLDivElement, AlertDialogFooterProps>(
  ({ className, ...props }, ref) => {
    return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} ref={ref} {...props} />;
  }
);
AlertDialogFooter.displayName = "AlertDialogFooter";

export interface AlertDialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const AlertDialogTitle = React.forwardRef<HTMLHeadingElement, AlertDialogTitleProps>(
  ({ className, ...props }, ref) => {
    return <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} ref={ref} {...props} />;
  }
);
AlertDialogTitle.displayName = "AlertDialogTitle";

export interface AlertDialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const AlertDialogDescription = React.forwardRef<HTMLParagraphElement, AlertDialogDescriptionProps>(
  ({ className, ...props }, ref) => {
    return <p className={cn("text-sm text-muted-foreground", className)} ref={ref} {...props} />;
  }
);
AlertDialogDescription.displayName = "AlertDialogDescription";

export { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription };
