"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { useUser } from "@/hooks/use-user"
import type { HasanatTokenModel, TokenRect } from "@/lib/hasanat/token-spawner"
import { tokenSpawner } from "@/lib/hasanat/token-spawner"

const DRIFT_DURATION = 820
const FLOAT_DURATION = 900
const REDUCED_DURATION = 260

function getCenter(rect: TokenRect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function getQuadraticPoint(start: { x: number; y: number }, control: { x: number; y: number }, end: {
  x: number
  y: number
}, t: number) {
  const oneMinusT = 1 - t
  const x = oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * control.x + t * t * end.x
  const y = oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * control.y + t * t * end.y
  return { x, y }
}

function getControlPoint(start: { x: number; y: number }, end: { x: number; y: number }) {
  const midX = (start.x + end.x) / 2
  const horizontalShift = (end.x - start.x) * 0.18
  const verticalLift = Math.max(64, Math.abs(start.y - end.y) * 0.35)
  const controlY = Math.min(start.y, end.y) - verticalLift
  return {
    x: midX - horizontalShift,
    y: controlY,
  }
}

function FloatingToken({ token, prefersArabic }: { token: HasanatTokenModel; prefersArabic: boolean }) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) {
      return
    }

    const startPoint = getCenter(token.originRect)
    container.style.transform = `translate3d(${startPoint.x}px, ${startPoint.y}px, 0)`
    content.style.opacity = "0"
    content.style.transform = "translate(-50%, -50%) scale(0.85)"
    content.style.contain = "paint"

    if (token.mode === "float") {
      const lift = Math.min(96, Math.max(56, token.originRect.height * 1.45))
      content.style.setProperty("--hasanat-float-distance", `${lift}px`)
      content.style.setProperty("--hasanat-float-duration", `${FLOAT_DURATION}ms`)
      content.classList.remove("animate-hasanat-token-float")
      void content.offsetWidth
      content.classList.add("animate-hasanat-token-float")
      const timeoutId = window.setTimeout(() => {
        tokenSpawner.complete(token.id)
      }, FLOAT_DURATION + 160)
      return () => {
        window.clearTimeout(timeoutId)
        content.classList.remove("animate-hasanat-token-float")
      }
    }

    if (token.mode === "reduced") {
      const duration = REDUCED_DURATION
      content.style.transition = `opacity ${duration}ms ease-out`
      requestAnimationFrame(() => {
        content.style.opacity = "1"
        window.setTimeout(() => {
          content.style.opacity = "0"
        }, duration - 90)
      })
      const timeoutId = window.setTimeout(() => {
        tokenSpawner.triggerCounterPulse(true)
        tokenSpawner.complete(token.id)
      }, duration + 120)
      return () => {
        window.clearTimeout(timeoutId)
        content.style.transition = ""
      }
    }

    if (!token.targetRect) {
      const timeoutId = window.setTimeout(() => tokenSpawner.complete(token.id), FLOAT_DURATION + 180)
      return () => {
        window.clearTimeout(timeoutId)
      }
    }

    const endPoint = getCenter(token.targetRect)
    const controlPoint = getControlPoint(startPoint, endPoint)
    let frame = 0
    let startTime: number | null = null

    const step = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp
      }
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / DRIFT_DURATION, 1)
      const eased = easeOutCubic(progress)
      const position = getQuadraticPoint(startPoint, controlPoint, endPoint, eased)
      const scale = progress < 0.2 ? 0.85 + (progress / 0.2) * 0.15 : 1
      const opacity =
        progress < 0.15 ? progress / 0.15 : progress > 0.8 ? 1 - (progress - 0.8) / 0.2 : 1

      container.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`
      content.style.transform = `translate(-50%, -50%) scale(${scale})`
      content.style.opacity = `${opacity}`

      if (progress < 1) {
        frame = requestAnimationFrame(step)
      } else {
        tokenSpawner.triggerCounterPulse(false)
        tokenSpawner.complete(token.id)
      }
    }

    frame = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [token])

  return (
    <div ref={containerRef} className="pointer-events-none absolute left-0 top-0 will-change-transform">
      <div
        ref={contentRef}
        className="pointer-events-none select-none rounded-full bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_16px_40px_rgba(16,185,129,0.35)] ring-1 ring-emerald-300/35 backdrop-blur-sm dark:bg-emerald-400/90 dark:text-emerald-950"
        aria-hidden="true"
      >
        <div className="flex flex-col items-center gap-0.5 leading-none">
          <span className="text-base font-semibold tracking-tight">
            +{token.amount.toLocaleString()}
          </span>
          <span className="text-[0.6rem] font-medium uppercase tracking-[0.35em] text-emerald-50/80 dark:text-emerald-900/70">
            Hasanāt
          </span>
          {prefersArabic ? (
            <span className="text-[0.65rem] font-medium text-emerald-100/80 dark:text-emerald-900/70">
              حسنات
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function FloatingTokensLayer() {
  const { stats, profile } = useUser()
  const [tokens, setTokens] = React.useState<HasanatTokenModel[]>([])
  const [mounted, setMounted] = React.useState(false)
  const [announcement, setAnnouncement] = React.useState("")

  const prefersArabic = React.useMemo(() => {
    const locale = profile?.locale ?? ""
    return locale.toLowerCase().startsWith("ar")
  }, [profile?.locale])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const unsubscribe = tokenSpawner.subscribe(setTokens)
    return () => {
      unsubscribe()
    }
  }, [])

  React.useEffect(() => {
    if (tokens.length === 0) {
      return
    }
    const latest = tokens[tokens.length - 1]
    setAnnouncement(`Hasanāt +${latest.amount.toLocaleString()}. Total: ${stats.hasanat.toLocaleString()}.`)
  }, [stats.hasanat, tokens])

  if (!mounted || typeof document === "undefined") {
    return null
  }

  return createPortal(
    <div
      data-testid="hasanat-token-layer"
      className="pointer-events-none fixed inset-0 z-[70] overflow-visible"
    >
      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>
      {tokens.map((token) => (
        <FloatingToken key={`${token.id}-${token.createdAt}`} token={token} prefersArabic={prefersArabic} />
      ))}
    </div>,
    document.body,
  )
}
