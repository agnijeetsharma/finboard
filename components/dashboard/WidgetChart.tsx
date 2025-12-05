
"use client";

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
  CategoryScale,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  ChartTooltip,
  Legend,
  Filler
);

export type XYPoint = { x: string; y: number };

interface WidgetChartProps {
  isNews: boolean;
  rows: Array<{ date: string; close?: number | null }>;
  newsPoints: XYPoint[];
}

export function WidgetChart({ isNews, rows, newsPoints }: WidgetChartProps) {
  const chartData =
    isNews
      ? newsPoints && newsPoints.length
        ? {
            labels: newsPoints.map((p) => p.x),
            datasets: [
              {
                label: "Articles",
                data: newsPoints.map((p) => p.y),
                borderColor: "rgb(2, 132, 199)",
                backgroundColor: "rgba(2, 132, 199, 0.15)",
                pointRadius: 2,
                fill: true,
                tension: 0.25,
              },
            ],
          }
        : undefined
      : rows && rows.length
      ? {
          labels: rows.map((r) => r.date),
          datasets: [
            {
              label: "Close",
              data: rows.map((r) => r.close),
              borderColor: "rgb(2, 132, 199)",
              backgroundColor: "rgba(2, 132, 199, 0.15)",
              pointRadius: 0,
              fill: true,
              tension: 0.25,
            },
          ],
        }
      : undefined;

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: {
        grid: { color: "rgba(120, 53, 15, 0.08)" },
        ticks: { maxTicksLimit: 6 },
      },
      y: {
        grid: { color: "rgba(120, 53, 15, 0.08)" },
        ticks: { callback: (v: number) => `${v}` },
      },
    },
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm">
          {isNews ? "Articles per day" : "Price (Close)"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          {chartData ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <p className="text-sm text-muted-foreground">No chartable data.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
