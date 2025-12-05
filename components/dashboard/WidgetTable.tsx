
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NewsRow } from "./WidgetKpis";

interface OhlcRow {
  date: string;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;
  volume?: number | null;
}

interface WidgetTableProps {
  isNews: boolean;
  rows: OhlcRow[];
  newsRows: NewsRow[];
}

export function WidgetTable({ isNews, rows, newsRows }: WidgetTableProps) {
  return (
    <Card className="bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm">
          {isNews ? "News" : "OHLCV"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[60vh] overflow-auto">
          {isNews ? (
            <table className="w-full text-sm table-fixed">
              <thead className="sticky top-0 bg-background">
                <tr className="text-left">
                  <th className="px-2 py-2 font-medium">Time</th>
                  <th className="px-2 py-2 font-medium">Headline</th>
                  <th className="px-2 py-2 font-medium">Source</th>
                  <th className="px-2 py-2 font-medium">Summary</th>
                </tr>
              </thead>
              <tbody>
                {newsRows.map((r, i) => (
                  <tr
                    key={i}
                    className={`border-t ${i % 2 ? "bg-muted/30" : ""}`}
                  >
                    <td className="px-2 py-2 whitespace-nowrap">{r.time}</td>
                    <td className="px-2 py-2">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold hover:underline"
                      >
                        {r.headline}
                      </a>
                    </td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">
                      {r.source}
                    </td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">
                      {r.summary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
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
                {rows.slice(-200).map((r, i) => (
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}
