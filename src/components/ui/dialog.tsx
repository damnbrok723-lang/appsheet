"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type DialogContextValue = { open: boolean; setOpen: (open: boolean) => void };
const DialogContext = React.createContext<DialogContextValue | null>(null);

export function Dialog({ open: controlledOpen, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode }) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    setInternalOpen(value);
    onOpenChange?.(value);
  };
  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactElement }) {
  const context = React.useContext(DialogContext);
  if (!context) return children;
  return asChild ? React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, { onClick: () => context.setOpen(true) }) : <button onClick={() => context.setOpen(true)}>{children}</button>;
}

export function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const context = React.useContext(DialogContext);
  if (!context?.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={() => context.setOpen(false)}>
      <div className={cn("w-full max-w-lg rounded-lg bg-background p-6 shadow-lg", className)} onMouseDown={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, children }: { className?: string; children: React.ReactNode }) { return <div className={cn("mb-4 space-y-1", className)}>{children}</div>; }
export function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) { return <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>; }
export function DialogDescription({ className, children }: { className?: string; children: React.ReactNode }) { return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>; }