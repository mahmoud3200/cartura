"use client";

import * as React from "react";
import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field";
import { Minus, Plus } from "lucide-react";

import { cn } from "@/shared/lib/utils";

function NumberField({
  className,
  ...props
}: NumberFieldPrimitive.Root.Props) {
  return (
    <NumberFieldPrimitive.Root
      data-slot="number-field"
      className={cn("w-full", className)}
      {...props}
    />
  );
}

function NumberFieldGroup({
  className,
  ...props
}: NumberFieldPrimitive.Group.Props) {
  return (
    <NumberFieldPrimitive.Group
      data-slot="number-field-group"
      className={cn("flex h-8 w-full", className)}
      {...props}
    />
  );
}

function NumberFieldDecrement({
  className,
  children,
  ...props
}: NumberFieldPrimitive.Decrement.Props) {
  return (
    <NumberFieldPrimitive.Decrement
      data-slot="number-field-decrement"
      className={cn(
        "inline-flex h-full w-8 shrink-0 items-center justify-center rounded-l-lg border border-input bg-background text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:z-10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children ?? <Minus className="size-3.5" />}
    </NumberFieldPrimitive.Decrement>
  );
}

const NumberFieldInput = React.forwardRef<
  HTMLInputElement,
  NumberFieldPrimitive.Input.Props
>(function NumberFieldInput({ className, ...props }, ref) {
  return (
    <NumberFieldPrimitive.Input
      ref={ref}
      data-slot="number-field-input"
      className={cn(
        "h-full min-w-0 flex-1 border-y border-input bg-transparent px-2.5 text-sm tabular-nums outline-none transition-colors placeholder:text-muted-foreground focus:z-10 focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30",
        className,
      )}
      {...props}
    />
  );
});

function NumberFieldIncrement({
  className,
  children,
  ...props
}: NumberFieldPrimitive.Increment.Props) {
  return (
    <NumberFieldPrimitive.Increment
      data-slot="number-field-increment"
      className={cn(
        "inline-flex h-full w-8 shrink-0 items-center justify-center rounded-r-lg border border-input bg-background text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:z-10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children ?? <Plus className="size-3.5" />}
    </NumberFieldPrimitive.Increment>
  );
}

export {
  NumberField,
  NumberFieldGroup,
  NumberFieldDecrement,
  NumberFieldInput,
  NumberFieldIncrement,
};
