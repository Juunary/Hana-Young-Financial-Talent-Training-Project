"use client";

import { CheckCircle2, ClipboardList, Loader2, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AlertNotice } from "@/components/common/AlertNotice";
import { PageTitle } from "@/components/layout/PageTitle";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import type { EvaluationRequest } from "@/lib/types/evaluation";

const CHECKLIST = [
  { key: "academic", label: "학업 기록 (학점, 전공, 학교)" },
  { key: "projects", label: "프로젝트 경험" },
  { key: "internships", label: "인턴/대외활동" },
  { key: "certifications", label: "자격증" },
  { key: "education", label: "교육 이수 이력" },
  { key: "portfolio", label: "포트폴리오 링크" },
  { key: "github", label: "GitHub 프로필" },
  { key: "uploads", label: "파일 업로드" },
];

export default function EvaluationStartPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await api.post<EvaluationRequest>("/api/v1/evaluations");
      router.push(`/evaluation/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "평가 요청에 실패했습니다.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageTitle
        title="AI 역량 평가 시작"
        description="현재까지 입력된 역량 데이터를 기반으로 AI가 종합 평가를 수행합니다"
      />

      <AlertNotice variant="warning">
        <strong>프로토타입 안내</strong>
        <br />본 서비스는 시뮬레이션 프로토타입입니다. 실제 금융기관의 신용평가와 무관하며,
        결과는 참고용으로만 활용하시기 바랍니다.
      </AlertNotice>

      {/* Evaluation contents */}
      <div className="rounded-financial border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-brand-primary" />
            <span className="font-semibold text-sm text-foreground">평가 항목</span>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          {CHECKLIST.map((item) => (
            <div key={item.key} className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              <span className="text-foreground">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          현재 입력된 데이터를 기준으로 스냅샷을 생성합니다. 평가 요청 후 데이터를 수정해도 이번 평가 결과에는 반영되지 않습니다.
        </div>
      </div>

      {/* Scoring factors */}
      <div className="rounded-financial border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <span className="font-semibold text-sm text-foreground">채점 요소 (총 100점)</span>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-3 text-sm">
          {[
            { name: "학업 역량", max: 15 },
            { name: "프로젝트 깊이", max: 25 },
            { name: "실무 경험", max: 20 },
            { name: "자격/인증", max: 10 },
            { name: "포트폴리오", max: 15 },
            { name: "GitHub 활동", max: 10 },
            { name: "일관성/완성도", max: 5 },
          ].map((f) => (
            <div key={f.name} className="flex items-center justify-between">
              <span className="text-muted-foreground">{f.name}</span>
              <span className="font-medium text-foreground">{f.max}점</span>
            </div>
          ))}
        </div>
      </div>

      {error && <AlertNotice variant="danger">{error}</AlertNotice>}

      <div className="flex items-center gap-3">
        <Button
          onClick={handleStart}
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-strong"
          size="lg"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PlayCircle className="h-4 w-4" />
          )}
          {isSubmitting ? "평가 요청 중..." : "AI 평가 시작"}
        </Button>
        <p className="text-xs text-muted-foreground">평가에는 약 30~60초가 소요됩니다</p>
      </div>
    </div>
  );
}
