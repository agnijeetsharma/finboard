import { WidgetShell } from "./widget-shell"

export function TableWidget() {
  return (
    <WidgetShell>
      <h3 className="text-sm font-medium mb-3">Recent Users</h3>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-1">Name</th>
            <th className="py-1">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-1">Aman</td>
            <td className="py-1 text-green-600">Active</td>
          </tr>
          <tr>
            <td className="py-1">Neha</td>
            <td className="py-1 text-red-600">Inactive</td>
          </tr>
        </tbody>
      </table>
    </WidgetShell>
  )
}
