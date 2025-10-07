import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  const enabled = typeof apiKey === "string" && apiKey.length > 0
  const model = process.env.WHISPER_MODEL?.trim() || "whisper-1"

  if (!enabled) {
    return NextResponse.json({ enabled: false, reason: "OpenAI API key is not configured on the server." })
  }

  return NextResponse.json({ enabled: true, model })
}

