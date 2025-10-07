import fs from "node:fs"
import path from "node:path"

const requiredMushafFonts = ["mushaf-madinah.woff2", "mushaf-madinah.woff"]
const mushafFontDirectory = path.join(process.cwd(), "public", "fonts", "mushaf")

const mushafFontsReady = requiredMushafFonts.every((file) => {
  try {
    const candidate = path.join(mushafFontDirectory, file)
    return fs.existsSync(candidate) && fs.statSync(candidate).isFile()
  } catch {
    return false
  }
})

const transcriptionEnabled = typeof process.env.TARTEEL_API_KEY === "string" && process.env.TARTEEL_API_KEY.length > 0

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: "standalone",
  env: {
    NEXT_PUBLIC_MUSHAF_FONTS_READY: mushafFontsReady ? "true" : "false",
    NEXT_PUBLIC_TRANSCRIPTION_ENABLED: transcriptionEnabled ? "true" : "false",
  },
}

export default nextConfig
