export type TarteelMlScriptStatus = {
  name: string
  path: string
  exists: boolean
  size?: number | null
  downloadUrl?: string | null
}

export type TarteelMlRequirement = {
  package: string
  specifier: string | null
  raw: string
}

export type TarteelMlQuickstart = {
  prerequisites: string[]
  setupCommands: string[]
  usageNotes: string[]
}

export type TarteelMlIntegrationPayload = {
  repository: {
    name: string
    description: string | null
    stars: number
    watchers: number
    forks: number
    openIssues: number
    defaultBranch: string
    htmlUrl: string
    homepage: string | null
    pushedAt: string | null
    updatedAt: string | null
    wikiUrl?: string | null
    lastCommit?: {
      sha: string
      url: string
      message: string
      author?: string | null
      committedAt?: string | null
    }
  }
  scripts: TarteelMlScriptStatus[]
  requirements: TarteelMlRequirement[]
  quickstart: TarteelMlQuickstart
  inferenceProfile: {
    latencyMs: number
    description: string
    poweredBy: string
    stack: string[]
    telemetry: Array<{ label: string; value: string; description: string }>
  }
  mistakeDetection: {
    overview: string
    categories: Array<{
      id: string
      label: string
      description: string
      status: "production" | "beta"
      highlights: string[]
    }>
  }
}

export type TarteelMlIntegrationError = {
  error: string
}
