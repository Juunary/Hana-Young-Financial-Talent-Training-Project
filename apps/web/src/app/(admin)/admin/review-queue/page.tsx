"use client";

import { AlertCircle, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { api } from "@/lib/api-client";
import type { AdminEvaluationListItem, AdminEvaluationListResponse } from "@/lib/types/admin";

export default function ReviewQueuePage() {
  const [data, setData] = useState<AdminEvaluationListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<AdminEvaluationListResponse>("/api/v1/admin/review-queue?per_page=50")
      .then(setData)
      .catch(() => setError("리뷰 큐를 불러오는 데 실패했습니다."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">리뷰 대기 큐</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          사람 검토가 필요한 평가 목록입니다.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-financial bg-neutral-100" />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-financial bg-semantic-danger/10 px-4 py-3 text-sm text-semantic-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-financial border border-border bg-card px-6 py-16">
          <ClipboardList className="h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            리뷰 대기 중인 평가가 없습니다.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            AI가 사람 검토가 필요하다고 판단한 평가가 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-semantic-warning/10 px-3 py-1 text-sm font-medium text-semantic-warning">
              {data.total}건 대기 중
            </span>
          </div>

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
                    요청일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((item: AdminEvaluationListItem) => (
                  <tr key={item.id} className="transition-colors hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.id.slice(0, 8)}…
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {item.user_email ?? `uid:${item.user_id}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-semantic-warning/10 px-2.5 py-0.5 text-xs font-medium text-semantic-warning">
                        리뷰 필요
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {item.total_score != null ? item.total_score.toFixed(1) : "-"}
                      {item.grade && (
                        <span className="ml-1.5 text-xs text-muted-foreground">({item.grade})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(item.requested_at).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/evaluations/${item.id}`}
                        className="text-xs font-medium text-brand-primary hover:underline"
                      >
                        검토하기 →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
