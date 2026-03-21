import { CheckCircle2, ExternalLink, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";

interface ProofRecord {
  id: string;
  proof_version: string;
  payload_hash_sha256: string;
  issuer: string;
  verification_status: "issued" | "revoked";
  created_at: string;
}

interface ProofRecordCardProps {
  proof: ProofRecord;
}

export function ProofRecordCard({ proof }: ProofRecordCardProps) {
  const isIssued = proof.verification_status === "issued";

  return (
    <div className="rounded-financial border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-neutral-50 px-5 py-3">
        <ShieldCheck className="h-4 w-4 text-brand-primary" />
        <span className="text-sm font-semibold text-foreground">오프체인 증명 기록</span>
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
          {isIssued ? "유효" : "폐기됨"}
        </span>
      </div>

      <div className="px-5 py-4 space-y-3 text-sm">
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          <span className="text-muted-foreground whitespace-nowrap">증명 ID</span>
          <span className="font-mono text-xs text-foreground break-all">{proof.id}</span>

          <span className="text-muted-foreground whitespace-nowrap">해시 (SHA-256)</span>
          <span className="font-mono text-xs text-foreground break-all">
            {proof.payload_hash_sha256.slice(0, 16)}…
          </span>

          <span className="text-muted-foreground whitespace-nowrap">버전</span>
          <span className="text-foreground">{proof.proof_version}</span>

          <span className="text-muted-foreground whitespace-nowrap">발급 기관</span>
          <span className="text-foreground text-xs">{proof.issuer}</span>

          <span className="text-muted-foreground whitespace-nowrap">발급 시각</span>
          <span className="text-foreground">
            {new Date(proof.created_at).toLocaleString("ko-KR")}
          </span>
        </div>

        <div className="pt-1">
          <Link
            href={`/proof-record/${proof.id}`}
            className="inline-flex items-center gap-1 text-xs text-brand-primary hover:underline"
          >
            증명 기록 상세 보기
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          본 기록은 프로토타입 환경에서 생성되었으며, 금융기관 공인 문서가 아닙니다.
        </p>
      </div>
    </div>
  );
}
