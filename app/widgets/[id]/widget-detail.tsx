"use client";

import useSWR from "swr";
import Link from "next/link";
import { useMemo } from "react";
import { useDashboardStore } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  WidgetKpis,
  type NewsRow,
} from "@/components/dashboard/WidgetKpis";
import {
  WidgetChart,
  type XYPoint,
} from "@/components/dashboard/WidgetChart";
import { WidgetTable } from "@/components/dashboard/WidgetTable";

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


function mapFinnhubNewsToTable(raw: any): NewsRow[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((item) => ({
    time: item.datetime
      ? new Date(item.datetime * 1000).toLocaleString()
      : "",
    headline: item.headline ?? "",
    source: item.source ?? "",
    summary: item.summary ?? "",
    url: item.url ?? "",
  }));
}

function newsCountPerDayAdapter(raw: any): XYPoint[] {
  if (!Array.isArray(raw)) return [];

  const dayMap: Record<string, number> = {};

  for (const item of raw) {
    if (!item.datetime) continue;
    const day = new Date(item.datetime * 1000).toISOString().slice(0, 10); 
    dayMap[day] = (dayMap[day] || 0) + 1;
  }

  return Object.entries(dayMap)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([day, count]) => ({ x: day, y: count }));
}

function extractTimeSeries(obj: any) {
  if (!obj || typeof obj !== "object") return null;

 
  if (Array.isArray(obj.t) && Array.isArray(obj.c)) {
    return {
      type: "finnhub" as const,
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
  return key ? { type: "av" as const, series: obj[key] } : null;
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


  const isFinnhubNews =
    widget?.provider === "finnhub" &&
    (widget.endpoint === "/news"||widget.endpoint === "news" || widget.endpoint === "/company-news");

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

  const {
    rows,
    latest,
    prev,
    changeAbs,
    changePct,
    newsRows,
    newsPoints,
  } = useMemo(() => {
    if (isFinnhubNews) {
      const tableRows = mapFinnhubNewsToTable(data);
      const points = newsCountPerDayAdapter(data);
      return {
        rows: [] as any[],
        latest: null,
        prev: null,
        changeAbs: null,
        changePct: null,
        newsRows: tableRows,
        newsPoints: points,
      };
    }
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
      newsRows: [] as NewsRow[],
      newsPoints: [] as XYPoint[],
    };
  }, [data, isFinnhubNews]);

  if (!widget) {
    return (
      <main className="p-6">
        <p className="text-sm text-red-500">Widget not found.</p>
        <Link href="/" className="text-sky-600 hover:underline text-sm">
          Back to dashboard</Link>
      </main>
    );
  }

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
          <WidgetKpis
            isNews={isFinnhubNews}
            latest={latest}
            changeAbs={changeAbs}
            changePct={changePct}
            newsRows={newsRows}
          />

          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="raw">Raw JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="chart">
              <WidgetChart
                isNews={isFinnhubNews}
                rows={rows}
                newsPoints={newsPoints}
              />
            </TabsContent>

            <TabsContent value="table">
              <WidgetTable
                isNews={isFinnhubNews}
                rows={rows}
                newsRows={newsRows}
              />
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
