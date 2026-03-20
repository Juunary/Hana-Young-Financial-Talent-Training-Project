import { AlertCircle, Info, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

type AlertVariant = "info" | "warning" | "danger";

interface AlertNoticeProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<AlertVariant, { container: string; icon: React.ReactNode }> = {
  info: {
    container: "bg-semantic-info/10 border-semantic-info/30 text-semantic-info",
    icon: <Info className="h-4 w-4 shrink-0" />,
  },
  warning: {
    container: "bg-semantic-warning/10 border-semantic-warning/30 text-semantic-warning",
    icon: <AlertTriangle className="h-4 w-4 shrink-0" />,
  },
  danger: {
    container: "bg-semantic-danger/10 border-semantic-danger/30 text-semantic-danger",
    icon: <AlertCircle className="h-4 w-4 shrink-0" />,
  },
};

export function AlertNotice({ variant = "info", children, className }: AlertNoticeProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-financial border p-4 text-sm",
        styles.container,
        className,
      )}
    >
      {styles.icon}
      <div>{children}</div>
    </div>
  );
}
