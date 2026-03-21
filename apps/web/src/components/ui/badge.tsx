import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// 금융권 상태 배지: rounded-sm(2px), 모든 variant에 border, pill 금지
const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
  {
    variants: {
      variant: {
        // 기본 (브랜드 그린)
        default:
          "border-brand-primary/25 bg-brand-soft-bg text-brand-primary-strong",
        // 중립 보조
        secondary:
          "border-neutral-200 bg-neutral-100 text-neutral-700",
        // 오류/삭제
        destructive:
          "border-red-200 bg-red-50 text-red-700",
        // 외곽선만
        outline:
          "border-border bg-transparent text-foreground",
        // 성공/완료
        success:
          "border-green-200 bg-green-50 text-green-700",
        // 주의/경고
        warning:
          "border-amber-200 bg-amber-50 text-amber-700",
        // 진행중/처리중
        processing:
          "border-blue-200 bg-blue-50 text-blue-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
