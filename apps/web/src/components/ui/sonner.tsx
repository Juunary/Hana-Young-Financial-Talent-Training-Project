"use client"

import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

// 금융 시스템 알림 스타일: 흰 배경 + 경계선 + 왼쪽 컬러 바
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheck className="h-4 w-4 text-semantic-success" />,
        info: <Info className="h-4 w-4 text-semantic-info" />,
        warning: <TriangleAlert className="h-4 w-4 text-semantic-warning" />,
        error: <OctagonX className="h-4 w-4 text-semantic-danger" />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-sm border border-border bg-white text-foreground shadow-panel text-sm py-3 px-4",
          title: "font-medium text-sm text-foreground",
          description: "text-xs text-muted-foreground mt-0.5",
          actionButton:
            "rounded-sm bg-brand-primary text-white text-xs px-3 py-1.5 font-medium hover:bg-brand-primary-strong",
          cancelButton:
            "rounded-sm bg-neutral-100 text-muted-foreground text-xs px-3 py-1.5 font-medium hover:bg-neutral-200",
          success: "border-l-4 border-l-semantic-success",
          error: "border-l-4 border-l-semantic-danger",
          warning: "border-l-4 border-l-semantic-warning",
          info: "border-l-4 border-l-semantic-info",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
