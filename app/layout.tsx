import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Tajawal } from "next/font/google"
import "./globals.css"
import { UserProvider } from "@/components/user-provider"
import { Toaster } from "@/components/ui/toaster"
import { FloatingTokensLayer } from "@/components/hasanat/floating-tokens-layer"

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-tajawal" })

const isAnalyticsEnabled = Boolean(process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID)

export const metadata: Metadata = {
  title: "AlFawz Qur'an Institute - Excellence in Qur'anic Education",
  description:
    "Advanced platform for Qur'an recitation, memorization, and Islamic education with AI-powered feedback and comprehensive teacher tools.",
  generator: "AlFawz Qur'an Institute",
  keywords: ["Quran", "Islamic Education", "Memorization", "Recitation", "Tajweed", "Hifz"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Scheherazade+New:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Reem+Kufi:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${tajawal.variable} antialiased`}>
        <UserProvider>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          <FloatingTokensLayer />
          <Toaster />
        </UserProvider>
        {isAnalyticsEnabled ? <Analytics /> : null}
      </body>
    </html>
  )
}
