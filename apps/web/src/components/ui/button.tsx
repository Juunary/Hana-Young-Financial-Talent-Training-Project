import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // base: 작고 단정한 금융 버튼. rounded-sm(4px), 과한 애니메이션 없음
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // primary CTA — green solid
        default:
          "bg-brand-primary text-white hover:bg-brand-primary-strong active:bg-brand-primary-strong",
        // white + gray border
        secondary:
          "bg-white border border-neutral-300 text-foreground hover:bg-neutral-50 active:bg-neutral-100",
        // 민트 소프트 배경 — 보조 액션
        subtle:
          "bg-brand-soft-bg text-brand-primary-strong border border-brand-mint-border hover:bg-brand-mint-border active:bg-brand-mint-border",
        // text only
        ghost:
          "text-muted-foreground hover:bg-neutral-100 hover:text-foreground active:bg-neutral-200",
        // 파괴적 액션 (삭제 등)
        destructive:
          "bg-semantic-danger text-white hover:bg-red-700 active:bg-red-800",
        // 인라인 링크
        link: "text-brand-primary underline-offset-4 hover:underline p-0 h-auto",
        // outline (이전 호환)
        outline:
          "border border-neutral-300 bg-white text-foreground hover:bg-neutral-50",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-9 px-4",
        lg: "h-10 px-5",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
