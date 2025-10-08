import React from "react"
import { render, cleanup, waitFor } from "@testing-library/react"
import { describe, expect, afterEach, beforeEach, it, vi } from "vitest"

import type { HasanatTokenModel, TokenRect } from "@/lib/hasanat/token-spawner"

import { FloatingTokensLayer } from "@/components/hasanat/floating-tokens-layer"

let mockTokens: HasanatTokenModel[] = []

vi.mock("@/lib/hasanat/token-spawner", () => {
  const listeners = new Set<(tokens: HasanatTokenModel[]) => void>()
  return {
    tokenSpawner: {
      subscribe: (listener: (tokens: HasanatTokenModel[]) => void) => {
        listeners.add(listener)
        listener(mockTokens)
        return () => {
          listeners.delete(listener)
        }
      },
      complete: vi.fn(),
      triggerCounterPulse: vi.fn(),
      setReducedMotionOverride: vi.fn(),
      reset: vi.fn(),
      spawn: vi.fn(),
    },
  }
})
const mockUser = {
  stats: { hasanat: 128 },
  profile: { locale: "en-US" },
}

vi.mock("@/hooks/use-user", () => ({
  useUser: () => mockUser,
}))

function createTokenRect(x: number, y: number, width: number, height: number): TokenRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
  }
}

describe("FloatingTokensLayer", () => {
  beforeEach(() => {
    mockTokens = []
    mockUser.profile.locale = "en-US"
  })

  afterEach(() => {
    cleanup()
  })

  it("renders float and drift tokens with announcement", async () => {
    mockTokens = [
      {
        id: "float-1",
        amount: 1,
        mode: "float",
        originRect: createTokenRect(180, 540, 80, 40),
        createdAt: 1,
      },
      {
        id: "drift-1",
        amount: 3,
        mode: "drift",
        originRect: createTokenRect(200, 560, 80, 40),
        targetRect: createTokenRect(360, 90, 120, 40),
        createdAt: 2,
      },
    ]

    render(<FloatingTokensLayer />)

    await waitFor(() => {
      expect(document.querySelector("[data-testid='hasanat-token-layer']")).not.toBeNull()
    })

    const layer = document.querySelector("[data-testid='hasanat-token-layer']") as HTMLElement
    expect(layer).toMatchSnapshot()
    const status = layer.querySelector("[role='status']")
    expect(status?.textContent).toContain("Hasanāt +3. Total: 128.")
  })

  it("shows Arabic accent labels when locale is Arabic", async () => {
    mockUser.profile.locale = "ar-SA"
    mockTokens = [
      {
        id: "reduced-1",
        amount: 2,
        mode: "reduced",
        originRect: createTokenRect(200, 560, 80, 40),
        createdAt: 3,
      },
    ]

    render(<FloatingTokensLayer />)

    await waitFor(() => {
      expect(document.querySelector("[data-testid='hasanat-token-layer']")).not.toBeNull()
    })

    const layer = document.querySelector("[data-testid='hasanat-token-layer']") as HTMLElement
    expect(layer.textContent).toContain("حسنات")
    expect(layer).toMatchSnapshot()
  })
})
