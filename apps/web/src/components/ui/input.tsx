import * as React from "react"

import { cn } from "@/lib/utils"

// 금융 서식 스타일: h-9, border-neutral-200, rounded-sm(4px), green focus ring
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-sm border border-neutral-200 bg-white px-3 py-2 text-sm text-foreground",
          "placeholder:text-neutral-300",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary focus-visible:border-brand-primary",
          "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-300",
          "transition-colors",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
