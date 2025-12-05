"use client";

import useSWR from "swr";
import Link from "next/link";
import { useMemo } from "react";
import { useDashboardStore } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";



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

const fetcher = (url: string, body: any) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || r.statusText);
    return data;
  });

function extractTimeSeries(obj: any) {
  if (!obj || typeof obj !== "object") return null;

  if (Array.isArray(obj.t) && Array.isArray(obj.c)) {
    return {
      type: "finnhub",
      rows: obj.t.map((ts: number, i: number) => ({
        date: new Date(ts * 1000).toISOString().slice(0, 10),
        open: Number(obj.o?.[i]),
        high: Number(obj.h?.[i]),
        low: Number(obj.l?.[i]),
        close: Number(obj.c?.[i]),
        volume: obj.v?.[i] != null ? Number(obj.v[i]) : undefined,
      })),
    };
  }

  const key = Object.keys(obj).find((k) =>
    k.toLowerCase().includes("time series")
  );
  return key ? { type: "av", series: obj[key] } : null;
}

function mapAVSeriesToArray(series: any) {
  if (!series || typeof series !== "object") return [];
  const rows = Object.keys(series).map((date) => {
    const d = series[date] || {};
    const get = (k: string) => {
      const key = Object.keys(d).find((x) => x.toLowerCase().includes(k));
      const v = key ? d[key] : undefined;
      const n =
        typeof v === "string"
          ? Number(v)
          : typeof v === "number"
          ? v
          : Number.NaN;
      return Number.isFinite(n) ? n : null;
    };
    return {
      date,
      open: get("open"),
      high: get("high"),
      low: get("low"),
      close: get("close"),
      volume: get("volume"),
    };
  });
  return rows.sort((a, b) => (a.date > b.date ? 1 : -1));
}

export default function WidgetDetail({ id }: { id: string }) {
  const widget = useDashboardStore((s: any) => s.getWidget?.(id));

  const body = widget
    ? {
        provider: widget.provider,
        endpoint: widget.endpoint,
        params: widget.params,
      }
    : null;
  const { data, error, isLoading, mutate } = useSWR(
    body ? ["/api/proxy", body] : null,
    ([u, b]) => fetcher(u, b),
    {
      refreshInterval: widget?.refreshMs ?? 60000,
      revalidateOnFocus: false,
    }
  );

  const { rows, latest, prev, changeAbs, changePct } = useMemo(() => {
    const ex = extractTimeSeries(data);
    let arr: any[] = [];
    if (ex?.type === "finnhub") {
      arr = (ex.rows as any[]).sort((a, b) => (a.date > b.date ? 1 : -1));
    } else if (ex?.type === "av") {
      arr = mapAVSeriesToArray(ex.series);
    } else {
      arr = [];
    }
    const last = arr[arr.length - 1];
    const secondLast = arr[arr.length - 2];
    const chAbs =
      last && secondLast && last.close != null && secondLast.close != null
        ? last.close - secondLast.close
        : null;
    const chPct =
      chAbs != null && secondLast?.close
        ? Number(((chAbs / (secondLast.close || 1)) * 100).toFixed(2))
        : null;
    return {
      rows: arr,
      latest: last,
      prev: secondLast,
      changeAbs: chAbs,
      changePct: chPct,
    };
  }, [data]);

  if (!widget) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-500">Widget not found.</p>
        <Link href="/" className="text-sky-600 hover:underline text-sm">
          Back to dashboard
        </Link>
      </main>
    );
  }

  const chartData =
    rows && rows.length
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
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-balance">
            {widget.title || widget.name}
          </h1>
          <p className="text-sm text-muted-foreground">{widget.provider}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => mutate()}
            className="hover:border-sky-600"
          >
            Refresh
          </Button>
          <Link
            href="/"
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:border-sky-600"
          >
            Back
          </Link>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}
      {error ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-500">
              {String((error as any)?.message || error)}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !error ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="bg-card">
              <CardHeader className="py-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Latest Close
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xl font-semibold">
                  {latest?.close ?? "—"}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardHeader className="py-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Change
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div
                  className={`text-xl font-semibold ${
                    (changeAbs ?? 0) >= 0 ? "text-sky-600" : "text-rose-600"
                  }`}
                >
                  {changeAbs != null
                    ? (changeAbs >= 0 ? "+" : "") + changeAbs.toFixed(2)
                    : "—"}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardHeader className="py-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Change %
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div
                  className={`text-xl font-semibold ${
                    (changePct ?? 0) >= 0 ? "text-sky-600" : "text-rose-600"
                  }`}
                >
                  {changePct != null
                    ? (changePct >= 0 ? "+" : "") + changePct.toFixed(2) + "%"
                    : "—"}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="raw">Raw JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="chart">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm">Price (Close)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[320px]">
                    {chartData ? (
                      <Line data={chartData} options={chartOptions} />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No chartable data.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="table">
              <Card className="bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm">OHLCV</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[60vh] overflow-auto">
                    <table className="w-full text-sm table-fixed">
                      <thead className="sticky top-0 bg-background">
                        <tr className="text-left">
                          <th className="px-2 py-2 font-medium">Date</th>
                          <th className="px-2 py-2 font-medium">Open</th>
                          <th className="px-2 py-2 font-medium">High</th>
                          <th className="px-2 py-2 font-medium">Low</th>
                          <th className="px-2 py-2 font-medium">Close</th>
                          <th className="px-2 py-2 font-medium">Volume</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(rows || []).slice(-200).map((r, i) => (
                          <tr
                            key={r.date}
                            className={`border-t ${i % 2 ? "bg-muted/30" : ""}`}
                          >
                            <td className="px-2 py-2">{r.date}</td>
                            <td className="px-2 py-2">{r.open ?? "—"}</td>
                            <td className="px-2 py-2">{r.high ?? "—"}</td>
                            <td className="px-2 py-2">{r.low ?? "—"}</td>
                            <td className="px-2 py-2">{r.close ?? "—"}</td>
                            <td className="px-2 py-2">{r.volume ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="raw">
              <Card className="bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm">Raw Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="max-h-[70vh] overflow-auto text-xs leading-5 rounded-md border p-3">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </main>
  );
}
