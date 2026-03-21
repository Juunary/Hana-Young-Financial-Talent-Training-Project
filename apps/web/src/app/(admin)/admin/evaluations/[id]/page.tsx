"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Send,
} from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiClientError } from "@/lib/api-client";
import type {
  AdminEvaluationDetail,
  AdminFactorScore,
  AdminReviewerNote,
  ReviewSubmitResponse,
} from "@/lib/types/admin";

const FACTOR_LABELS: Record<string, string> = {
  academic: "학업 역량",
  project: "프로젝트 깊이",
  internship: "실무 경험",
  certification: "자격/인증",
  portfolio: "포트폴리오",
  github: "GitHub 활동",
  consistency: "일관성/완성도",
};

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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const ratio = max > 0 ? score / max : 0;
  const color =
    ratio >= 0.8
      ? "bg-semantic-success"
      : ratio >= 0.6
        ? "bg-brand-secondary"
        : ratio >= 0.4
          ? "bg-semantic-warning"
          : "bg-semantic-danger";

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-32 overflow-hidden rounded-full bg-neutral-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${ratio * 100}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        {score.toFixed(1)} / {max}
      </span>
    </div>
  );
}

function FactorAccordion({ factors }: { factors: AdminFactorScore[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="divide-y divide-border rounded-financial border border-border">
      {factors.map((f) => (
        <div key={f.factor_name}>
          <button
            onClick={() => setOpen(open === f.factor_name ? null : f.factor_name)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">
                {FACTOR_LABELS[f.factor_name] ?? f.factor_name}
              </span>
              <ScoreBar score={f.score_value} max={f.max_score} />
            </div>
            {open === f.factor_name ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {open === f.factor_name && (
            <div className="border-t border-border bg-neutral-50 px-4 pb-4 pt-3">
              <p className="text-sm text-foreground">{f.explanation}</p>
              {f.reason_codes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {f.reason_codes.map((code) => (
                    <span
                      key={code}
                      className="rounded-full bg-brand-soft-bg px-2 py-0.5 text-[11px] font-mono text-brand-primary"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                신뢰도: {(f.confidence * 100).toFixed(0)}%
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReviewForm({
  evalId,
  onSubmitted,
}: {
  evalId: string;
  onSubmitted: (note: AdminReviewerNote) => void;
}) {
  const [comment, setComment] = useState("");
  const [statusChange, setStatusChange] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post<ReviewSubmitResponse>(
        `/api/v1/admin/evaluations/${evalId}/review`,
        { comment, status_change: statusChange || undefined },
      );
      onSubmitted({
        id: res.id,
        reviewer_id: res.reviewer_id,
        reviewer_email: null,
        status_change: res.status_change,
        comment: res.comment,
        created_at: res.created_at,
      });
      setComment("");
      setStatusChange("");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "리뷰 제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-financial bg-semantic-danger/10 px-3 py-2 text-sm text-semantic-danger">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="review-comment">리뷰 코멘트</Label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          rows={3}
          placeholder="검토 내용을 입력하세요..."
          className="w-full rounded-financial border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="status-change">상태 변경 (선택)</Label>
          <select
            id="status-change"
            value={statusChange}
            onChange={(e) => setStatusChange(e.target.value)}
            className="h-9 w-full rounded-financial border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            <option value="">변경 없음</option>
            <option value="reviewed">검토 완료</option>
            <option value="needs_more_info">추가 정보 필요</option>
            <option value="approved_for_demo">데모 승인</option>
          </select>
        </div>
        <Button
          type="submit"
          disabled={submitting || !comment.trim()}
          className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary-strong"
        >
          <Send className="h-3.5 w-3.5" />
          {submitting ? "제출 중..." : "제출"}
        </Button>
      </div>
    </form>
  );
}

export default function AdminEvaluationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<AdminEvaluationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);

  useEffect(() => {
    api
      .get<AdminEvaluationDetail>(`/api/v1/admin/evaluations/${id}`)
      .then(setData)
      .catch(() => setError("평가 정보를 불러오는 데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleNoteAdded = (note: AdminReviewerNote) => {
    setData((prev) => (prev ? { ...prev, reviewer_notes: [...prev.reviewer_notes, note] } : prev));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-financial bg-neutral-100" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 rounded-financial bg-semantic-danger/10 px-4 py-3 text-sm text-semantic-danger">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {error || "평가를 찾을 수 없습니다."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/admin/evaluations" className="hover:text-brand-primary hover:underline">
            전체 평가 목록
          </Link>
          <span>/</span>
          <span className="font-mono">{data.id.slice(0, 8)}…</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">평가 상세</h1>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[data.status] ?? "bg-neutral-100 text-neutral-700"}`}
          >
            {STATUS_LABELS[data.status] ?? data.status}
          </span>
          {data.needs_human_review && (
            <span className="inline-flex items-center rounded-full bg-semantic-warning/10 px-2.5 py-0.5 text-xs font-medium text-semantic-warning">
              리뷰 필요
            </span>
          )}
          <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
            PROTOTYPE
          </span>
        </div>
      </div>

      {/* Basic info */}
      <div className="rounded-financial border border-border bg-card px-5 py-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">기본 정보</h2>
        <div className="divide-y divide-border">
          <InfoRow label="평가 ID" value={<span className="font-mono text-xs">{data.id}</span>} />
          <InfoRow label="사용자" value={data.user_email ?? `uid:${data.user_id}`} />
          <InfoRow
            label="요청일"
            value={new Date(data.requested_at).toLocaleString("ko-KR")}
          />
          {data.completed_at && (
            <InfoRow
              label="완료일"
              value={new Date(data.completed_at).toLocaleString("ko-KR")}
            />
          )}
          {data.error_message && (
            <InfoRow
              label="오류 메시지"
              value={
                <span className="text-semantic-danger">{data.error_message}</span>
              }
            />
          )}
          {data.snapshot_model_version && (
            <InfoRow label="AI 모델" value={<span className="font-mono text-xs">{data.snapshot_model_version}</span>} />
          )}
          {data.snapshot_scoring_config_version && (
            <InfoRow label="채점 설정 버전" value={data.snapshot_scoring_config_version} />
          )}
          {data.input_snapshot_hash && (
            <InfoRow
              label="입력 해시"
              value={<span className="font-mono text-xs">{data.input_snapshot_hash}</span>}
            />
          )}
        </div>
      </div>

      {/* Score summary */}
      {data.total_score != null && (
        <div className="rounded-financial border border-border bg-card px-5 py-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">평가 결과</h2>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-muted-foreground">총점</p>
              <p className="text-4xl font-bold tabular-nums text-brand-primary">
                {data.total_score.toFixed(1)}
              </p>
            </div>
            {data.grade && (
              <div>
                <p className="text-xs text-muted-foreground">등급</p>
                <p className="text-2xl font-bold text-foreground">{data.grade}</p>
              </div>
            )}
            {data.confidence_level != null && (
              <div>
                <p className="text-xs text-muted-foreground">신뢰도</p>
                <p className="text-lg font-semibold text-foreground">
                  {(data.confidence_level * 100).toFixed(0)}%
                </p>
              </div>
            )}
          </div>
          {data.overall_summary && (
            <p className="mt-4 rounded-financial bg-neutral-50 px-4 py-3 text-sm text-foreground">
              {data.overall_summary}
            </p>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {data.strengths.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-semantic-success">강점</p>
                <ul className="space-y-1">
                  {data.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-sm text-foreground">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-semantic-success" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.improvement_areas.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-semantic-warning">개선 영역</p>
                <ul className="space-y-1">
                  {data.improvement_areas.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-sm text-foreground">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-semantic-warning" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {data.risk_flags.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-semibold text-semantic-danger">리스크 플래그</p>
              <div className="flex flex-wrap gap-1">
                {data.risk_flags.map((flag, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-semantic-danger/10 px-2 py-0.5 text-xs text-semantic-danger"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Factor scores */}
      {data.factor_scores.length > 0 && (
        <div className="rounded-financial border border-border bg-card px-5 py-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">팩터별 점수</h2>
          <FactorAccordion factors={data.factor_scores} />
        </div>
      )}

      {/* Loan estimate */}
      {data.loan_estimate && (
        <div className="rounded-financial border border-border bg-card px-5 py-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">대출 범위 시뮬레이션</h2>
          <p className="text-lg font-bold text-foreground">
            {(data.loan_estimate.range_min / 10000000).toFixed(0)}천만원 ~{" "}
            {(data.loan_estimate.range_max / 10000000).toFixed(0)}천만원
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{data.loan_estimate.rationale}</p>
          <p className="mt-2 rounded-financial bg-semantic-danger/5 px-3 py-2 text-xs text-semantic-danger">
            {data.loan_estimate.disclaimer_text}
          </p>
        </div>
      )}

      {/* Snapshot evidence */}
      {data.snapshot_evidence && (
        <div className="rounded-financial border border-border bg-card px-5 py-4">
          <button
            onClick={() => setShowSnapshot((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
          >
            <span>스냅샷 증거 데이터</span>
            {showSnapshot ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showSnapshot && (
            <pre className="mt-3 max-h-64 overflow-auto rounded-financial bg-neutral-900 p-4 text-xs text-neutral-100">
              {JSON.stringify(data.snapshot_evidence, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Raw AI response */}
      {data.raw_ai_response && (
        <div className="rounded-financial border border-border bg-card px-5 py-4">
          <button
            onClick={() => setShowRaw((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
          >
            <span>Raw AI 응답</span>
            {showRaw ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showRaw && (
            <pre className="mt-3 max-h-96 overflow-auto rounded-financial bg-neutral-900 p-4 text-xs text-neutral-100">
              {JSON.stringify(data.raw_ai_response, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Reviewer notes */}
      <div className="rounded-financial border border-border bg-card px-5 py-4">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            리뷰어 노트 ({data.reviewer_notes.length})
          </h2>
        </div>

        {data.reviewer_notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">아직 리뷰 코멘트가 없습니다.</p>
        ) : (
          <div className="mb-4 space-y-3">
            {data.reviewer_notes.map((note: AdminReviewerNote) => (
              <div key={note.id} className="rounded-financial border border-border bg-neutral-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {note.reviewer_email ?? `reviewer #${note.reviewer_id}`}
                  </span>
                  <div className="flex items-center gap-2">
                    {note.status_change && (
                      <span className="rounded-full bg-brand-soft-bg px-2 py-0.5 text-[10px] font-medium text-brand-primary">
                        {note.status_change}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.created_at).toLocaleString("ko-KR")}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-foreground">{note.comment}</p>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-xs font-semibold text-muted-foreground">리뷰 추가</p>
          <ReviewForm evalId={data.id} onSubmitted={handleNoteAdded} />
        </div>
      </div>
    </div>
  );
}
