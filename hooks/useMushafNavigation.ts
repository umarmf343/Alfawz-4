"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { getPageForVerse, TOTAL_MUSHAF_PAGES, type VerseKey } from "@/lib/mushaf-data"

interface UseMushafNavigationOptions {
  initialPage?: number
  totalPages?: number
  activeVerseKey?: VerseKey | null
  onPageChange?: (rightPage: number, leftPage: number | null) => void
}

export interface MushafNavigationState {
  rightPage: number
  leftPage: number | null
  totalPages: number
  pageInput: string
  inputError: string | null
  goToPage: (page: number) => void
  goToNextSpread: () => void
  goToPreviousSpread: () => void
  setPageInput: (value: string) => void
  submitPageInput: () => { success: boolean; page?: number }
}

const MIN_PAGE = 1

function clampPage(page: number, totalPages: number) {
  const integer = Math.trunc(page)
  if (!Number.isFinite(integer)) return MIN_PAGE
  return Math.min(totalPages, Math.max(MIN_PAGE, integer))
}

function normalizeRightPage(page: number, totalPages: number) {
  const clamped = clampPage(page, totalPages)
  if (clamped === MIN_PAGE) {
    return MIN_PAGE
  }
  return clamped % 2 === 0 ? clamped - 1 : clamped
}

export function useMushafNavigation({
  initialPage = 1,
  totalPages = TOTAL_MUSHAF_PAGES,
  activeVerseKey = null,
  onPageChange,
}: UseMushafNavigationOptions = {}): MushafNavigationState {
  const [rightPage, setRightPage] = useState(() => normalizeRightPage(initialPage, totalPages))
  const [pageInput, setPageInputState] = useState(() => String(clampPage(initialPage, totalPages)))
  const [inputError, setInputError] = useState<string | null>(null)

  const leftPage = useMemo(() => {
    const candidate = rightPage + 1
    return candidate <= totalPages ? candidate : null
  }, [rightPage, totalPages])

  useEffect(() => {
    onPageChange?.(rightPage, leftPage)
  }, [rightPage, leftPage, onPageChange])

  const goToPage = useCallback(
    (targetPage: number) => {
      const normalized = clampPage(targetPage, totalPages)
      setRightPage(normalizeRightPage(normalized, totalPages))
      setPageInputState(String(normalized))
      setInputError(null)
    },
    [totalPages],
  )

  const goToNextSpread = useCallback(() => {
    goToPage(Math.min(totalPages, rightPage + 2))
  }, [goToPage, rightPage, totalPages])

  const goToPreviousSpread = useCallback(() => {
    goToPage(Math.max(MIN_PAGE, rightPage - 2))
  }, [goToPage, rightPage])

  useEffect(() => {
    if (!activeVerseKey) {
      return
    }
    const targetPage = getPageForVerse(activeVerseKey)
    if (!targetPage) {
      return
    }
    const desiredRightPage = normalizeRightPage(targetPage, totalPages)
    if (desiredRightPage !== rightPage) {
      setRightPage(desiredRightPage)
    }
    setPageInputState(String(clampPage(targetPage, totalPages)))
    setInputError(null)
  }, [activeVerseKey, rightPage, totalPages])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.key === "ArrowRight") {
        event.preventDefault()
        goToNextSpread()
      } else if (event.key === "ArrowLeft") {
        event.preventDefault()
        goToPreviousSpread()
      }
    },
    [goToNextSpread, goToPreviousSpread],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const setPageInput = useCallback((value: string) => {
    setPageInputState(value)
    if (inputError) {
      setInputError(null)
    }
  }, [inputError])

  const submitPageInput = useCallback(() => {
    const trimmed = pageInput.trim()
    if (trimmed.length === 0) {
      setInputError("يرجى إدخال رقم صفحة صالح")
      return { success: false as const }
    }
    const parsed = Number.parseInt(trimmed, 10)
    if (Number.isNaN(parsed)) {
      setInputError("الرجاء إدخال أرقام فقط")
      return { success: false as const }
    }
    if (parsed < MIN_PAGE || parsed > totalPages) {
      setInputError(`اختر رقمًا بين ${MIN_PAGE} و ${totalPages}`)
      return { success: false as const }
    }
    goToPage(parsed)
    return { success: true as const, page: parsed }
  }, [goToPage, pageInput, totalPages])

  return {
    rightPage,
    leftPage,
    totalPages,
    pageInput,
    inputError,
    goToPage,
    goToNextSpread,
    goToPreviousSpread,
    setPageInput,
    submitPageInput,
  }
}
