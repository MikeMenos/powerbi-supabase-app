import type { Metadata } from "next";
import type { ReactNode } from "react";

import QueryProvider from "@/providers/QueryProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Power BI Supabase Initializer",
  description: "Power BI workspaces and datasets endpoint checker",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
