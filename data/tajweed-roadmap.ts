export type RoadmapMilestone = {
  id: string
  title: string
  focus: string
  target: string
  dependencies: string[]
  success: string
}

export const tajweedRoadmap: RoadmapMilestone[] = [
  {
    id: "mushaf-kit",
    title: "Mushaf typography kit",
    focus: "Build a reusable Mushaf rendering engine that keeps glyph positions stable across browsers.",
    target: "Design system sprint",
    dependencies: ["svg text shaping", "uthmani font licensing"],
    success: "Dynamic ayah overlays match Medina Mushaf pagination in QA scripts.",
  },
  {
    id: "review-permissions",
    title: "Reviewer permission flows",
    focus: "Gate annotation tools by isnad level so senior sheikhs approve escalations while mentors handle daily corrections.",
    target: "Platform sprint",
    dependencies: ["role-based access control", "queue assignment service"],
    success: "Audit log shows reviewer + verdict + tajweed score change for every session.",
  },
  {
    id: "beta-readiness",
    title: "Beta tester enablement",
    focus: "Ship self-serve onboarding with guided quests, telemetry dashboards, and privacy gating before the wider cohort joins.",
    target: "Adoption sprint",
    dependencies: ["recitation lab telemetry", "feedback composer"],
    success: "Invite-only beta sees >70% weekly active reciters with <24h feedback latency.",
  },
]

