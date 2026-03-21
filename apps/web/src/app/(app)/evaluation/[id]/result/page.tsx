"use client";

import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AlertNotice } from "@/components/common/AlertNotice";
import { PageSkeleton } from "@/components/common/LoadingSkeleton";
import { FactorChart } from "@/components/evaluation/FactorChart";
import { LoanRangeEstimateCard } from "@/components/evaluation/LoanRangeEstimateCard";
import { ProofRecordCard } from "@/components/evaluation/ProofRecordCard";
import { ScoreGauge } from "@/components/evaluation/ScoreGauge";
import { PageTitle } from "@/components/layout/PageTitle";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import type {
  EvaluationResultResponse,
  FactorScoreResponse,
} from "@/lib/types/evaluation";

function FactorExplanationAccordion({ factors }: { factors: FactorScoreResponse[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const FACTOR_LABELS: Record<string, string> = {
    academic: "학업 역량",
    project: "프로젝트 깊이",
    internship: "실무 경험",
    certification: "자격/인증",
    portfolio: "포트폴리오",
    github: "GitHub 활동",
    consistency: "일관성/완성도",
  };

  return (
    <div className="space-y-2">
      {factors.map((f, idx) => {
        const isOpen = openIdx === idx;
        const pct = f.max_score > 0 ? Math.round((f.score_value / f.max_score) * 100) : 0;
        return (
          <div key={f.factor_name} className="rounded-financial border border-border bg-card">
            <button
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
              onClick={() => setOpenIdx(isOpen ? null : idx)}
            >
              <span className="flex-1 text-sm font-medium text-foreground">
                {FACTOR_LABELS[f.factor_name] ?? f.factor_name}
              </span>
              <span className="text-sm font-bold text-foreground tabular-nums">
                {f.score_value.toFixed(1)}
                <span className="text-xs font-normal text-muted-foreground">/{f.max_score}</span>
              </span>
              <span
                className={`w-12 text-right text-xs font-semibold ${
                  pct >= 80
                    ? "text-semantic-success"
                    : pct >= 60
                      ? "text-[#4CB7A5]"
                      : pct >= 40
                        ? "text-semantic-warning"
                        : "text-semantic-danger"
                }`}
              >
                {pct}%
              </span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {isOpen && (
              <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
                <p className="text-sm text-muted-foreground leading-relaxed">{f.explanation}</p>
                {f.reason_codes.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {f.reason_codes.map((code) => (
                      <span
                        key={code}
                        className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-mono text-muted-foreground"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function EvaluationResultPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [result, setResult] = useState<EvaluationResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<EvaluationResultResponse>(`/api/v1/evaluations/${params.id}/result`)
      .then(setResult)
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "결과를 불러오지 못했습니다.";
        // 409 = not completed yet → redirect to status page
        if (err.status === 409) {
          router.replace(`/evaluation/${params.id}`);
        } else {
          setError(msg);
        }
      })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  if (loading) return <PageSkeleton />;
  if (error) return <AlertNotice variant="danger">{error}</AlertNotice>;
  if (!result) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <PageTitle
          title="AI 역량 평가 결과"
          description={
            result.completed_at
              ? `평가 완료: ${new Date(result.completed_at).toLocaleString("ko-KR")}`
              : "평가 결과"
          }
        />
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 shrink-0"
          onClick={() => router.push("/evaluation/start")}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          재평가
        </Button>
      </div>

      {/* Prototype notice */}
      <AlertNotice variant="warning">
        <strong>프로토타입 시뮬레이션</strong> — 본 결과는 AI 역량 평가 프로토타입의 시뮬레이션
        결과입니다. 실제 금융기관의 신용평가와 무관하며, 어떠한 법적 효력도 없습니다.
      </AlertNotice>

      {/* Score + Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col items-center justify-center rounded-financial border border-border bg-card py-6">
          <ScoreGauge score={result.total_score} grade={result.grade} size={200} />
          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground">
              신뢰도{" "}
              <span className="font-semibold text-foreground">
                {Math.round(result.confidence_level * 100)}%
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              v{result.scoring_config_version} ·{" "}
              {result.model_version.split(":")[1] ?? result.model_version}
            </p>
          </div>
        </div>

        <div className="rounded-financial border border-border bg-card px-5 py-5 space-y-3">
          <p className="text-sm font-semibold text-foreground">종합 평가</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{result.overall_summary}</p>
          {result.needs_human_review && (
            <div className="flex items-center gap-2 rounded-financial bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <Users className="h-3.5 w-3.5" />
              전문가 검토가 권장됩니다
            </div>
          )}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-financial border border-border bg-card px-5 py-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-semantic-success">
            <TrendingUp className="h-4 w-4" />
            강점
          </p>
          <ul className="space-y-2">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 text-semantic-success">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-financial border border-border bg-card px-5 py-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-semantic-warning">
            <AlertTriangle className="h-4 w-4" />
            개선 영역
          </p>
          <ul className="space-y-2">
            {result.improvement_areas.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 text-semantic-warning">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Factor chart */}
      <div className="rounded-financial border border-border bg-card px-5 py-4">
        <p className="mb-4 text-sm font-semibold text-foreground">팩터별 점수</p>
        <FactorChart factors={result.factor_scores} />
      </div>

      {/* Factor explanations accordion */}
      <div>
        <p className="mb-3 text-sm font-semibold text-foreground">팩터별 상세 분석</p>
        <FactorExplanationAccordion factors={result.factor_scores} />
      </div>

      {/* Loan range */}
      {result.loan_estimate && <LoanRangeEstimateCard estimate={result.loan_estimate} />}

      {/* Risk flags */}
      {result.risk_flags.length > 0 && (
        <div className="rounded-financial border border-semantic-warning/40 bg-semantic-warning/5 px-5 py-4">
          <p className="mb-2 text-sm font-semibold text-semantic-warning">주의 사항</p>
          <ul className="space-y-1">
            {result.risk_flags.map((flag, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                • {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Proof record */}
      {result.proof_record && <ProofRecordCard proof={result.proof_record} />}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push("/evaluation/history")}>
          평가 이력 보기
        </Button>
        <Button
          onClick={() => router.push("/evaluation/start")}
          className="bg-brand-primary hover:bg-brand-primary-strong"
        >
          재평가 요청
        </Button>
      </div>
    </div>
  );
}
