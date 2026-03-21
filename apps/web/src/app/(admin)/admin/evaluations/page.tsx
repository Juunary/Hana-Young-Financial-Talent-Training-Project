"use client";

import { AlertCircle, ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import type { AdminEvaluationListItem, AdminEvaluationListResponse } from "@/lib/types/admin";

const STATUS_LABELS: Record<string, string> = {
  pending: "대기",
  processing: "처리중",
  completed: "완료",
  failed: "실패",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-700",
  processing: "bg-semantic-info/10 text-semantic-info",
  completed: "bg-semantic-success/10 text-semantic-success",
  failed: "bg-semantic-danger/10 text-semantic-danger",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? "bg-neutral-100 text-neutral-700"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return <span className="text-muted-foreground text-sm">-</span>;
  return (
    <span className="inline-flex items-center rounded-financial bg-brand-soft-bg px-2 py-0.5 text-xs font-bold text-brand-primary">
      {grade}
    </span>
  );
}

export default function AdminEvaluationsPage() {
  const [data, setData] = useState<AdminEvaluationListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [needsReview, setNeedsReview] = useState<boolean | null>(null);

  const fetchEvaluations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (needsReview !== null) params.set("needs_review", String(needsReview));

      const res = await api.get<AdminEvaluationListResponse>(
        `/api/v1/admin/evaluations?${params.toString()}`,
      );
      setData(res);
    } catch {
      setError("평가 목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, needsReview]);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  // Reset to page 1 when filters change
  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };
  const handleNeedsReviewChange = (val: boolean | null) => {
    setNeedsReview(val);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">전체 평가 목록</h1>
        <p className="mt-1 text-sm text-muted-foreground">모든 역량 평가 요청을 조회합니다.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-9 rounded-financial border border-border bg-card pl-8 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            <option value="">전체 상태</option>
            <option value="pending">대기</option>
            <option value="processing">처리중</option>
            <option value="completed">완료</option>
            <option value="failed">실패</option>
          </select>
        </div>

        <div className="flex gap-1 rounded-financial border border-border bg-card p-0.5">
          {[
            { label: "전체", val: null },
            { label: "리뷰 필요", val: true },
          ].map(({ label, val }) => (
            <button
              key={label}
              onClick={() => handleNeedsReviewChange(val)}
              className={`rounded-[6px] px-3 py-1 text-xs font-medium transition-colors ${
                needsReview === val
                  ? "bg-brand-primary text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {data && (
          <span className="ml-auto text-xs text-muted-foreground">
            전체 {data.total.toLocaleString()}건
          </span>
        )}
      </div>

      {/* Table */}
      {error ? (
        <div className="flex items-center gap-2 rounded-financial bg-semantic-danger/10 px-4 py-3 text-sm text-semantic-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-financial bg-neutral-100" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-financial border border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">조건에 맞는 평가가 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-financial border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  평가 ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  사용자
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  상태
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                  점수
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  등급
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  요청일
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((item: AdminEvaluationListItem) => (
                <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/evaluations/${item.id}`}
                      className="font-mono text-xs text-brand-primary hover:underline"
                    >
                      {item.id.slice(0, 8)}…
                    </Link>
                    {item.needs_human_review && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-semantic-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-semantic-warning">
                        리뷰 필요
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.user_email ?? `uid:${item.user_id}`}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {item.total_score != null ? item.total_score.toFixed(1) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <GradeBadge grade={item.grade} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(item.requested_at).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {data.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.total_pages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
