"use client";

import {
  Award,
  BookOpen,
  Briefcase,
  ChevronRight,
  FileText,
  FolderGit2,
  Github,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { PageTitle } from "@/components/layout/PageTitle";
import { Card, CardContent } from "@/components/ui/card";
import { isDemoMode } from "@/lib/demo-data";

interface CategoryInfo {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const categories: CategoryInfo[] = [
  { key: "academic", label: "학업 기록", description: "학교, 전공, 학점", href: "/evidence/academic", icon: <GraduationCap className="h-5 w-5" /> },
  { key: "projects", label: "프로젝트", description: "프로젝트 경험, 기술 스택", href: "/evidence/projects", icon: <FolderGit2 className="h-5 w-5" /> },
  { key: "internships", label: "인턴/경력", description: "인턴십, 실무 경험", href: "/evidence/internships", icon: <Briefcase className="h-5 w-5" /> },
  { key: "certifications", label: "자격증", description: "자격증, 어학 시험", href: "/evidence/certifications", icon: <Award className="h-5 w-5" /> },
  { key: "education", label: "교육 이수", description: "강의, 부트캠프, 세미나", href: "/evidence/education", icon: <BookOpen className="h-5 w-5" /> },
  { key: "portfolio", label: "포트폴리오", description: "포트폴리오 링크/파일", href: "/evidence/portfolio", icon: <FileText className="h-5 w-5" /> },
  { key: "github", label: "GitHub", description: "GitHub 프로필 연결", href: "/evidence/github", icon: <Github className="h-5 w-5" /> },
];

export default function EvidenceHubPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isDemoMode()) return;
    const result: Record<string, number> = {};
    for (const cat of categories) {
      const stored = localStorage.getItem(`evidence_${cat.key}`);
      if (stored) {
        try {
          result[cat.key] = JSON.parse(stored).length;
        } catch {
          result[cat.key] = 0;
        }
      } else {
        result[cat.key] = 0;
      }
    }
    setCounts(result);
  }, []);

  const totalFilled = Object.values(counts).filter((c) => c > 0).length;

  return (
    <div className="space-y-6">
      <PageTitle
        title="역량 데이터"
        description="각 카테고리에 역량 정보를 입력하세요. 더 많은 데이터를 입력할수록 AI 평가 정확도가 높아집니다."
      />

      {/* Progress bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">입력 진행률</span>
            <span className="text-sm font-semibold text-brand-primary">
              {totalFilled} / {categories.length} 카테고리
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-100">
            <div
              className="h-2 rounded-full bg-brand-primary transition-all duration-300"
              style={{ width: `${(totalFilled / categories.length) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((cat) => {
          const count = counts[cat.key] ?? 0;
          return (
            <Link key={cat.key} href={cat.href}>
              <Card className="transition-colors hover:border-brand-primary/40 hover:bg-brand-soft-bg/20 cursor-pointer">
                <CardContent className="flex items-center gap-4 py-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-financial ${
                      count > 0
                        ? "bg-brand-primary text-white"
                        : "bg-neutral-100 text-muted-foreground"
                    }`}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {count > 0 ? (
                      <span className="rounded-full bg-brand-soft-bg px-2.5 py-0.5 text-xs font-semibold text-brand-primary">
                        {count}건
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">미입력</span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
