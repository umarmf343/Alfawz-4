import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, "..")

const assets = [
  {
    url: "https://raw.githubusercontent.com/TarteelAI/quran-assets/main/metadata/surah-info.json",
    target: "data/quran-assets/surah-info.json",
    label: "surah metadata",
  },
  {
    url: "https://raw.githubusercontent.com/TarteelAI/quran-assets/main/translations/tanzil/en-sahih.json",
    target: "data/quran-assets/translation-en-sahih.json",
    label: "Saheeh International translation",
  },
]

async function downloadAsset({ url, target, label }) {
  const destination = resolve(projectRoot, target)
  const destinationDir = dirname(destination)

  await mkdir(destinationDir, { recursive: true })

  process.stdout.write(`Fetching ${label}... `)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  await writeFile(destination, buffer)
  process.stdout.write(`saved to ${target} (${buffer.length.toLocaleString()} bytes)\n`)
}

async function main() {
  for (const asset of assets) {
    try {
      await downloadAsset(asset)
    } catch (error) {
      console.error(`\n✖ Unable to sync ${asset.label}:`, error instanceof Error ? error.message : error)
      process.exitCode = 1
    }
  }

  if (process.exitCode && process.exitCode !== 0) {
    console.error("\nOne or more assets failed to download. See the logs above.")
  } else {
    console.log("\n✅ Quran assets synced successfully.")
  }
}

main().catch((error) => {
  console.error("Unexpected error while syncing Quran assets:", error)
  process.exit(1)
})
