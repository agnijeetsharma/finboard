
import { WidgetShell } from "./widget-shell"

export function LineChartWidget() {
  return (
    <WidgetShell>
      <h3 className="text-sm font-medium mb-2">Monthly Growth</h3>

      <div className="h-32 w-full bg-gray-100 rounded flex items-center justify-center text-gray-500 text-sm">
        Line Chart Preview
      </div>
    </WidgetShell>
  )
}
