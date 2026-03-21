"use client";

import {
  BarChart3,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: "대시보드",
    href: "/admin/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "전체 평가 목록",
    href: "/admin/evaluations",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    label: "리뷰 대기 큐",
    href: "/admin/review-queue",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    label: "감사 로그",
    href: "/admin/audit-logs",
    icon: <FileText className="h-4 w-4" />,
  },
];

function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.push("/admin/login");
    }
  }

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-full w-60 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <ShieldCheck className="h-5 w-5 text-brand-primary" />
        <div>
          <p className="text-sm font-bold text-foreground">관리자 패널</p>
          <p className="text-xs text-muted-foreground">Skill Finance Score</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-financial px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-soft-bg text-brand-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border px-3 py-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-financial px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <main className="ml-60 min-h-screen p-8">{children}</main>
    </div>
  );
}
