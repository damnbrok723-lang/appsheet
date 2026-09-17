"use client";

import * as React from "react";
import { Controller, type ControllerProps, type FieldPath, type FieldValues, FormProvider, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

export const Form = FormProvider;

export function FormField<T extends FieldValues, N extends FieldPath<T>>(props: ControllerProps<T, N>) { return <Controller {...props} />; }
export function FormItem({ className, children }: { className?: string; children: React.ReactNode }) { return <div className={cn("space-y-2", className)}>{children}</div>; }
export function FormLabel({ className, children }: { className?: string; children: React.ReactNode }) { return <label className={cn("text-sm font-medium", className)}>{children}</label>; }
export function FormControl({ children }: { children: React.ReactElement }) { return children; }
export function FormMessage({ className }: { className?: string }) {
  const { formState } = useFormContext();
  const message = Object.values(formState.errors)[0]?.message;
  return message ? <p className={cn("text-sm text-destructive", className)}>{String(message)}</p> : null;
}