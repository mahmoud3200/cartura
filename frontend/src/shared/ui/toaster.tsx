"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

export function Toaster() {
  const { theme = "system" } = useTheme();

  return (
    <SonnerToaster
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
      }}
    />
  );
}
