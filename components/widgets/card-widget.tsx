"use client"

import useSWR from "swr"
import { formatField, getByPath } from "@/lib/json-utils"
import type { WidgetCard } from "@/lib/types"
import { Loader2 } from "lucide-react"

export function CardWidget({ widget }: { widget: WidgetCard }) {
  const { data, error, isLoading } = useSWR(
    ["widget", widget.id, widget.provider, widget.endpoint, widget.params],
    () =>
      fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: widget.provider,
          endpoint: widget.endpoint,
          params: widget.params,
        }),
      }).then((r) => r.json()),
    { refreshInterval: widget.refreshMs, dedupingInterval: 5_000 },
  )

  if (isLoading)
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading
      </div>
    )
  if (error) return <div className="text-sm text-destructive">Error loading</div>
  if (!data) return <div className="text-sm text-muted-foreground">No data</div>

  const values = (widget.mapping.paths || []).map((p) => {
    const v = getByPath(data, p)
    return { path: p, value: v }
  })

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {values.map((item) => (
        <div key={item.path} className="space-y-1">
          <div className="text-xs text-muted-foreground">{item.path}</div>
          <div className="text-xl font-semibold">{formatField(item.value, widget.mapping.format)}</div>
        </div>
      ))}
    </div>
  )
}

export { CardWidget as CardWidgetV2 }
