"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface ArabicTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: "div" | "p" | "span"
  variant?: "quran" | "modern" | "traditional" | "mushaf"
  size?: "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "responsive"
  diacritics?: boolean
  animate?: boolean
  highlight?: boolean
  children: React.ReactNode
}

const ArabicText = forwardRef<HTMLElement, ArabicTextProps>(
  (
    {
      as = "div",
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
      mushaf: "font-mushaf",
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

    const Component = as

    return (
      <Component
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
      </Component>
    )
  },
)

ArabicText.displayName = "ArabicText"

export { ArabicText }
