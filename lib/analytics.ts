export type AnalyticsLevel = "info" | "warning" | "error"

export type AnalyticsPayload = Record<string, unknown>

export interface AnalyticsEventRecord extends AnalyticsPayload {
  event: string
  timestamp: string
  level: AnalyticsLevel
}

declare global {
  interface Window {
    dataLayer?: AnalyticsEventRecord[]
  }
}

const pendingEvents: AnalyticsEventRecord[] = []

function pushEvent(event: AnalyticsEventRecord) {
  if (typeof window === "undefined") {
    pendingEvents.push(event)
    return
  }

  window.dataLayer = window.dataLayer ?? []
  if (pendingEvents.length > 0) {
    window.dataLayer.push(...pendingEvents.splice(0, pendingEvents.length))
  }
  window.dataLayer.push(event)

  if (typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new CustomEvent("alfawz-analytics", { detail: event }))
  }

  if (process.env.NODE_ENV !== "production") {
    console.debug(`[analytics] ${event.event}`, event)
  }
}

export function trackEvent(
  event: string,
  payload: AnalyticsPayload = {},
  level: AnalyticsLevel = "info",
): void {
  const record: AnalyticsEventRecord = {
    event,
    level,
    timestamp: new Date().toISOString(),
    ...payload,
  }
  pushEvent(record)
}

export function trackStateChange(
  scope: string,
  change: AnalyticsPayload,
  context: AnalyticsPayload = {},
): void {
  trackEvent("dashboard_state_change", {
    scope,
    change,
    ...context,
  })
}

export function trackError(
  event: string,
  error: unknown,
  payload: AnalyticsPayload = {},
): void {
  const errorPayload: AnalyticsPayload = {
    message: error instanceof Error ? error.message : String(error ?? "Unknown error"),
  }
  if (error instanceof Error && error.stack) {
    errorPayload.stack = error.stack
  }
  trackEvent(event, { ...payload, ...errorPayload }, "error")
}

export {}
