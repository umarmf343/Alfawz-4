import fs from "node:fs/promises"
import { constants as FS_CONSTANTS } from "node:fs"
import path from "node:path"

import { NextResponse } from "next/server"

const REQUIRED_FILES = ["mushaf-madinah.woff2", "mushaf-madinah.woff"]
const FONT_DIRECTORY = path.join(process.cwd(), "public", "fonts", "mushaf")

export const runtime = "nodejs"

export async function GET() {
  try {
    await Promise.all(
      REQUIRED_FILES.map(async (file) => {
        const candidate = path.join(FONT_DIRECTORY, file)
        await fs.access(candidate, FS_CONSTANTS.R_OK)
      }),
    )

    return NextResponse.json({ ready: true })
  } catch (error) {
    console.warn("Mushaf font status check failed", error)
    return NextResponse.json(
      {
        ready: false,
        reason:
          "Mushaf font assets are missing. Run `npm run fonts:mushaf` and convert the downloaded TTX exports to WOFF/WOFF2 before restarting the server.",
      },
      { status: 200 },
    )
  }
}

