"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

export function useCatalogTree() {
  const pathname = usePathname();
  const [catalogOpen, setCatalogOpen] = useState(
    pathname.startsWith("/dashboard/products") ||
      pathname.startsWith("/dashboard/categories"),
  );

  return {
    pathname,
    catalogOpen,
    toggleCatalog: () => setCatalogOpen((open) => !open),
  };
}
