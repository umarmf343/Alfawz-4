"use client"

export type HasanatTokenMode = "float" | "drift" | "reduced"

export type TokenRect = Pick<DOMRectReadOnly, "x" | "y" | "width" | "height" | "top" | "right" | "bottom" | "left">

export interface HasanatTokenModel {
  id: string
  amount: number
  originRect: TokenRect
  targetRect?: TokenRect
  createdAt: number
  mode: HasanatTokenMode
}

type TokenListener = (tokens: HasanatTokenModel[]) => void

const AGGREGATION_WINDOW_MS = 320
const MAX_TOKENS = 5
const DRIFT_DURATION_MS = 820
const FLOAT_GUARD_MS = 1500

const isServer = () => typeof window === "undefined"

function createRect(rect: DOMRectReadOnly): TokenRect {
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
  }
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `token_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function isRectVisible(rect: TokenRect) {
  if (isServer()) {
    return false
  }
  const viewportHeight = window.innerHeight || 0
  const viewportWidth = window.innerWidth || 0
  return rect.bottom >= 0 && rect.top <= viewportHeight && rect.right >= 0 && rect.left <= viewportWidth
}

function isRectOnScreen(rect: TokenRect) {
  return rect.width > 0 && rect.height > 0 && isRectVisible(rect)
}

class TokenSpawner {
  private tokens: HasanatTokenModel[] = []
  private listeners = new Set<TokenListener>()
  private cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private aggregateTokenId: string | null = null
  private aggregateTimer: ReturnType<typeof setTimeout> | null = null
  private prefersReducedMotion = false
  private reducedMotionOverride: boolean | null = null
  private motionMedia?: MediaQueryList
  private motionListener?: (event: MediaQueryListEvent) => void
  private lastOriginRect?: TokenRect

  constructor() {
    if (isServer()) {
      return
    }

    if (typeof window.matchMedia === "function") {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)")
      this.prefersReducedMotion = media.matches
      const handle = (event: MediaQueryListEvent) => {
        this.setReducedMotionPreference(event.matches)
      }

      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", handle)
      } else if (typeof media.addListener === "function") {
        media.addListener(handle)
      }

      this.motionMedia = media
      this.motionListener = handle
    }
  }

  subscribe(listener: TokenListener) {
    this.listeners.add(listener)
    listener(this.tokens)
    return () => {
      this.listeners.delete(listener)
    }
  }

  spawn(amount = 1) {
    if (isServer() || amount <= 0) {
      return
    }

    const origin = this.measureOriginRect()
    if (!origin) {
      return
    }

    this.lastOriginRect = origin

    const { mode, targetRect } = this.resolveMode(origin)

    const now = performance.now()

    if (this.aggregateTokenId) {
      const aggregateToken = this.tokens.find((token) => token.id === this.aggregateTokenId)
      if (aggregateToken && now - aggregateToken.createdAt <= AGGREGATION_WINDOW_MS) {
        const updated: HasanatTokenModel = {
          ...aggregateToken,
          amount: aggregateToken.amount + amount,
          createdAt: now,
          mode,
          originRect: origin,
          targetRect: mode === "drift" ? targetRect : undefined,
        }
        this.tokens = this.tokens.map((token) => (token.id === updated.id ? updated : token))
        this.scheduleAggregateReset()
        this.scheduleCleanup(updated.id)
        this.notify()
        return
      }
    }

    const token: HasanatTokenModel = {
      id: createId(),
      amount,
      originRect: origin,
      targetRect: mode === "drift" ? targetRect : undefined,
      createdAt: now,
      mode,
    }

    this.tokens = [...this.tokens.slice(-MAX_TOKENS + 1), token]
    this.aggregateTokenId = token.id
    this.scheduleAggregateReset()
    this.scheduleCleanup(token.id)
    this.notify()
  }

  complete(tokenId: string) {
    if (!tokenId) {
      return
    }

    this.tokens = this.tokens.filter((token) => token.id !== tokenId)
    this.clearCleanup(tokenId)
    if (this.aggregateTokenId === tokenId) {
      this.aggregateTokenId = null
      this.clearAggregateTimer()
    }
    this.notify()
  }

  triggerCounterPulse(reduced = false) {
    if (isServer()) {
      return
    }

    const target = this.findCounterElement()
    if (!target) {
      return
    }

    const pulseClass = reduced ? "animate-hasanat-counter-reduced" : "animate-hasanat-counter"
    target.classList.remove(pulseClass)
    // Force reflow to restart animation
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    target.clientHeight
    target.classList.add(pulseClass)

    window.setTimeout(() => {
      target.classList.remove(pulseClass)
    }, reduced ? 220 : 260)
  }

  reset() {
    this.tokens = []
    this.notify()
    this.cleanupTimers.forEach((timer) => window.clearTimeout(timer))
    this.cleanupTimers.clear()
    this.aggregateTokenId = null
    this.clearAggregateTimer()
  }

  setReducedMotionPreference(value: boolean) {
    this.prefersReducedMotion = value
  }

  setReducedMotionOverride(value: boolean | null) {
    this.reducedMotionOverride = value
  }

  private get isReducedMotion() {
    return this.reducedMotionOverride ?? this.prefersReducedMotion
  }

  private measureOriginRect(): TokenRect | undefined {
    if (isServer()) {
      return undefined
    }

    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>("[data-hasanat-source=\"next-button\"]"),
    )

    for (const element of candidates) {
      if (element instanceof HTMLButtonElement && element.disabled) {
        continue
      }
      const rect = createRect(element.getBoundingClientRect())
      if (isRectOnScreen(rect)) {
        return rect
      }
    }

    return this.lastOriginRect
  }

  private resolveMode(originRect: TokenRect) {
    if (this.isReducedMotion) {
      return { mode: "reduced" as const }
    }

    const target = this.measureCounterRect()
    if (target) {
      return { mode: "drift" as const, targetRect: target }
    }

    return { mode: "float" as const }
  }

  private measureCounterRect(): TokenRect | undefined {
    if (isServer()) {
      return undefined
    }

    const element = this.findCounterElement()
    if (!element) {
      return undefined
    }

    const rect = createRect(element.getBoundingClientRect())
    if (!isRectOnScreen(rect)) {
      return undefined
    }
    return rect
  }

  private findCounterElement() {
    if (isServer()) {
      return null
    }
    return document.querySelector<HTMLElement>("[data-hasanat-target=\"hasanat-counter\"]")
  }

  private scheduleCleanup(tokenId: string) {
    this.clearCleanup(tokenId)
    const timer = window.setTimeout(() => {
      this.complete(tokenId)
    }, Math.max(FLOAT_GUARD_MS, DRIFT_DURATION_MS + 200))
    this.cleanupTimers.set(tokenId, timer)
  }

  private clearCleanup(tokenId: string) {
    const timer = this.cleanupTimers.get(tokenId)
    if (timer) {
      window.clearTimeout(timer)
      this.cleanupTimers.delete(tokenId)
    }
  }

  private scheduleAggregateReset() {
    this.clearAggregateTimer()
    this.aggregateTimer = window.setTimeout(() => {
      this.aggregateTokenId = null
    }, AGGREGATION_WINDOW_MS + 40)
  }

  private clearAggregateTimer() {
    if (this.aggregateTimer) {
      window.clearTimeout(this.aggregateTimer)
      this.aggregateTimer = null
    }
  }

  private notify() {
    const snapshot = this.tokens.map((token) => ({ ...token }))
    this.listeners.forEach((listener) => listener(snapshot))
  }
}

export const tokenSpawner = new TokenSpawner()
