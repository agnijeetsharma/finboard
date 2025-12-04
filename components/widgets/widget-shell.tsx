"use client"

import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Eye, Trash2 } from "lucide-react"
import type { Widget } from "@/lib/types"

const providerLabel: Record<string, string> = {
  alphaVantage: "Alpha Vantage",
  finnhub: "Finnhub",
}

export function WidgetShell({
  widget,
  children,
  onRemove,
}: { widget: Widget; children: ReactNode; onRemove: () => void }) {
  return (
    <Card className="finboard-card group">
      <CardHeader className="flex-row items-start justify-between gap-3 pb-3">
        <div className="min-w-0 flex-1">
          <CardTitle className="finboard-text-balance text-base font-semibold mb-2 group-hover:text-primary transition-colors">
            {widget.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="h-6 px-2.5 text-xs font-medium border-accent/40 text-accent bg-accent/10 hover:bg-accent/20 transition-colors"
            >
              {providerLabel[widget.provider] ?? widget.provider}
            </Badge>
            <span className="text-xs text-muted-foreground">{widget.refreshInterval}s refresh</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/widgets/${widget.id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-border/60 hover:border-primary/60 px-2.5 py-1.5 text-xs font-medium hover:bg-primary/5 finboard-focus transition-all"
            aria-label="View widget detail"
          >
            <Eye className="size-3.5" />
            <span>View</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label="Remove widget"
            className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 finboard-focus"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">{children}</CardContent>
    </Card>
  )
}
