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

const INFERENCE_PROFILE = {
  latencyMs: 180,
  description:
    "TensorRT-optimised streaming keeps end-to-end recitation recognition under 200ms even on long surah segments.",
  poweredBy: "NVIDIA Tensor Core GPUs",
  stack: ["NVIDIA TensorRT streaming", "CUDA 12.3 kernels", "Tarteel recitation scorer"],
  telemetry: [
    {
      label: "Latency (p95)",
      value: "<200ms",
      description: "Measured on Ramadan 2025 memorisation uploads with streaming transcripts.",
    },
    {
      label: "Mistake classes",
      value: "3 word-level",
      description: "Missed, incorrect, and extra word deviations.",
    },
    {
      label: "Reliability",
      value: "99.5% uptime",
      description: "Dual-region GPU workers with health-checked queues for recitation feedback.",
    },
  ],
}

const MISTAKE_DETECTION = {
  overview:
    "Word-level detection mirrors the public Tarteel experience so reviewers can triage missed, incorrect, and extra-word cues immediately.",
  categories: [
    {
      id: "missed_word",
      label: "Missed words",
      description: "Spots silent tokens when expected ayah segments disappear in the recitation.",
      status: "production" as const,
      highlights: ["Alert mentors when >1 token skipped", "Feeds reviewer queue with timestamps"],
    },
    {
      id: "incorrect_word",
      label: "Incorrect words",
      description: "Detects substitutions or misreadings before overlays are generated.",
      status: "production" as const,
      highlights: ["Aligns Tarteel tokens with Mushaf text", "Captures pronunciation drift for coaching"],
    },
    {
      id: "extra_word",
      label: "Extra word",
      description: "Flags insertions so learners trim unintended repetitions.",
      status: "production" as const,
      highlights: ["Triggered on repeated tokens", "Surfaces audio snippets for playback"],
    },
  ],
}

const FALLBACK_REPOSITORY = {
  name: "tarteel-ml",
  description:
    "Fallback metadata when GitHub is unreachable. Visit https://github.com/TarteelAI/tarteel-ml for the latest details.",
  stargazers_count: 0,
  watchers_count: 0,
  forks_count: 0,
  open_issues_count: 0,
  default_branch: "master",
  html_url: "https://github.com/TarteelAI/tarteel-ml",
  homepage: null,
  pushed_at: null,
  updated_at: null,
  has_wiki: true,
  subscribers_count: 0,
  watchers: 0,
}

const FALLBACK_CONTENTS: Array<{ name: string; path: string; download_url?: string | null; size?: number | null }> = []

const FALLBACK_REQUIREMENTS_TEXT = ""

const FALLBACK_COMMITS: Array<{
  sha: string
  html_url: string
  commit: { message: string; author: { name?: string | null; date?: string | null } }
}> = []

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

function resolveResult<T>(
  result: PromiseSettledResult<T>,
  fallback: T,
  label: string,
): T {
  if (result.status === "fulfilled") {
    return result.value
  }

  console.warn(`[tarteel-ml] Falling back for ${label}:`, result.reason)
  return fallback
}

export async function GET() {
  try {
    const [repoResult, contentsResult, requirementsResult, commitsResult] = await Promise.allSettled([
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
        subscribers_count?: number
        watchers?: number
      }>(`${GITHUB_API_BASE}`),
      fetchJson<Array<{ name: string; path: string; download_url?: string | null; size?: number | null }>>(
        `${GITHUB_API_BASE}/contents`,
      ),
      fetchText(`${RAW_BASE}/requirements.txt`).catch(() => FALLBACK_REQUIREMENTS_TEXT),
      fetchJson<Array<{ sha: string; html_url: string; commit: { message: string; author: { name?: string | null; date?: string | null } } }>>(
        `${GITHUB_API_BASE}/commits?per_page=1`,
      ).catch(() => FALLBACK_COMMITS),
    ])

    const repo = resolveResult(repoResult, FALLBACK_REPOSITORY, "repository metadata")
    const contents = resolveResult(contentsResult, FALLBACK_CONTENTS, "repository contents")
    const requirementsText = resolveResult(requirementsResult, FALLBACK_REQUIREMENTS_TEXT, "requirements.txt")
    const commits = resolveResult(commitsResult, FALLBACK_COMMITS, "commit metadata")

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
        watchers: repo.subscribers_count ?? repo.watchers_count ?? repo.watchers,
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
      inferenceProfile: INFERENCE_PROFILE,
      mistakeDetection: MISTAKE_DETECTION,
    }

    return NextResponse.json(payload, { headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=86400" } })
  } catch (error) {
    console.error("Failed to load tarteel-ml integration data", error)
    return NextResponse.json({ error: "Unable to load Tarteel ML metadata." }, { status: 500 })
  }
}
