"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface ArabicTextProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "quran" | "modern" | "traditional"
  size?: "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "responsive"
  diacritics?: boolean
  animate?: boolean
  highlight?: boolean
  children: React.ReactNode
}

const ArabicText = forwardRef<HTMLDivElement, ArabicTextProps>(
  (
    {
      className,
      variant = "traditional",
      size = "base",
      diacritics = true,
      animate = false,
      highlight = false,
      children,
      ...props
    },
    ref,
  ) => {
    const baseClasses = "rtl text-right"

    const variantClasses = {
      quran: "font-quran",
      modern: "font-arabic-modern",
      traditional: "font-arabic",
    }

    const sizeClasses = {
      sm: "text-arabic-sm",
      base: "text-arabic-base",
      lg: "text-arabic-lg",
      xl: "text-arabic-xl",
      "2xl": "text-arabic-2xl",
      "3xl": "text-arabic-3xl",
      responsive: "text-arabic-responsive",
    }

    const diacriticsClass = diacritics ? "arabic-diacritics" : "arabic-no-diacritics"
    const animateClass = animate ? "arabic-fade-in" : ""
    const highlightClass = highlight ? "arabic-highlight" : ""

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          diacriticsClass,
          animateClass,
          highlightClass,
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)

ArabicText.displayName = "ArabicText"

export { ArabicText }
