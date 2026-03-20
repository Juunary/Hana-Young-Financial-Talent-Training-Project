"use client";

import {
  Award,
  BookOpen,
  Briefcase,
  FileText,
  FolderGit2,
  Github,
  GraduationCap,
  History,
  LayoutDashboard,
  PlayCircle,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const mainNavItems: NavItem[] = [
  { label: "대시보드", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
];

const evidenceNavItems: NavItem[] = [
  { label: "학업 기록", href: "/evidence/academic", icon: <GraduationCap className="h-4 w-4" /> },
  { label: "프로젝트", href: "/evidence/projects", icon: <FolderGit2 className="h-4 w-4" /> },
  { label: "인턴/경험", href: "/evidence/internships", icon: <Briefcase className="h-4 w-4" /> },
  { label: "자격증", href: "/evidence/certifications", icon: <Award className="h-4 w-4" /> },
  { label: "교육 이수", href: "/evidence/education", icon: <BookOpen className="h-4 w-4" /> },
  { label: "포트폴리오", href: "/evidence/portfolio", icon: <FileText className="h-4 w-4" /> },
  { label: "GitHub", href: "/evidence/github", icon: <Github className="h-4 w-4" /> },
  { label: "파일 업로드", href: "/evidence/uploads", icon: <Upload className="h-4 w-4" /> },
];

const evaluationNavItems: NavItem[] = [
  { label: "평가 시작", href: "/evaluation/start", icon: <PlayCircle className="h-4 w-4" /> },
  { label: "평가 이력", href: "/evaluation/history", icon: <History className="h-4 w-4" /> },
];

const etcNavItems: NavItem[] = [
  { label: "증명 기록", href: "/proof-record", icon: <ShieldCheck className="h-4 w-4" /> },
];

interface SideNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

function NavSection({ title, items }: { title: string; items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      <p className="text-muted-foreground px-3 py-2 text-xs font-semibold uppercase tracking-wider">
        {title}
      </p>
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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
    </div>
  );
}

export function SideNavigation({ isOpen, onClose }: SideNavigationProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar border-sidebar-border fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-64 flex-col border-r transition-transform duration-200 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 lg:hidden">
          <span className="text-sm font-semibold">메뉴</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          <NavSection title="메인" items={mainNavItems} />
          <Separator />
          <NavSection title="역량 데이터" items={evidenceNavItems} />
          <Separator />
          <NavSection title="AI 평가" items={evaluationNavItems} />
          <Separator />
          <NavSection title="기타" items={etcNavItems} />
        </nav>

        <div className="border-sidebar-border border-t px-4 py-3">
          <p className="text-muted-foreground text-xs">
            Skill Finance Score는 프로토타입입니다.
          </p>
        </div>
      </aside>
    </>
  );
}
