import { AlertCircle, Banknote } from "lucide-react";

interface LoanRangeEstimate {
  range_min: number;
  range_max: number;
  rationale: string;
  disclaimer_text: string;
}

interface LoanRangeEstimateCardProps {
  estimate: LoanRangeEstimate;
}

function formatKRW(amount: number): string {
  if (amount >= 10_000_000) {
    return `${(amount / 10_000_000).toFixed(0)}천만원`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(0)}백만원`;
  }
  return `${amount.toLocaleString()}원`;
}

export function LoanRangeEstimateCard({ estimate }: LoanRangeEstimateCardProps) {
  return (
    <div className="rounded-financial border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border bg-neutral-50 px-5 py-3">
        <Banknote className="h-4 w-4 text-brand-primary" />
        <span className="text-sm font-semibold text-foreground">예상 대출 범위</span>
        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          시뮬레이션
        </span>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Range display */}
        <div className="flex items-end gap-3">
          <div className="text-center flex-1 rounded-financial bg-brand-soft-bg p-3">
            <p className="text-xs text-muted-foreground mb-1">최소</p>
            <p className="text-2xl font-bold text-brand-primary">{formatKRW(estimate.range_min)}</p>
          </div>
          <span className="text-muted-foreground pb-3 text-xl font-light">~</span>
          <div className="text-center flex-1 rounded-financial bg-brand-soft-bg p-3">
            <p className="text-xs text-muted-foreground mb-1">최대</p>
            <p className="text-2xl font-bold text-brand-primary">{formatKRW(estimate.range_max)}</p>
          </div>
        </div>

        {/* Rationale */}
        {estimate.rationale && (
          <p className="text-sm text-muted-foreground leading-relaxed">{estimate.rationale}</p>
        )}

        {/* Disclaimer */}
        <div className="flex gap-2 rounded-financial border border-semantic-danger/30 bg-semantic-danger/5 p-3 text-xs text-semantic-danger">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{estimate.disclaimer_text}</p>
        </div>
      </div>
    </div>
  );
}
