
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type NewsRow = {
  time: string;
  headline: string;
  source: string;
  summary: string;
  url: string;
};

interface WidgetKpisProps {
  isNews: boolean;
  latest?: { close?: number | null };
  changeAbs: number | null;
  changePct: number | null;
  newsRows: NewsRow[];
}

export function WidgetKpis({
  isNews,
  latest,
  changeAbs,
  changePct,
  newsRows,
}: WidgetKpisProps) {
  if (isNews) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="bg-card">
          <CardHeader className="py-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Articles
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-semibold">{newsRows.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="py-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              First Article Time
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs">{newsRows[0]?.time ?? "—"}</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="py-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Last Article Time
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs">
              {newsRows[newsRows.length - 1]?.time ?? "—"}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card className="bg-card">
        <CardHeader className="py-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Latest Close
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xl font-semibold">{latest?.close ?? "—"}</div>
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
  );
}
