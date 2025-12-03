import { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function WidgetShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-4 shadow-sm min-h-[120px]",
        className
      )}
    >
      {children}
    </div>
  )
}
