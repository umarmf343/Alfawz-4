#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import { createWriteStream } from "node:fs"
import { pipeline } from "node:stream/promises"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OUTPUT_DIR = path.join(__dirname, "..", "public", "fonts", "mushaf")

const FONT_MANIFEST = [
  {
    family: "Mushaf Madinah",
    remoteFile: "font-files/QCF_P001.ttx",
    localFile: "QCF_P001.ttx",
    description:
      "First page of the Madinah Mushaf in TTX form. Convert to OTF/WOFF before shipping to the browser.",
  },
  {
    family: "Mushaf Madinah",
    remoteFile: "font-files/QCF_P002.ttx",
    localFile: "QCF_P002.ttx",
    description:
      "Second page of the Madinah Mushaf in TTX form. Bundle remaining pages as needed.",
  },
]

async function fetchToFile(remotePath, destination) {
  const url = new URL(`https://raw.githubusercontent.com/TarteelAI/quran-ttx/main/${remotePath}`)

  try {
    await fetchWithNode(remotePath, url, destination)
    return
  } catch (error) {
    if (!shouldFallbackToCurl(error)) {
      throw error
    }

    const reason = error?.message ?? "fetch failed"
    console.warn(`Node fetch failed for ${remotePath} (${reason}) — retrying with curl.`)
  }

  await fetchWithCurl(remotePath, url, destination)
}

async function fetchWithNode(remotePath, url, destination) {
  const response = await fetch(url, {
    headers: { "User-Agent": "alfawz-sync-script" },
  })

  if (!response.ok || !response.body) {
    throw new Error(`Unable to download ${remotePath} (status ${response.status})`)
  }

  await pipeline(response.body, createWriteStream(destination))
}

function shouldFallbackToCurl(error) {
  if (!error) {
    return false
  }

  const message = error.message ?? ""
  const causeCode = error.cause?.code

  return (
    causeCode === "ENETUNREACH" ||
    causeCode === "ECONNREFUSED" ||
    causeCode === "ECONNRESET" ||
    /ENETUNREACH|ECONNREFUSED|ECONNRESET/i.test(message)
  )
}

async function fetchWithCurl(remotePath, url, destination) {
  await new Promise((resolve, reject) => {
    const curl = spawn("curl", ["-sSL", url.toString(), "-o", destination], {
      stdio: ["ignore", "inherit", "pipe"],
    })

    const stderr = []

    curl.stderr.on("data", (chunk) => {
      stderr.push(chunk)
    })

    curl.on("error", (error) => {
      reject(new Error(`Unable to launch curl for ${remotePath}: ${error.message}`))
    })

    curl.on("close", (code) => {
      if (code === 0) {
        resolve()
        return
      }

      const details = Buffer.concat(stderr).toString().trim()
      reject(new Error(`curl exited with code ${code}${details ? ` — ${details}` : ""}`))
    })
  })
}

async function main() {
  try {
    await mkdir(OUTPUT_DIR, { recursive: true })
  } catch (error) {
    console.error("Unable to create output directory", error)
    process.exitCode = 1
    return
  }

  const summary = []

  for (const font of FONT_MANIFEST) {
    const destination = path.join(OUTPUT_DIR, font.localFile)
    try {
      await fetchToFile(font.remoteFile, destination)
      summary.push(`✓ ${font.localFile} saved → ${font.description}`)
    } catch (error) {
      console.error(`Failed to download ${font.remoteFile}:`, error.message)
      summary.push(`✗ ${font.localFile} failed — see logs above.`)
      process.exitCode = 1
    }
  }

  const manifestPath = path.join(OUTPUT_DIR, "manifest.json")
  const manifestPayload = {
    downloadedAt: new Date().toISOString(),
    fonts: FONT_MANIFEST,
    note:
      "Convert the TTX payloads with FontTools: `ttx -f -o mushaf-madinah.ttf QCF_P001.ttx` and then `ttx -f -o mushaf-madinah.woff2 -t woff2 mushaf-madinah.ttf`. Repeat for other pages as needed.",
  }

  await writeFile(manifestPath, JSON.stringify(manifestPayload, null, 2) + "\n", "utf8")

  console.log("Mushaf font sync complete:\n" + summary.join("\n"))
  console.log(`\nNext steps: run FontTools to convert TTX into browser-friendly formats (see ${manifestPath}).`)
}

void main()
