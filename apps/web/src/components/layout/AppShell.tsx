"use client";

import { useState } from "react";

import { isDemoMode } from "@/lib/demo-data";

import { Footer } from "./Footer";
import { Header } from "./Header";
import { SideNavigation } from "./SideNavigation";

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
}

export function AppShell({ children, userName, userEmail }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const demo = isDemoMode();
  const displayName = userName ?? (demo ? "체험 사용자" : undefined);
  const displayEmail = userEmail ?? (demo ? "demo@hanayoung.kr" : undefined);

  return (
    <div className="bg-neutral-50 min-h-screen flex flex-col">
      <Header
        userName={displayName}
        userEmail={displayEmail}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <SideNavigation isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="lg:pl-64 flex-1">
        <div className="mx-auto max-w-7xl px-4 py-5 lg:px-8">{children}</div>
      </main>
      <div className="lg:pl-64">
        <Footer />
      </div>
    </div>
  );
}
