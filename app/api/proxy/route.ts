import { type NextRequest, NextResponse } from "next/server"

type Body = {
  provider: "alphaVantage" | "finnhub"
  endpoint: string
  params?: Record<string, string>
  intent?: "preview" | "data"
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body
    const { provider, endpoint, params = {} } = body

    let url = ""
    const headers: HeadersInit = {}

    if (provider === "alphaVantage") {
      const key = process.env.ALPHA_VANTAGE_API_KEY
      if (!key) return NextResponse.json({ error: "Missing ALPHA_VANTAGE_API_KEY" }, { status: 500 })
      const sp = new URLSearchParams({ function: endpoint, apikey: key, ...asStringRecord(params) })
      url = `https://www.alphavantage.co/query?${sp.toString()}`
    } else if (provider === "finnhub") {
      const key = process.env.FINNHUB_API_KEY
      if (!key) return NextResponse.json({ error: "Missing FINNHUB_API_KEY" }, { status: 500 })
      const base = "https://finnhub.io/api/v1"
      const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
      const sp = new URLSearchParams({ token: key, ...asStringRecord(params) })
      url = `${base}${path}?${sp.toString()}`
    } else {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 })
    }

    const res = await fetch(url, { headers, next: { revalidate: 0 } })
    const status = res.status

    if (status === 429) {
      return NextResponse.json({ error: "Rate limit exceeded", status }, { status })
    }

    const text = await res.text()
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text } 
    }
    return NextResponse.json(data, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}

function asStringRecord(obj: Record<string, any>): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, String(v)]))
}
