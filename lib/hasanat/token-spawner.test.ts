import { describe, expect, beforeEach, afterEach, it, vi } from "vitest"

import { tokenSpawner } from "@/lib/hasanat/token-spawner"
import type { HasanatTokenModel } from "@/lib/hasanat/token-spawner"

function createDOMRect(x: number, y: number, width: number, height: number): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    toJSON: () => ({}),
  } as DOMRect
}

describe("tokenSpawner", () => {
  let nowSpy: ReturnType<typeof vi.spyOn>
  let currentTime = 0
  let tokens: HasanatTokenModel[] = []
  let unsubscribe: (() => void) | null = null

  beforeEach(() => {
    vi.useFakeTimers()
    currentTime = 0
    nowSpy = vi.spyOn(performance, "now").mockImplementation(() => currentTime)
    document.body.innerHTML = `
      <button data-hasanat-source="next-button"></button>
      <div data-hasanat-target="hasanat-counter"></div>
    `
    const nextButton = document.querySelector<HTMLButtonElement>("[data-hasanat-source=\"next-button\"]")!
    nextButton.getBoundingClientRect = () => createDOMRect(180, 540, 96, 40)
    const counter = document.querySelector<HTMLElement>("[data-hasanat-target=\"hasanat-counter\"]")!
    counter.getBoundingClientRect = () => createDOMRect(320, 80, 120, 42)

    tokenSpawner.reset()
    tokenSpawner.setReducedMotionOverride(null)
    tokens = []
    unsubscribe = tokenSpawner.subscribe((next) => {
      tokens = next
    })
  })

  afterEach(() => {
    unsubscribe?.()
    tokenSpawner.reset()
    tokenSpawner.setReducedMotionOverride(null)
    document.body.innerHTML = ""
    nowSpy.mockRestore()
    vi.useRealTimers()
  })

  it("coalesces rapid increments into a single token", () => {
    currentTime = 0
    tokenSpawner.spawn(1)
    expect(tokens).toHaveLength(1)
    const firstId = tokens[0]?.id
    currentTime = 150
    tokenSpawner.spawn(1)
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.id).toBe(firstId)
    expect(tokens[0]?.amount).toBe(2)
  })

  it("creates a new token after the aggregation window elapses", () => {
    currentTime = 0
    tokenSpawner.spawn(1)
    const firstId = tokens[0]?.id
    vi.advanceTimersByTime(500)
    currentTime = 600
    tokenSpawner.spawn(1)
    expect(tokens.length).toBeGreaterThanOrEqual(2)
    const latest = tokens[tokens.length - 1]
    expect(latest.id).not.toBe(firstId)
    expect(latest.amount).toBe(1)
  })

  it("limits the number of concurrent tokens", () => {
    for (let index = 0; index < 6; index += 1) {
      currentTime = index * 800
      tokenSpawner.spawn(1)
      vi.advanceTimersByTime(400)
    }
    expect(tokens.length).toBeLessThanOrEqual(5)
  })

  it("falls back to float mode when no counter is present", () => {
    document.querySelector("[data-hasanat-target=\"hasanat-counter\"]")?.remove()
    currentTime = 0
    tokenSpawner.spawn(1)
    expect(tokens[0]?.mode).toBe("float")
  })

  it("honours reduced motion overrides", () => {
    tokenSpawner.setReducedMotionOverride(true)
    currentTime = 0
    tokenSpawner.spawn(1)
    expect(tokens[0]?.mode).toBe("reduced")
  })

  it("removes tokens on completion", () => {
    currentTime = 0
    tokenSpawner.spawn(1)
    const tokenId = tokens[0]?.id
    expect(tokens).toHaveLength(1)
    if (tokenId) {
      tokenSpawner.complete(tokenId)
    }
    expect(tokens).toHaveLength(0)
  })

  it("pulses the counter element", () => {
    const counter = document.querySelector<HTMLElement>("[data-hasanat-target=\"hasanat-counter\"]")!
    tokenSpawner.triggerCounterPulse(false)
    expect(counter.classList.contains("animate-hasanat-counter")).toBe(true)
    vi.advanceTimersByTime(260)
    expect(counter.classList.contains("animate-hasanat-counter")).toBe(false)

    tokenSpawner.triggerCounterPulse(true)
    expect(counter.classList.contains("animate-hasanat-counter-reduced")).toBe(true)
    vi.advanceTimersByTime(260)
    expect(counter.classList.contains("animate-hasanat-counter-reduced")).toBe(false)
  })
})
