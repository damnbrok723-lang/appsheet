"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const SelectContext = React.createContext<{ value?: string; onChange?: (value: string) => void } | null>(null);

export function Select({ value, defaultValue, onValueChange, children }: { value?: string; defaultValue?: string; onValueChange?: (value: string) => void; children: React.ReactNode }) {
  const [selected, setSelected] = React.useState(value ?? defaultValue ?? "");
  const current = value ?? selected;
  const onChange = (next: string) => { setSelected(next); onValueChange?.(next); };
  return <SelectContext.Provider value={{ value: current, onChange }}>{children}</SelectContext.Provider>;
}

export function SelectTrigger({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex h-10 w-full items-center rounded-md border border-input bg-background px-3 text-sm", className)}>{children}</div>;
}
export function SelectValue({ placeholder }: { placeholder?: string }) { return <span>{placeholder}</span>; }
export function SelectContent({ children }: { children: React.ReactNode }) { return <div className="mt-1 rounded-md border bg-background p-1">{children}</div>; }
export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const context = React.useContext(SelectContext);
  return <button type="button" className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => context?.onChange?.(value)}>{children}</button>;
}