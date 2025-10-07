"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type {
  TarteelMlIntegrationError,
  TarteelMlIntegrationPayload,
  TarteelMlRequirement,
  TarteelMlScriptStatus,
} from "@/lib/integrations/tarteel-ml"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Box,
  CheckCircle2,
  Cpu,
  Gauge,
  GitCommit,
  Link2,
  Package,
  RefreshCw,
  Rocket,
  Star,
  Timer,
} from "lucide-react"

const statusStyles: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  missing: "bg-red-50 text-red-700 border border-red-200",
}

const detectionStatusStyles: Record<"production" | "beta", string> = {
  production: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  beta: "bg-amber-100 text-amber-800 border border-amber-200",
}

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: TarteelMlIntegrationPayload }

const formatDate = (value: string | null | undefined) => {
  if (!value) return "Unknown"
  try {
    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))
  } catch (error) {
    console.warn("Failed to format date", value, error)
    return value
  }
}

const chunkRequirements = (requirements: TarteelMlRequirement[], chunkSize = 6) => {
  if (requirements.length <= chunkSize) {
    return [requirements]
  }

  const chunks: TarteelMlRequirement[][] = []
  for (let index = 0; index < requirements.length; index += chunkSize) {
    chunks.push(requirements.slice(index, index + chunkSize))
  }
  return chunks
}

const buildScriptStatus = (script: TarteelMlScriptStatus) => {
  const status = script.exists ? "available" : "missing"
  const tone = script.exists ? "text-emerald-700" : "text-red-600"
  const Icon = script.exists ? CheckCircle2 : AlertTriangle

  return (
    <div key={script.name} className="flex flex-col gap-2 rounded-lg border border-muted bg-muted/30 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-maroon-900">{script.name}</p>
          <p className="text-xs text-muted-foreground">{script.path}</p>
        </div>
        <Badge className={cn("text-xs capitalize", statusStyles[status])}>{status}</Badge>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <Icon className={cn("h-4 w-4", tone)} />
        <span className="text-muted-foreground">
          {script.exists
            ? script.size
              ? `${(script.size / 1024).toFixed(1)} KB ready`
              : "Ready"
            : "Missing from repo"}
        </span>
      </div>
      {script.downloadUrl && (
        <Button asChild variant="ghost" size="sm" className="justify-start px-0 text-xs text-maroon-700">
          <Link href={script.downloadUrl} target="_blank" rel="noopener noreferrer">
            <Link2 className="mr-1 h-3.5 w-3.5" /> Download
          </Link>
        </Button>
      )}
    </div>
  )
}

