"use client";

import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { AlertNotice } from "@/components/common/AlertNotice";
import { PageTitle } from "@/components/layout/PageTitle";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import type { EvaluationStage, EvaluationStatusResponse } from "@/lib/types/evaluation";

const STAGES: EvaluationStage[] = ["normalizing", "scoring", "explaining", "saving"];
const STAGE_LABELS: Record<EvaluationStage, string> = {
  normalizing: "데이터 정규화 중",
  scoring: "점수 산출 중",
  explaining: "결과 해석 중",
  saving: "결과 저장 중",
};

const POLL_INTERVAL_MS = 5000;

export default function EvaluationStatusPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<EvaluationStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const result = await api.get<EvaluationStatusResponse>(
        `/api/v1/evaluations/${params.id}/status`,
      );
      setData(result);

      if (result.status === "completed") {
        if (intervalRef.current) clearInterval(intervalRef.current);
        router.replace(`/evaluation/${params.id}/result`);
      } else if (result.status === "failed") {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 조회에 실패했습니다.");
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStatus]);

  const currentStageIndex = data?.current_stage ? STAGES.indexOf(data.current_stage) : -1;

  return (
    <div className="max-w-lg space-y-6">
      <PageTitle title="평가 진행 중" description="AI가 역량 데이터를 분석하고 있습니다" />

      {error && <AlertNotice variant="danger">{error}</AlertNotice>}

      <div className="rounded-financial border border-border bg-card">
        <div className="px-6 py-5 space-y-5">
          {/* Overall status */}
          <div className="flex items-center gap-3">
            {data?.status === "failed" ? (
              <XCircle className="h-6 w-6 text-semantic-danger" />
            ) : data?.status === "completed" ? (
              <CheckCircle2 className="h-6 w-6 text-semantic-success" />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
            )}
            <div>
              <p className="font-semibold text-foreground">
                {data?.status === "failed"
                  ? "평가 실패"
                  : data?.status === "completed"
                    ? "평가 완료"
                    : data?.current_stage
                      ? STAGE_LABELS[data.current_stage]
                      : "평가 대기 중"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {data?.status === "failed"
                  ? (data.error_message ?? "알 수 없는 오류")
                  : "잠시 후 자동으로 결과 페이지로 이동합니다"}
              </p>
            </div>
          </div>

          {/* Stage progress */}
          <div className="space-y-2">
            {STAGES.map((stage, idx) => {
              const isDone = currentStageIndex > idx;
              const isActive = currentStageIndex === idx;

              return (
                <div key={stage} className="flex items-center gap-3">
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isDone
                        ? "bg-semantic-success text-white"
                        : isActive
                          ? "bg-brand-primary text-white"
                          : "bg-neutral-100 text-muted-foreground"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-sm ${
                      isDone
                        ? "text-muted-foreground line-through"
                        : isActive
                          ? "font-medium text-foreground"
                          : "text-muted-foreground/60"
                    }`}
                  >
                    {STAGE_LABELS[stage]}
                  </span>
                  {isActive && <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-primary" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {data?.status === "failed" && (
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/evaluation/start")}>
            다시 시도
          </Button>
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            대시보드로
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>5초마다 자동 확인. 페이지를 닫아도 평가는 계속 진행됩니다.</span>
      </div>
    </div>
  );
}
