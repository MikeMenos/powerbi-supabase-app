import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/providers/QueryProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Supabase Admin Dashboard",
  description: "Browse and manage Power BI Supabase tables",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