const RequirementTable = ({ requirements }: { requirements: TarteelMlRequirement[] }) => {
  const [activeChunk, setActiveChunk] = useState(0)
  const chunks = useMemo(() => chunkRequirements(requirements), [requirements])

  if (requirements.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-muted p-6 text-center text-sm text-muted-foreground">
        requirements.txt was not found. Check repository permissions or rename location.
      </div>
    )
  }

  const current = chunks[activeChunk] ?? []

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-maroon-900">Python dependencies</p>
          <p className="text-xs text-muted-foreground">Pulled directly from requirements.txt</p>
        </div>
        {chunks.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={activeChunk === 0}
              onClick={() => setActiveChunk((index) => Math.max(0, index - 1))}
            >
              Previous
            </Button>
            <Badge variant="secondary" className="text-xs">
              {activeChunk + 1} / {chunks.length}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={activeChunk >= chunks.length - 1}
              onClick={() => setActiveChunk((index) => Math.min(chunks.length - 1, index + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border border-muted">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-1/3">Package</TableHead>
              <TableHead>Specifier</TableHead>
              <TableHead className="hidden sm:table-cell">Raw</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {current.map((requirement) => (
              <TableRow key={`${requirement.package}-${requirement.raw}`}>
                <TableCell className="font-medium text-maroon-900">{requirement.package}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {requirement.specifier ? requirement.specifier : "Latest"}
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">{requirement.raw}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function TarteelMlIntegrationPanel() {
  const [state, setState] = useState<FetchState>({ status: "loading" })

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const response = await fetch("/api/integrations/tarteel-ml")
        const payload = (await response.json()) as TarteelMlIntegrationPayload | TarteelMlIntegrationError

        if (!response.ok) {
          const message = "error" in payload ? payload.error : "Failed to load integration data"
          throw new Error(message)
        }

        if (isMounted) {
          setState({ status: "success", data: payload as TarteelMlIntegrationPayload })
        }
      } catch (error) {
        console.error("Failed to fetch tarteel-ml integration", error)
        if (isMounted) {
          setState({ status: "error", message: error instanceof Error ? error.message : "Unknown error" })
        }
      }
    }

    load()

    const interval = window.setInterval(load, 5 * 60 * 1000)
    return () => {
      isMounted = false
      window.clearInterval(interval)
    }
  }, [])

  if (state.status === "loading") {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-maroon-900">
            <RefreshCw className="h-4 w-4 animate-spin" /> Syncing Tarteel ML repo…
          </CardTitle>
          <CardDescription>Pulling repository metadata, scripts, and environment requirements.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 animate-pulse rounded-lg bg-muted/60" />
        </CardContent>
      </Card>
    )
  }

  if (state.status === "error") {
    return (
      <Card className="border-red-200 bg-red-50/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" /> Unable to reach Tarteel ML metadata
          </CardTitle>
          <CardDescription>{state.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setState({ status: "loading" })}
            className="text-red-700"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { repository, scripts, requirements, quickstart, inferenceProfile, mistakeDetection } = state.data
  const scriptGrid = scripts.map((script) => buildScriptStatus(script))

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-maroon-900">
              <BookOpen className="h-5 w-5" /> Tarteel ML integration snapshot
            </CardTitle>
            <CardDescription>
              Live repository status, core preprocessing scripts, and environment readiness for tajwīd modelling.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              <Star className="h-3.5 w-3.5" /> {repository.stars} stars
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              <Rocket className="h-3.5 w-3.5" /> {repository.forks} forks
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              <Timer className="h-3.5 w-3.5" /> Updated {formatDate(repository.updatedAt)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-muted bg-muted/40 p-4">
            <p className="text-xs font-semibold text-muted-foreground">Watchers</p>
            <p className="mt-1 text-2xl font-semibold text-maroon-900">{repository.watchers}</p>
            <p className="text-xs text-muted-foreground">Keeping tabs on tajwīd ML updates.</p>
          </div>
          <div className="rounded-lg border border-muted bg-muted/40 p-4">
            <p className="text-xs font-semibold text-muted-foreground">Open issues</p>
            <p className="mt-1 text-2xl font-semibold text-maroon-900">{repository.openIssues}</p>
            <p className="text-xs text-muted-foreground">Track backlog before promoting experiments.</p>
          </div>
          <div className="rounded-lg border border-muted bg-muted/40 p-4">
            <p className="text-xs font-semibold text-muted-foreground">Default branch</p>
            <p className="mt-1 text-2xl font-semibold text-maroon-900">{repository.defaultBranch}</p>
            <p className="text-xs text-muted-foreground">Sync inference jobs to this branch.</p>
          </div>
          <div className="rounded-lg border border-muted bg-muted/40 p-4">
            <p className="text-xs font-semibold text-muted-foreground">Last push</p>
            <p className="mt-1 text-2xl font-semibold text-maroon-900">{formatDate(repository.pushedAt)}</p>
            <p className="text-xs text-muted-foreground">Confirm workers are using latest commit.</p>
          </div>
        </div>

        {repository.lastCommit && (
          <div className="rounded-lg border border-maroon-100 bg-maroon-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-maroon-900">
                <GitCommit className="h-4 w-4" />
                <span className="text-sm font-semibold">Latest commit</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {repository.lastCommit.author ? `by ${repository.lastCommit.author}` : "Author unknown"}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-maroon-900">{repository.lastCommit.message}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>SHA {repository.lastCommit.sha.slice(0, 7)}</span>
              <span>Committed {formatDate(repository.lastCommit.committedAt)}</span>
              <Button asChild variant="ghost" size="sm" className="px-0 text-xs text-maroon-700">
                <Link href={repository.lastCommit.url} target="_blank" rel="noopener noreferrer">
                  View on GitHub <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-maroon-900">Critical preprocessing scripts</h3>
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Box className="h-3.5 w-3.5" /> {scripts.filter((script) => script.exists).length}/{scripts.length} ready
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{scriptGrid}</div>
        </div>

        <RequirementTable requirements={requirements} />

        <Card className="border border-muted bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-maroon-900">
              <Package className="h-4 w-4" /> Quickstart playbook
            </CardTitle>
            <CardDescription>Ensure ops teams can bootstrap experiments without scanning README manually.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Prerequisites</p>
              <ul className="space-y-1 text-sm text-maroon-900">
                {quickstart.prerequisites.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Setup commands</p>
              <ScrollArea className="max-h-40 rounded-md border border-muted bg-background p-3 text-xs">
                <ul className="space-y-2">
                  {quickstart.setupCommands.map((command) => (
                    <li key={command} className="font-mono text-maroon-900">
                      {command}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Usage notes</p>
              <ul className="space-y-1 text-sm text-maroon-900">
                {quickstart.usageNotes.map((note) => (
                  <li key={note} className="flex items-start gap-2">
                    <Box className="mt-0.5 h-3.5 w-3.5 text-primary" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border border-emerald-200 bg-emerald-50/70">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-emerald-900">
                <Cpu className="h-4 w-4" /> Real-time inference profile
              </CardTitle>
              <CardDescription>{inferenceProfile.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="flex items-center gap-1 bg-white text-emerald-700 shadow-sm">
                  <Gauge className="h-3.5 w-3.5" /> {inferenceProfile.latencyMs} ms p95
                </Badge>
                <Badge variant="outline" className="border-emerald-300 text-xs text-emerald-800">
                  Powered by {inferenceProfile.poweredBy}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Stack</p>
                <div className="flex flex-wrap gap-2">
                  {inferenceProfile.stack.map((layer) => (
                    <Badge key={layer} variant="secondary" className="bg-white/80 text-emerald-800">
                      {layer}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Telemetry</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {inferenceProfile.telemetry.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-lg border border-emerald-200 bg-white/80 p-3 text-center shadow-sm"
                    >
                      <p className="text-xs font-semibold uppercase text-emerald-800">{metric.label}</p>
                      <p className="mt-1 text-lg font-bold text-emerald-700">{metric.value}</p>
                      <p className="text-[11px] text-emerald-800/80">{metric.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-primary">
                <Box className="h-4 w-4" /> Mistake detection coverage
              </CardTitle>
              <CardDescription>{mistakeDetection.overview}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mistakeDetection.categories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-lg border border-primary/20 bg-background/80 p-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-maroon-900">{category.label}</p>
                    <Badge className={cn("text-xs", detectionStatusStyles[category.status])}>
                      {category.status === "production" ? "Production" : "Beta"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{category.description}</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
                    {category.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="secondary" size="sm">
            <Link href={repository.htmlUrl} target="_blank" rel="noopener noreferrer">
              View repository <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
          {repository.wikiUrl && (
            <Button asChild variant="ghost" size="sm" className="text-maroon-700">
              <Link href={repository.wikiUrl} target="_blank" rel="noopener noreferrer">
                Open wiki <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          )}
          {repository.homepage && (
            <Button asChild variant="ghost" size="sm" className="text-maroon-700">
              <Link href={repository.homepage} target="_blank" rel="noopener noreferrer">
                Live experience <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default TarteelMlIntegrationPanel
