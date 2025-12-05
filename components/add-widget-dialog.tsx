"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { JSONExplorer } from "@/components/json-explorer"
import { useDashboardStore } from "@/lib/store"
import type { ProviderId, WidgetType, FieldFormat } from "@/lib/types"

type Props = { open: boolean; onOpenChange: (v: boolean) => void }
function getDefaultEndpoint(provider: ProviderId, type: WidgetType): string {
  if (provider === "alphaVantage") {
    if (type === "line" || type === "table") return "TIME_SERIES_DAILY"
    return "TIME_SERIES_DAILY"
  }
  if (type === "line" || type === "table") return "stock/candle"
  return "news"
}

function buildParams(provider: ProviderId, endpoint: string, symbol: string) {
  const cleanEndpoint = endpoint.replace(/^\/+/, "") 

  if (provider === "alphaVantage") {
    return symbol ? { symbol } : {}
  }


  if (provider === "finnhub") {
    if (cleanEndpoint === "stock/candle" || cleanEndpoint === "crypto/candle") {
      const now = Math.floor(Date.now() / 1000)
      const from = now - 30 * 24 * 60 * 60 

      return {
        symbol,
        resolution: "D",
        from,
        to: now,
      }
    }
    if (cleanEndpoint === "company-news") {
      const to = new Date()
      const fromDate = new Date()
      fromDate.setDate(to.getDate() - 30)
      const fmt = (d: Date) => d.toISOString().slice(0, 10)

      return {
        symbol,
        from: fmt(fromDate),
        to: fmt(to),
      }
    }

    return symbol ? { symbol } : {}
  }

  return symbol ? { symbol } : {}
}

export function AddWidgetDialog({ open, onOpenChange }: Props) {
  const [type, setType] = useState<WidgetType>("card")
  const [provider, setProvider] = useState<ProviderId>("alphaVantage")

  const [name, setName] = useState("")
  const [endpoint, setEndpoint] = useState<string>(
    getDefaultEndpoint("alphaVantage", "card"),
  )
  const [symbol, setSymbol] = useState("AAPL")
  const [refreshMs, setRefreshMs] = useState(60_000)
  const [preview, setPreview] = useState<any>(null)
  const [paths, setPaths] = useState<string[]>([])
  const [chartX, setChartX] = useState<string>("time")
  const [chartY, setChartY] = useState<string>("close")
  const [format, setFormat] = useState<FieldFormat>("number")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addWidget = useDashboardStore((s) => s.addWidget)

  function handleProviderChange(v: ProviderId) {
    setProvider(v)
    setEndpoint(getDefaultEndpoint(v, type))
  }

  function handleTypeChange(v: WidgetType) {
    setType(v)
    setEndpoint(getDefaultEndpoint(provider, v))
  }

  async function doPreview() {
    setError(null)
    setIsLoading(true)
    setPreview(null)
    try {
      const params = buildParams(provider, endpoint, symbol)
      const body = {
        provider,
        endpoint,
        params,
        intent: "preview",
      }
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof json?.error === "string" ? json.error : "Fetch failed")
      } else {
        setPreview(json)
      }
    } catch (e: any) {
      setError(e?.message || "Network error")
    } finally {
      setIsLoading(false)
    }
  }

  function onAdd() {
    const params = buildParams(provider, endpoint, symbol)

    const common = {
      title: name || `${symbol} ${type}`,
      name: name || `${symbol} ${type}`,
      provider,
      endpoint,
      params,
      refreshMs,
    }

    if (type === "card") {
      addWidget({
        type,
        ...common,
        mapping: { paths, format },
      } as any)
    } else if (type === "table") {
      addWidget({
        type,
        ...common,
        mapping: { columns: paths },
      } as any)
    } else {
      addWidget({
        type,
        ...common,
        mapping: { x: chartX, y: chartY },
      } as any)
    }

    onOpenChange(false)
    setPreview(null)
    setPaths([])
    setName("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Widget Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AAPL Daily Close"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(v) => handleTypeChange(v as WidgetType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Provider</Label>
              <Select
                value={provider}
                onValueChange={(v) => handleProviderChange(v as ProviderId)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphaVantage">Alpha Vantage</SelectItem>
                  <SelectItem value="finnhub">Finnhub</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Endpoint</Label>
              <Input
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder={
                  provider === "alphaVantage"
                    ? "TIME_SERIES_DAILY"
                    : type === "line" || type === "table"
                      ? "stock/candle"
                      : "quote"
                }
              />
              <p className="text-xs text-muted-foreground">
                Use provider-specific function or path (e.g.
                &nbsp;
                <code className="font-mono">TIME_SERIES_DAILY</code> or
                &nbsp;
                <code className="font-mono">stock/candle</code>).
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Symbol</Label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="AAPL"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Auto Refresh (ms)</Label>
              <Input
                type="number"
                min={0}
                value={refreshMs}
                onChange={(e) =>
                  setRefreshMs(Number.parseInt(e.target.value || "0", 10))
                }
              />
            </div>
            {type === "card" && (
              <div className="space-y-1.5">
                <Label>Format</Label>
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as FieldFormat)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="percent">Percent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" onClick={doPreview} disabled={isLoading}>
              {isLoading ? "Testing…" : "Test Fetch"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Keys are read on the server in{" "}
              <code className="font-mono">/api/proxy</code>. Configure{" "}
              <span className="font-mono">ALPHA_VANTAGE_API_KEY</span> /{" "}
              <span className="font-mono">FINNHUB_API_KEY</span>.
            </p>
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}

          <Tabs defaultValue="explore" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="explore">JSON Explorer</TabsTrigger>
              <TabsTrigger value="map">Field Mapping</TabsTrigger>
            </TabsList>
            <TabsContent value="explore">
              <div className="border rounded p-2 max-h-72 overflow-auto">
                {preview ? (
                  <JSONExplorer
                    data={preview}
                    onPickPath={(p) =>
                      setPaths((prev) => Array.from(new Set([...prev, p])))
                    }
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isLoading
                      ? "Loading preview…"
                      : 'Click "Test Fetch" to preview API response.'}
                  </p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="map">
              {type === "line" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">X (time) path</Label>
                    <Input
                      value={chartX}
                      onChange={(e) => setChartX(e.target.value)}
                      placeholder="time"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Y (value) path</Label>
                    <Input
                      value={chartY}
                      onChange={(e) => setChartY(e.target.value)}
                      placeholder="close"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs">Selected fields</Label>
                  <Textarea
                    value={paths.join(", ")}
                    onChange={(e) =>
                      setPaths(
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="Add JSON paths separated by comma, e.g. meta.symbol, latest.close"
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onAdd}>Add Widget</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
