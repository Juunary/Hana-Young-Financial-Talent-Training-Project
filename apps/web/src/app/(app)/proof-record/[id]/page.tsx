"use client";

import { CheckCircle2, Loader2, ShieldCheck, ShieldOff, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AlertNotice } from "@/components/common/AlertNotice";
import { PageSkeleton } from "@/components/common/LoadingSkeleton";
import { PageTitle } from "@/components/layout/PageTitle";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import type { ProofRecordResponse, ProofVerifyResponse } from "@/lib/types/evaluation";

export default function ProofRecordPage() {
  const params = useParams<{ id: string }>();
  const [proof, setProof] = useState<ProofRecordResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<ProofVerifyResponse | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    api
      .get<ProofRecordResponse>(`/api/v1/proof-records/${params.id}`)
      .then(setProof)
      .catch((err) => setError(err instanceof Error ? err.message : "증명 기록을 찾을 수 없습니다."))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleVerify() {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await api.post<ProofVerifyResponse>(
        `/api/v1/proof-records/${params.id}/verify`,
      );
      setVerifyResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "검증에 실패했습니다.");
    } finally {
      setVerifying(false);
    }
  }

  if (loading) return <PageSkeleton />;
  if (error) return <AlertNotice variant="danger">{error}</AlertNotice>;
  if (!proof) return null;

  const isIssued = proof.verification_status === "issued";

  return (
    <div className="max-w-2xl space-y-6">
      <PageTitle
        title="오프체인 증명 기록"
        description="AI 역량 평가 결과의 무결성 증명 기록입니다"
      />

      <AlertNotice variant="info">
        본 기록은 프로토타입 환경에서 생성된 오프체인 증명입니다. 금융기관 공인 문서가 아니며,
        향후 블록체인 앵커링 연동을 위한 사전 준비 단계입니다.
      </AlertNotice>

      {/* Main proof card */}
      <div className="rounded-financial border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-neutral-50 px-5 py-3">
          <ShieldCheck className="h-4 w-4 text-brand-primary" />
          <span className="font-semibold text-sm text-foreground">증명 기록 상세</span>
          <span
            className={`ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              isIssued
                ? "bg-semantic-success/10 text-semantic-success"
                : "bg-semantic-danger/10 text-semantic-danger"
            }`}
          >
            {isIssued ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {isIssued ? "유효 (issued)" : "폐기됨 (revoked)"}
          </span>
        </div>

        <div className="px-5 py-5 space-y-4">
          {[
            { label: "증명 ID (Public ID)", value: proof.id, mono: true },
            {
              label: "평가 입력 해시 (SHA-256)",
              value: proof.payload_hash_sha256,
              mono: true,
            },
            {
              label: "증거 결합 해시 (SHA-256)",
              value: proof.evidence_combined_hash,
              mono: true,
            },
            { label: "증명 버전", value: proof.proof_version, mono: false },
            { label: "발급 기관", value: proof.issuer, mono: false },
            {
              label: "발급 시각",
              value: new Date(proof.created_at).toLocaleString("ko-KR"),
              mono: false,
            },
          ].map(({ label, value, mono }) => (
            <div key={label} className="grid grid-cols-[180px_1fr] gap-2">
              <span className="text-sm text-muted-foreground shrink-0">{label}</span>
              <span
                className={`text-sm text-foreground break-all ${mono ? "font-mono text-xs" : ""}`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Verify section */}
      <div className="rounded-financial border border-border bg-card px-5 py-5 space-y-4">
        <div>
          <p className="font-semibold text-sm text-foreground">무결성 검증</p>
          <p className="text-xs text-muted-foreground mt-1">
            저장된 canonical JSON을 재직렬화하여 SHA-256 해시를 재계산하고, 저장된 해시와 비교합니다.
          </p>
        </div>

        <Button
          onClick={handleVerify}
          disabled={verifying}
          variant="outline"
          className="flex items-center gap-2"
        >
          {verifying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          {verifying ? "검증 중..." : "해시 무결성 검증"}
        </Button>

        {verifyResult && (
          <div
            className={`rounded-financial border p-4 space-y-3 ${
              verifyResult.valid
                ? "border-semantic-success/40 bg-semantic-success/5"
                : "border-semantic-danger/40 bg-semantic-danger/5"
            }`}
          >
            <div className="flex items-center gap-2">
              {verifyResult.valid ? (
                <CheckCircle2 className="h-5 w-5 text-semantic-success" />
              ) : (
                <ShieldOff className="h-5 w-5 text-semantic-danger" />
              )}
              <span
                className={`font-semibold text-sm ${
                  verifyResult.valid ? "text-semantic-success" : "text-semantic-danger"
                }`}
              >
                {verifyResult.details}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono text-muted-foreground">
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="shrink-0">저장 해시</span>
                <span className="break-all">{verifyResult.stored_hash}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="shrink-0">계산 해시</span>
                <span
                  className={`break-all ${
                    verifyResult.valid ? "text-semantic-success" : "text-semantic-danger"
                  }`}
                >
                  {verifyResult.computed_hash}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Skill Finance Score 프로토타입 v1 · 블록체인 앵커링은 향후 구현 예정
      </p>
    </div>
  );
}
