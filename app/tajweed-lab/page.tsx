"use client"

import AppLayout from "@/components/app-layout"
import { RecitationLab } from "@/components/tajweed/recitation-lab"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { tajweedContentCapabilities, priorityStyles } from "@/data/qul-capabilities"
import { datasetCurationStages } from "@/data/tarteel-dataset-plan"
import { tajweedRoadmap } from "@/data/tajweed-roadmap"
import { cn } from "@/lib/utils"
import { BookOpen, ClipboardList, Compass, Database, ShieldCheck, Sparkles } from "lucide-react"

const workflowPhaseCopy: Record<(typeof tajweedContentCapabilities)[number]["workflowPhase"], string> = {
  ingest: "Capture",
  review: "Review",
  feedback: "Coach",
  governance: "Govern",
}

export default function TajweedLabPage() {
  return (
    <AppLayout>
      <div className="space-y-10 p-6 md:p-10">
        <header className="flex flex-col gap-4 rounded-3xl border border-maroon-100 bg-gradient-to-br from-white via-rose-50 to-maroon-50 p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-maroon-100 text-maroon-800 border-maroon-200">Tajweed Ops</Badge>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" /> Integrated with QUL
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold text-maroon-950 md:text-4xl">Correction Control Center</h1>
          <p className="max-w-3xl text-base text-maroon-700 md:text-lg">
            Manage live recitation capture, reviewer workflows, and Mushaf-aligned insights in a single screen. Everything below
            maps directly to QUL services so the platform can scale from a pilot cohort to institute-wide adoption.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="border-maroon-100 bg-white/95">
            <CardHeader>
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-maroon-600" />
                <div>
                  <CardTitle className="text-2xl text-maroon-900">Content Ops Priorities</CardTitle>
                  <CardDescription>
                    Highest leverage capabilities for tajweed correction and their equivalents inside the QUL stack.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {tajweedContentCapabilities.map((capability) => (
                <div
                  key={capability.id}
                  className="rounded-2xl border border-maroon-100 bg-gradient-to-br from-white to-rose-50 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-maroon-600">
                        {workflowPhaseCopy[capability.workflowPhase]}
                      </p>
                      <h3 className="text-lg font-semibold text-maroon-900">{capability.capability}</h3>
                    </div>
                    <Badge className={cn("border text-xs uppercase", priorityStyles[capability.priority])}>
                      {capability.priority}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-maroon-700">{capability.description}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-maroon-600">
                    <Badge variant="outline" className="border-dashed border-maroon-200 text-maroon-700">
                      QUL · {capability.qulEquivalent}
                    </Badge>
                    {capability.signals.map((signal) => (
                      <Badge key={signal} variant="secondary" className="bg-maroon-100 text-maroon-700">
                        {signal}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-maroon-100 bg-white/95">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-maroon-600" />
                <div>
                  <CardTitle className="text-xl text-maroon-900">Workflow guardrails</CardTitle>
                  <CardDescription>Governance checks to keep reviews fast, fair, and auditable.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-maroon-700">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <p className="font-semibold text-emerald-900">Real-time queue health</p>
                <p className="mt-1 text-emerald-800">
                  Autobalance correction load when a reviewer is at capacity using QUL&apos;s `TriagePolicy` hooks.
                </p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                <p className="font-semibold text-amber-900">Audit-ready footprints</p>
                <p className="mt-1 text-amber-800">
                  Every annotation is stamped with isnad level, tajweed rule code, and audio offset for compliance snapshots.
                </p>
              </div>
              <div className="rounded-xl border border-maroon-200 bg-maroon-50/70 p-4">
                <p className="font-semibold text-maroon-900">Feedback SLAs</p>
                <p className="mt-1 text-maroon-800">
                  Dashboards alert mentors when correction latency exceeds 24 hours so learners stay motivated.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <RecitationLab />

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-maroon-100 bg-white/95">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-maroon-600" />
                <div>
                  <CardTitle className="text-2xl text-maroon-900">Dataset curation sprint</CardTitle>
                  <CardDescription>Operational checklist for the next wave of tajweed training data.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {datasetCurationStages.map((stage, index) => (
                <div key={stage.id} className="rounded-2xl border border-maroon-100 bg-maroon-50/60 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-maroon-600">Stage {index + 1}</p>
                      <h3 className="text-lg font-semibold text-maroon-900">{stage.title}</h3>
                    </div>
                    <Badge variant="secondary" className="bg-maroon-100 text-maroon-700">
                      {stage.tooling.length} tools
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-maroon-700">{stage.objective}</p>
                  <Separator className="my-4" />
                  <div className="grid gap-2 text-sm text-maroon-700">
                    <p className="font-semibold text-maroon-800">Tooling</p>
                    <div className="flex flex-wrap gap-2">
                      {stage.tooling.map((tool) => (
                        <Badge key={tool} variant="outline" className="border-dashed border-maroon-200 text-maroon-700">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-3 font-semibold text-maroon-800">Outputs</p>
                    <ul className="list-inside list-disc space-y-1">
                      {stage.outputs.map((output) => (
                        <li key={output}>{output}</li>
                      ))}
                    </ul>
                    <p className="mt-3 text-sm font-medium text-maroon-800">QA gate</p>
                    <p className="text-sm text-maroon-700">{stage.qa}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-maroon-100 bg-white/95">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Compass className="h-5 w-5 text-maroon-600" />
                <div>
                  <CardTitle className="text-2xl text-maroon-900">Typography & review roadmap</CardTitle>
                  <CardDescription>Sequence to unlock Mushaf-perfect rendering with permissioned QA.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {tajweedRoadmap.map((milestone, index) => (
                <div key={milestone.id} className="rounded-2xl border border-maroon-100 bg-rose-50/60 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-maroon-600">
                        Milestone {index + 1}
                      </p>
                      <h3 className="text-lg font-semibold text-maroon-900">{milestone.title}</h3>
                    </div>
                    <Badge variant="secondary" className="bg-maroon-100 text-maroon-700">
                      {milestone.target}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-maroon-700">{milestone.focus}</p>
                  <div className="mt-4 space-y-2 text-sm text-maroon-700">
                    <div>
                      <p className="font-semibold text-maroon-800">Dependencies</p>
                      <ul className="list-inside list-disc space-y-1">
                        {milestone.dependencies.map((dependency) => (
                          <li key={dependency}>{dependency}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-maroon-800">Definition of success</p>
                      <p>{milestone.success}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <footer className="rounded-3xl border border-maroon-100 bg-maroon-900 p-8 text-maroon-100">
          <div className="flex flex-wrap items-center gap-4">
            <ClipboardList className="h-6 w-6" />
            <div>
              <h2 className="text-lg font-semibold">Next action</h2>
              <p className="text-sm text-maroon-100/90">
                Ship the recitation lab to a pilot classroom, capture transcripts for 10 sessions, and dry-run the review queue
                with mentors before inviting beta testers.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </AppLayout>
  )
}

