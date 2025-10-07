import { NextResponse } from "next/server"

import type { TarteelMlIntegrationPayload, TarteelMlRequirement, TarteelMlScriptStatus } from "@/lib/integrations/tarteel-ml"

const GITHUB_API_BASE = "https://api.github.com/repos/TarteelAI/tarteel-ml"
const RAW_BASE = "https://raw.githubusercontent.com/TarteelAI/tarteel-ml/master"
const TARGET_SCRIPTS: Array<{ name: string; path: string }> = [
  { name: "download.py", path: "download.py" },
  { name: "create_train_test_split.py", path: "create_train_test_split.py" },
  { name: "generate_csv_deepspeech.py", path: "generate_csv_deepspeech.py" },
  { name: "generate_alphabet.py", path: "generate_alphabet.py" },
  { name: "generate_vocabulary.py", path: "generate_vocabulary.py" },
]

const QUICKSTART = {
  prerequisites: [
    "Python 3.6 or later (Tarteel uses 3.7 for development)",
    "FFmpeg + FFprobe installed on the host machine",
    "Pip-installed dependencies from requirements.txt",
  ],
  setupCommands: [
    "pip3 install -r requirements.txt",
    "python download.py -h",
    "python create_train_test_split.py -h",
  ],
  usageNotes: [
    "All core scripts accept --help flags for argument discovery.",
    "Outputs include DeepSpeech-friendly CSV manifests and Quranic vocabularies.",
    "Refer to the GitHub wiki for full preprocessing and training walkthroughs.",
  ],
}

const githubHeaders = () => {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "alfawz-platform",
    "X-GitHub-Api-Version": "2022-11-28",
  }

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  return headers
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: githubHeaders(),
    next: { revalidate: 60 * 60 },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as T
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      ...githubHeaders(),
      Accept: "text/plain",
    },
    next: { revalidate: 60 * 60 },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

function parseRequirements(text: string): TarteelMlRequirement[] {
  return text
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => {
      const match = line.match(/^([A-Za-z0-9_.-]+)(.*)$/)
      const pkg = match?.[1] ?? line
      const specifier = match?.[2]?.trim() ?? null
      return {
        package: pkg,
        specifier: specifier && specifier.length > 0 ? specifier : null,
        raw: line,
      }
    })
}

export async function GET() {
  try {
    const [repo, contents, requirementsText, commits] = await Promise.all([
      fetchJson<{
        name: string
        description: string | null
        stargazers_count: number
        watchers_count: number
        forks_count: number
        open_issues_count: number
        default_branch: string
        html_url: string
        homepage: string | null
        pushed_at: string | null
        updated_at: string | null
        has_wiki: boolean
      }>(`${GITHUB_API_BASE}`),
      fetchJson<Array<{ name: string; path: string; download_url?: string | null; size?: number | null }>>(
        `${GITHUB_API_BASE}/contents`,
      ),
      fetchText(`${RAW_BASE}/requirements.txt`).catch(() => ""),
      fetchJson<Array<{ sha: string; html_url: string; commit: { message: string; author: { name?: string | null; date?: string | null } } }>>(
        `${GITHUB_API_BASE}/commits?per_page=1`,
      ).catch(() => []),
    ])

    const scripts: TarteelMlScriptStatus[] = TARGET_SCRIPTS.map((script) => {
      const entry = contents.find((item) => item.name === script.name)
      return {
        ...script,
        exists: Boolean(entry),
        size: entry?.size ?? null,
        downloadUrl: entry?.download_url ?? null,
      }
    })

    const requirements = requirementsText ? parseRequirements(requirementsText) : []

    const lastCommit = commits[0]
    const payload: TarteelMlIntegrationPayload = {
      repository: {
        name: repo.name,
        description: repo.description,
        stars: repo.stargazers_count,
        watchers: repo.watchers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        defaultBranch: repo.default_branch,
        htmlUrl: repo.html_url,
        homepage: repo.homepage,
        pushedAt: repo.pushed_at,
        updatedAt: repo.updated_at,
        wikiUrl: repo.has_wiki ? `${repo.html_url}/wiki` : null,
        lastCommit: lastCommit
          ? {
              sha: lastCommit.sha,
              url: lastCommit.html_url,
              message: lastCommit.commit.message,
              author: lastCommit.commit.author?.name ?? null,
              committedAt: lastCommit.commit.author?.date ?? null,
            }
          : undefined,
      },
      scripts,
      requirements,
      quickstart: QUICKSTART,
    }

    return NextResponse.json(payload, { headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=86400" } })
  } catch (error) {
    console.error("Failed to load tarteel-ml integration data", error)
    return NextResponse.json({ error: "Unable to load Tarteel ML metadata." }, { status: 500 })
  }
}
