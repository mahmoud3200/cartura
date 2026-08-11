import type { Metadata } from "next";

import "@/styles/globals.css";
import { QueryProvider } from "@/shared/components/query-provider";
import { Toaster } from "@/shared/ui/toaster";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { CartStoreProvider } from "@/shared/components/cart-store-provider";

const frontendUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL ??
  process.env.FRONTEND_URL ??
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(frontendUrl),
  title: "Cartura",
  description: "Shop clothing and everyday accessories from Cartura.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          enableColorScheme
          storageKey="cartura-theme"
          disableTransitionOnChange
        >
          <QueryProvider>
            <CartStoreProvider>
              {children}
              <Toaster />
            </CartStoreProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
