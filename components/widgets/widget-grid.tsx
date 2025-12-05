"use client";

import { useDashboardStore } from "@/lib/store";
import type { WidgetCard } from "@/lib/types";
import { WidgetShell } from "./widget-shell";
import { CardWidgetV2 } from "./card-widget";

export function WidgetsGrid() {
  const widgets = useDashboardStore(
    (s: any) => (s.widgets as WidgetCard[]) ?? []
  );
  const removeWidget = useDashboardStore((s: any) => s.removeWidget);

  if (!widgets.length) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        No widgets yet. Add one from the builder.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {widgets.map((w) => (
        <WidgetShell
          key={w.id}
          widget={w}
          onRemove={() => removeWidget?.(w.id)}
        >
          <CardWidgetV2 widget={w} />
        </WidgetShell>
      ))}
    </div>
  );
}
