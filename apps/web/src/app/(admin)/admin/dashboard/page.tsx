"use client";

import { AlertCircle, BarChart3, CheckCircle2, Clock, Users, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { api } from "@/lib/api-client";
import type { AdminDashboardStats } from "@/lib/types/admin";

function StatCard({
  label,
  value,
  icon,
  accent,
  href,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-financial border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={`text-muted-foreground ${accent ?? ""}`}>{icon}</span>
      </div>
      <p className={`mt-3 text-3xl font-bold tabular-nums ${accent ?? "text-foreground"}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );

  return href ? (
    <Link href={href} className="block transition-opacity hover:opacity-80">
      {content}
    </Link>
  ) : (
    content
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<AdminDashboardStats>("/api/v1/admin/dashboard")
      .then(setStats)
      .catch(() => setError("통계를 불러오는 데 실패했습니다."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">관리자 대시보드</h1>
          <p className="mt-1 text-sm text-muted-foreground">전체 평가 현황 및 통계</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-financial bg-neutral-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center gap-2 rounded-financial bg-semantic-danger/10 px-4 py-3 text-sm text-semantic-danger">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {error || "데이터를 불러올 수 없습니다."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">관리자 대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">전체 평가 현황 및 통계</p>
      </div>

      {/* Primary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="전체 평가"
          value={stats.total_evaluations}
          icon={<BarChart3 className="h-5 w-5" />}
          href="/admin/evaluations"
        />
        <StatCard
          label="등록 사용자"
          value={stats.total_users}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="리뷰 대기"
          value={stats.needs_review_count}
          icon={<Clock className="h-5 w-5" />}
          accent={stats.needs_review_count > 0 ? "text-semantic-warning" : undefined}
          href="/admin/review-queue"
        />
        <StatCard
          label="완료"
          value={stats.completed_count}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="text-semantic-success"
        />
      </div>

      {/* Status breakdown */}
      <div className="rounded-financial border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <span className="text-sm font-semibold text-foreground">평가 상태별 현황</span>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {[
            {
              label: "대기중",
              value: stats.pending_count,
              color: "text-semantic-info",
              icon: <Clock className="h-4 w-4" />,
            },
            {
              label: "처리중",
              value: stats.processing_count,
              color: "text-semantic-warning",
              icon: <Clock className="h-4 w-4 animate-spin" />,
            },
            {
              label: "완료",
              value: stats.completed_count,
              color: "text-semantic-success",
              icon: <CheckCircle2 className="h-4 w-4" />,
            },
            {
              label: "실패",
              value: stats.failed_count,
              color: "text-semantic-danger",
              icon: <XCircle className="h-4 w-4" />,
            },
          ].map((item) => (
            <div key={item.label} className="bg-card px-5 py-4">
              <div className={`flex items-center gap-1.5 ${item.color}`}>
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
              </div>
              <p className={`mt-2 text-2xl font-bold tabular-nums ${item.color}`}>
                {item.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      {stats.needs_review_count > 0 && (
        <div className="rounded-financial border border-semantic-warning/30 bg-semantic-warning/5 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-semantic-warning" />
              <span className="text-sm font-medium text-foreground">
                리뷰가 필요한 평가가{" "}
                <span className="text-semantic-warning font-bold">{stats.needs_review_count}건</span>{" "}
                있습니다.
              </span>
            </div>
            <Link
              href="/admin/review-queue"
              className="text-sm font-medium text-brand-primary hover:underline"
            >
              리뷰 큐 보기 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
