"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, X, Smartphone, Monitor, Wifi, WifiOff } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineNotice, setShowOfflineNotice] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineNotice(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineNotice(true)
      setTimeout(() => setShowOfflineNotice(false), 5000) // Hide after 5 seconds
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check initial online status
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice

      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt")
      } else {
        console.log("User dismissed the install prompt")
      }

      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error("Error during installation:", error)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Don't show again for this session
    sessionStorage.setItem("pwa-install-dismissed", "true")
  }

  // Don't show if already installed or dismissed this session
  if (isInstalled || sessionStorage.getItem("pwa-install-dismissed")) {
    return null
  }

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && deferredPrompt && (
        <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 border-maroon-200 bg-white shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-maroon-600 rounded-lg flex items-center justify-center">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <CardTitle className="text-lg text-maroon-800">Install AlFawz Quran</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription>Get the full app experience with offline access and faster loading.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Smartphone className="w-4 h-4" />
                <span>Works on mobile and desktop</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <WifiOff className="w-4 h-4" />
                <span>Practice offline with cached content</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Monitor className="w-4 h-4" />
                <span>Native app-like experience</span>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button onClick={handleInstallClick} className="flex-1 bg-maroon-600 hover:bg-maroon-700 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Install App
                </Button>
                <Button variant="outline" onClick={handleDismiss} className="bg-transparent">
                  Not Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offline Notice */}
      {showOfflineNotice && (
        <Card className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <WifiOff className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">You're offline</p>
                <p className="text-sm text-orange-700">Some features may be limited, but you can still practice!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Online Status Indicator */}
      <div className="fixed bottom-4 left-4 z-40">
        <Badge
          variant="outline"
          className={`${
            isOnline
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200 animate-pulse"
          }`}
        >
          {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
          {isOnline ? "Online" : "Offline"}
        </Badge>
      </div>
    </>
  )
}
