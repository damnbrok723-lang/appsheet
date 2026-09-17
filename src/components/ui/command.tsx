import * as React from "react";
import { cn } from "@/lib/utils";

export interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {}

const Command = React.forwardRef<HTMLDivElement, CommandProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "relative flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Command.displayName = "Command";

export interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
        <input
          className={cn("flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50", className)}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
CommandInput.displayName = "CommandInput";

export interface CommandListProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandList = React.forwardRef<HTMLDivElement, CommandListProps>(
  ({ className, ...props }, ref) => {
    return <div className={cn("overflow-y-auto overflow-x-hidden p-1", className)} ref={ref} {...props} />;
  }
);
CommandList.displayName = "CommandList";

export interface CommandItemProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandItem = React.forwardRef<HTMLDivElement, CommandItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
CommandItem.displayName = "CommandItem";

export interface CommandEmptyProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandEmpty = React.forwardRef<HTMLDivElement, CommandEmptyProps>(
  ({ className, ...props }, ref) => {
    return <div className={cn("py-6 text-center text-sm", className)} ref={ref} {...props} />;
  }
);
CommandEmpty.displayName = "CommandEmpty";

export interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandGroup = React.forwardRef<HTMLDivElement, CommandGroupProps>(
  ({ className, ...props }, ref) => {
    return <div className={cn("overflow-hidden p-1 text-foreground", className)} ref={ref} {...props} />;
  }
);
CommandGroup.displayName = "CommandGroup";

export { Command, CommandInput, CommandList, CommandItem, CommandEmpty, CommandGroup };
