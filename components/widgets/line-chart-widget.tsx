"use client"

import useSWR from "swr"
import type { WidgetLine } from "@/lib/types"
import { toTimeSeries } from "@/lib/json-utils"
import { Loader2 } from "lucide-react"


import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Line } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

export function LineChartWidget({ widget }: { widget: WidgetLine }) {
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

  const series = toTimeSeries(data, widget.mapping.x, widget.mapping.y).slice(0, 200).reverse()
  const labels = series.map((d) => String(d.time))
  const values = series.map((d) => Number(d.value ?? 0))

  const chartData = {
    labels,
    datasets: [
      {
        label: widget.name || "Series",
        data: values,
        borderColor: "#0284c7", // sky-600
        backgroundColor: "rgba(2,132,199,0.15)",
        pointRadius: 0,
        tension: 0.35,
        fill: true,
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { intersect: false, mode: "index" as const },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } },
      y: { grid: { color: "rgba(124,63,0,0.08)" } }, 
    },
  }

  return (
    <div className="h-56">
      <Line data={chartData} options={options} />
    </div>
  )
}
