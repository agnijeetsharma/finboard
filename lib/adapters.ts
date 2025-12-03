export type Candle = { time: number; open: number; high: number; low: number; close: number; volume?: number }

function isFiniteNum(n: any) {
  const v = typeof n === "string" ? Number.parseFloat(n) : n
  return typeof v === "number" && Number.isFinite(v)
}


export function adaptAlphaVantageDaily(json: any): Candle[] {
  const series =
    json?.["Time Series (Daily)"] ||
    json?.["Time Series (Digital Currency Daily)"] ||
    json?.["Time Series (5min)"] ||
    json?.["Time Series (60min)"] ||
    json?.["Weekly Time Series"] ||
    json?.["Monthly Time Series"]

  if (!series || typeof series !== "object") return []

  const rows: Candle[] = Object.keys(series)
    .map((date) => {
      const row = series[date]
      const o = row?.["1. open"] ?? row?.open
      const h = row?.["2. high"] ?? row?.high
      const l = row?.["3. low"] ?? row?.low
      const c = row?.["4. close"] ?? row?.close
      const v = row?.["5. volume"] ?? row?.volume
      const t = Date.parse(date)
      if (!isFiniteNum(o) || !isFiniteNum(h) || !isFiniteNum(l) || !isFiniteNum(c) || !Number.isFinite(t)) return null
      return { time: t / 1000, open: +o, high: +h, low: +l, close: +c, volume: isFiniteNum(v) ? +v : undefined }
    })
    .filter(Boolean) as Candle[]

 
  return rows.sort((a, b) => a.time - b.time)
}


export function adaptFinnhubCandle(json: any): Candle[] {
  const { t, o, h, l, c, v } = json || {}
  if (!Array.isArray(t) || !Array.isArray(o) || !Array.isArray(h) || !Array.isArray(l) || !Array.isArray(c)) return []
  const rows: Candle[] = t
    .map((ts: number, i: number) => {
      const open = o[i],
        high = h[i],
        low = l[i],
        close = c[i]
      const volume = Array.isArray(v) ? v[i] : undefined
      if (!isFiniteNum(open) || !isFiniteNum(high) || !isFiniteNum(low) || !isFiniteNum(close)) return null
      return {
        time: ts,
        open: +open,
        high: +high,
        low: +low,
        close: +close,
        volume: isFiniteNum(volume) ? +volume : undefined,
      }
    })
    .filter(Boolean) as Candle[]
  return rows.sort((a, b) => a.time - b.time)
}

export function adaptFinnhubQuote(json: any): Candle[] {
  const { c, h, l, o, t } = json || {}
  if (!isFiniteNum(o) || !isFiniteNum(h) || !isFiniteNum(l) || !isFiniteNum(c)) return []
  const ts = Number.isFinite(+t) ? +t : Math.floor(Date.now() / 1000)
  return [{ time: ts, open: +o, high: +h, low: +l, close: +c }]
}

export function normalizeFrom(provider: string, endpoint: string, json: any): Candle[] {
  const p = (provider || "").toLowerCase()
  if (p === "finnhub") {
    if (endpoint.includes("/stock/candle")) return adaptFinnhubCandle(json)
    if (endpoint.includes("/quote")) return adaptFinnhubQuote(json)
  }

  return adaptAlphaVantageDaily(json)
}
