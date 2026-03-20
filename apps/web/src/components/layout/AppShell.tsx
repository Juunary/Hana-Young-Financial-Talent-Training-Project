"use client";

import { useState } from "react";

import { Header } from "./Header";
import { SideNavigation } from "./SideNavigation";

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
}

export function AppShell({ children, userName, userEmail }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-background min-h-screen">
      <Header
        userName={userName}
        userEmail={userEmail}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <SideNavigation isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
