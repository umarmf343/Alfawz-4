export type TajweedCapabilityPriority = "critical" | "high" | "medium"

type ContentCapability = {
  id: string
  capability: string
  description: string
  workflowPhase: "ingest" | "review" | "feedback" | "governance"
  qulEquivalent: string
  priority: TajweedCapabilityPriority
  signals: string[]
}

export const tajweedContentCapabilities: ContentCapability[] = [
  {
    id: "capture",
    capability: "Live Recitation Capture",
    description:
      "Stream mic audio with tajweed tagging, enforce assignment metadata, and push frames to the correction queue without blocking the student.",
    workflowPhase: "ingest",
    qulEquivalent: "Streams > CaptureSession.create",
    priority: "critical",
    signals: ["student-id", "assignment-id", "tajweed-focus", "audio-chunk"],
  },
  {
    id: "triage",
    capability: "Automated Tajweed Triage",
    description:
      "Run frame-level heuristics and ML scoring to route mistakes to the right reviewer lane (peer, mentor, or lead sheikh).",
    workflowPhase: "review",
    qulEquivalent: "Pipelines > TriagePolicy",
    priority: "high",
    signals: ["tajweed-score", "confidence", "rule-violation", "queue-target"],
  },
  {
    id: "annotation",
    capability: "Structured Annotation Workbench",
    description:
      "Annotate tajweed violations alongside Mushaf-accurate verse previews, audio scrubbing, and inline commentary.",
    workflowPhase: "review",
    qulEquivalent: "Workspace > AnnotationCanvas",
    priority: "high",
    signals: ["ayah-anchor", "mushaf-position", "annotation", "severity"],
  },
  {
    id: "feedback",
    capability: "Personalized Feedback Composer",
    description:
      "Auto-suggest corrections mapped to learner goals and push actionable tasks back into the student's dashboard.",
    workflowPhase: "feedback",
    qulEquivalent: "Outbox > FeedbackTemplate",
    priority: "medium",
    signals: ["goal-alignment", "mistake-context", "recommended-practice"],
  },
  {
    id: "insights",
    capability: "Progress Intelligence",
    description:
      "Aggregate tajweed mistakes, completion rates, and reviewer latency so program leads can spot bottlenecks.",
    workflowPhase: "governance",
    qulEquivalent: "Dashboards > InsightDeck",
    priority: "medium",
    signals: ["error-density", "time-to-feedback", "rule-trends"],
  },
]

export const priorityStyles: Record<TajweedCapabilityPriority, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-amber-100 text-amber-700 border-amber-200",
  medium: "bg-slate-100 text-slate-700 border-slate-200",
}

