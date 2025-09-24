"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface RTLLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  spacing?: "none" | "sm" | "md" | "lg" | "xl"
  reverse?: boolean
}

const RTLLayout = forwardRef<HTMLDivElement, RTLLayoutProps>(
  ({ className, children, spacing = "md", reverse = false, ...props }, ref) => {
    const spacingClasses = {
      none: "",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
    }

    const reverseClass = reverse ? "rtl-space-x-reverse" : ""

    return (
      <div
        ref={ref}
        className={cn("rtl-flex items-center", spacingClasses[spacing], reverseClass, className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)

RTLLayout.displayName = "RTLLayout"

export { RTLLayout }
