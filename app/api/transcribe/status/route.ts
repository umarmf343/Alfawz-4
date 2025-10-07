import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  const apiKey = process.env.TARTEEL_API_KEY?.trim()
  const enabled = typeof apiKey === "string" && apiKey.length > 0
  const engine = "tarteel"
  const baseUrl = process.env.TARTEEL_API_BASE_URL?.trim() || "https://api.tarteel.ai/api/v1"

  if (!enabled) {
    return NextResponse.json({ enabled: false, reason: "Tarteel API key is not configured on the server." })
  }

  return NextResponse.json({ enabled: true, engine, baseUrl })
}

