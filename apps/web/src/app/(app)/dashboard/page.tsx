"use client";

import { ArrowRight, CheckCircle2, Clock, PlayCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { PageTitle } from "@/components/layout/PageTitle";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import type { EvaluationHistoryItem } from "@/lib/types/evaluation";

interface EvidenceSummary {
  total_categories: number;
  total_categories_with_data: number;
  categories: { category: string; has_data: boolean; count: number }[];
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="rounded-financial border border-border bg-card p-6">
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      <p className="mt-2 text-3xl font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-muted-foreground mt-1 text-xs">{sub}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<EvidenceSummary | null>(null);
  const [latestEval, setLatestEval] = useState<EvaluationHistoryItem | null>(null);

  useEffect(() => {
    api
      .get<EvidenceSummary>("/api/v1/evidence/summary")
      .then(setSummary)
      .catch(() => null);

    api
      .get<EvaluationHistoryItem[]>("/api/v1/evaluations/history")
      .then((items) => setLatestEval(items[0] ?? null))
      .catch(() => null);
  }, []);

  const filledCategories = summary?.total_categories_with_data ?? 0;
  const totalCategories = summary?.total_categories ?? 8;

  return (
    <div className="space-y-6">
      <PageTitle title="대시보드" description="역량 평가 현황을 한눈에 확인하세요" />

      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="입력된 역량 데이터"
          value={`${filledCategories} / ${totalCategories}`}
          sub="카테고리"
        />
        <StatCard
          label="최근 평가 점수"
          value={
            latestEval?.total_score != null ? Math.round(latestEval.total_score) : "-"
          }
          sub={latestEval?.grade ? `${latestEval.grade}등급` : "아직 평가 없음"}
        />
        <StatCard
          label="평가 상태"
          value={
            !latestEval
              ? "-"
              : latestEval.status === "completed"
                ? "완료"
                : latestEval.status === "processing"
                  ? "진행 중"
                  : latestEval.status === "failed"
                    ? "실패"
                    : "대기"
          }
          sub={latestEval ? new Date(latestEval.requested_at).toLocaleDateString("ko-KR") : "없음"}
        />
        <StatCard
          label="데이터 완성도"
          value={
            totalCategories > 0
              ? `${Math.round((filledCategories / totalCategories) * 100)}%`
              : "0%"
          }
          sub="입력 진행률"
        />
      </div>

      {/* Evaluation CTA */}
      <div className="rounded-financial border border-brand-mint-border bg-brand-soft-bg p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-brand-primary-strong">AI 역량 평가</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filledCategories === 0
                ? "먼저 역량 데이터를 입력하고 AI 평가를 요청하세요."
                : filledCategories < 4
                  ? `${filledCategories}개 항목이 입력되었습니다. 더 많은 데이터를 입력할수록 정확도가 높아집니다.`
                  : `${filledCategories}개 항목 입력 완료. 지금 평가를 시작할 수 있습니다.`}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {latestEval?.status === "completed" && latestEval.total_score != null && (
              <Link href={`/evaluation/${latestEval.id}/result`}>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  최근 결과
                </Button>
              </Link>
            )}
            {latestEval?.status === "processing" && (
              <Link href={`/evaluation/${latestEval.id}`}>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 animate-pulse" />
                  진행 중
                </Button>
              </Link>
            )}
            <Link href="/evaluation/start">
              <Button
                size="sm"
                className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary-strong"
              >
                <PlayCircle className="h-3.5 w-3.5" />
                {latestEval ? "재평가" : "평가 시작"}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Evidence status grid */}
      {summary && (
        <div className="rounded-financial border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="text-sm font-semibold text-foreground">역량 데이터 입력 현황</span>
            <Link
              href="/evidence"
              className="flex items-center gap-1 text-xs text-brand-primary hover:underline"
            >
              관리하기 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
            {summary.categories.map((cat) => (
              <div key={cat.category} className="bg-card px-4 py-3 flex items-center gap-2">
                <CheckCircle2
                  className={`h-4 w-4 shrink-0 ${
                    cat.has_data ? "text-semantic-success" : "text-muted-foreground/30"
                  }`}
                />
                <div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {cat.category === "academic"
                      ? "학업"
                      : cat.category === "projects"
                        ? "프로젝트"
                        : cat.category === "internships"
                          ? "인턴십"
                          : cat.category === "certifications"
                            ? "자격증"
                            : cat.category === "education"
                              ? "교육"
                              : cat.category === "portfolio"
                                ? "포트폴리오"
                                : cat.category === "github"
                                  ? "GitHub"
                                  : "파일"}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {cat.count > 0 ? `${cat.count}건` : "미입력"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
