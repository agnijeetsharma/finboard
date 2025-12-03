import { WidgetShell } from "@/components/widgets/widget-shell"

export function CardWidget() {
  return (
    <WidgetShell>
      <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
      <p className="text-3xl font-bold mt-2">₹42,560</p>
    </WidgetShell>
  )
}
