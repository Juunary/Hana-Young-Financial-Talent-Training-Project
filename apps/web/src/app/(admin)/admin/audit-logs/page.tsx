"use client";

import { AlertCircle, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import type { AuditLogItem, AuditLogResponse } from "@/lib/types/admin";

const ACTOR_TYPE_LABELS: Record<string, string> = {
  user: "사용자",
  admin: "관리자",
  system: "시스템",
};

const ACTOR_TYPE_COLORS: Record<string, string> = {
  user: "bg-semantic-info/10 text-semantic-info",
  admin: "bg-brand-soft-bg text-brand-primary",
  system: "bg-neutral-100 text-neutral-600",
};

function EventBadge({ eventName }: { eventName: string }) {
  const parts = eventName.split(".");
  const prefix = parts[0] ?? eventName;

  const color =
    prefix === "auth"
      ? "bg-semantic-info/10 text-semantic-info"
      : prefix === "admin"
        ? "bg-brand-soft-bg text-brand-primary"
        : prefix === "evaluation"
          ? "bg-semantic-success/10 text-semantic-success"
          : prefix === "evidence"
            ? "bg-neutral-100 text-neutral-600"
            : "bg-neutral-100 text-neutral-600";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] font-medium ${color}`}>
      {eventName}
    </span>
  );
}

export default function AuditLogsPage() {
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [eventNameFilter, setEventNameFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "50" });
      if (eventNameFilter.trim()) params.set("event_name", eventNameFilter.trim());

      const res = await api.get<AuditLogResponse>(`/api/v1/admin/audit-logs?${params.toString()}`);
      setData(res);
    } catch {
      setError("감사 로그를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [page, eventNameFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (val: string) => {
    setEventNameFilter(val);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">감사 로그</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          시스템 내 모든 주요 이벤트 기록입니다.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="이벤트 이름 검색 (예: auth.login)"
          value={eventNameFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="h-9 w-64 text-sm"
        />
        {data && (
          <span className="ml-auto text-xs text-muted-foreground">
            전체 {data.total.toLocaleString()}건
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-financial bg-neutral-100" />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-financial bg-semantic-danger/10 px-4 py-3 text-sm text-semantic-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-financial border border-border bg-card px-6 py-12">
          <FileText className="h-8 w-8 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">감사 로그가 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-financial border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-neutral-50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                  시간
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                  행위자
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                  이벤트
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                  리소스
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                  IP
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((log: AuditLogItem) => (
                <>
                  <tr
                    key={log.id}
                    className="cursor-pointer transition-colors hover:bg-neutral-50"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">
                      {new Date(log.created_at).toLocaleString("ko-KR")}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${ACTOR_TYPE_COLORS[log.actor_type] ?? "bg-neutral-100 text-neutral-600"}`}
                      >
                        {ACTOR_TYPE_LABELS[log.actor_type] ?? log.actor_type}
                        {log.actor_id && (
                          <span className="ml-1 opacity-70">#{log.actor_id}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <EventBadge eventName={log.event_name} />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {log.resource_type && log.resource_id
                        ? `${log.resource_type}:${log.resource_id.slice(0, 8)}`
                        : log.resource_type ?? "-"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {log.ip_address ?? "-"}
                    </td>
                    <td className="px-2">
                      {log.event_payload_json && (
                        <span className="text-xs text-muted-foreground">
                          {expandedId === log.id ? "▲" : "▼"}
                        </span>
                      )}
                    </td>
                  </tr>
                  {expandedId === log.id && log.event_payload_json && (
                    <tr key={`${log.id}-detail`}>
                      <td colSpan={6} className="bg-neutral-900 px-4 py-3">
                        <pre className="max-h-40 overflow-auto text-xs text-neutral-100">
                          {JSON.stringify(log.event_payload_json, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
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
