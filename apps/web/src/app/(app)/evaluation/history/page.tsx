"use client";

import { CheckCircle2, Clock, History, PlayCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AlertNotice } from "@/components/common/AlertNotice";
import { EmptyState } from "@/components/common/EmptyState";
import { PageSkeleton } from "@/components/common/LoadingSkeleton";
import { PageTitle } from "@/components/layout/PageTitle";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import type { EvaluationHistoryItem, EvaluationStatus } from "@/lib/types/evaluation";

function StatusBadge({ status }: { status: EvaluationStatus }) {
  const config: Record<EvaluationStatus, { label: string; icon: React.ReactNode; className: string }> = {
    pending: {
      label: "대기 중",
      icon: <Clock className="h-3 w-3" />,
      className: "bg-neutral-100 text-neutral-600",
    },
    processing: {
      label: "처리 중",
      icon: <Clock className="h-3 w-3 animate-pulse" />,
      className: "bg-blue-50 text-blue-600",
    },
    completed: {
      label: "완료",
      icon: <CheckCircle2 className="h-3 w-3" />,
      className: "bg-semantic-success/10 text-semantic-success",
    },
    failed: {
      label: "실패",
      icon: <XCircle className="h-3 w-3" />,
      className: "bg-semantic-danger/10 text-semantic-danger",
    },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.className}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

function GradeBadge({ grade, score }: { grade: string; score: number }) {
  const colorClass =
    score >= 80
      ? "bg-[#EAF7F4] text-[#1F9D6A]"
      : score >= 60
        ? "bg-[#EAF7F4] text-[#4CB7A5]"
        : score >= 40
          ? "bg-amber-50 text-amber-700"
          : "bg-red-50 text-red-600";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${colorClass}`}>
      {grade}등급
    </span>
  );
}

export default function EvaluationHistoryPage() {
  const [items, setItems] = useState<EvaluationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<EvaluationHistoryItem[]>("/api/v1/evaluations/history")
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "이력을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <PageTitle title="평가 이력" description="지금까지 요청한 AI 역량 평가 이력입니다" />
        <Link href="/evaluation/start">
          <Button className="bg-brand-primary hover:bg-brand-primary-strong flex items-center gap-1.5">
            <PlayCircle className="h-4 w-4" />
            새 평가
          </Button>
        </Link>
      </div>

      {loading && <PageSkeleton />}
      {error && <AlertNotice variant="danger">{error}</AlertNotice>}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={<History className="h-10 w-10" />}
          title="평가 이력이 없습니다"
          description="역량 데이터를 입력한 후 AI 평가를 요청해보세요"
          action={
            <Link href="/evaluation/start">
              <Button className="bg-brand-primary hover:bg-brand-primary-strong">
                첫 번째 평가 시작
              </Button>
            </Link>
          }
        />
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="rounded-financial border border-border bg-card px-5 py-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground tabular-nums">
                    #{items.length - idx}회
                  </span>
                  <StatusBadge status={item.status} />
                  {item.grade && item.total_score !== null && (
                    <GradeBadge grade={item.grade} score={item.total_score} />
                  )}
                </div>

                {item.total_score !== null && (
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {Math.round(item.total_score)}
                    <span className="text-xs font-normal text-muted-foreground">/100</span>
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>요청: {new Date(item.requested_at).toLocaleString("ko-KR")}</p>
                  {item.completed_at && (
                    <p>완료: {new Date(item.completed_at).toLocaleString("ko-KR")}</p>
                  )}
                </div>

                {item.status === "completed" && (
                  <Link
                    href={`/evaluation/${item.id}/result`}
                    className="text-xs font-medium text-brand-primary hover:underline"
                  >
                    결과 보기 →
                  </Link>
                )}
                {item.status === "processing" && (
                  <Link
                    href={`/evaluation/${item.id}`}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    진행 상태 →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
