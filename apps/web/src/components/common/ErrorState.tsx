import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "오류가 발생했습니다",
  message = "잠시 후 다시 시도해주세요.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-financial border border-semantic-danger/20 bg-semantic-danger/5 px-6 py-12 text-center",
        className,
      )}
    >
      <AlertCircle className="text-semantic-danger mb-4 h-10 w-10" />
      <h3 className="text-foreground text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </div>
  );
}
