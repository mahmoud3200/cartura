"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { cn } from "@/shared/lib/utils";

const Popover = PopoverPrimitive.Root;

function PopoverTrigger({
  className,
  ...props
}: PopoverPrimitive.Trigger.Props) {
  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[popup-open]:bg-muted data-[popup-open]:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function PopoverPortal(props: PopoverPrimitive.Portal.Props) {
  return <PopoverPrimitive.Portal {...props} />;
}

function PopoverPositioner({
  className,
  ...props
}: PopoverPrimitive.Positioner.Props) {
  return (
    <PopoverPrimitive.Positioner
      sideOffset={8}
      align="end"
      className={cn("z-50 outline-none", className)}
      {...props}
    />
  );
}

function PopoverContent({
  className,
  ...props
}: PopoverPrimitive.Popup.Props) {
  return (
    <PopoverPrimitive.Popup
      data-slot="popover-content"
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg outline-none origin-(--transform-origin) transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverPositioner,
  PopoverTrigger,
};
