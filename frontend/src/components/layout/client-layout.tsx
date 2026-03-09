"use client";

import { PreferencesProvider } from "@/contexts/preferences-context";
import Navbar from "./navbar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PreferencesProvider>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </PreferencesProvider>
  );
}
