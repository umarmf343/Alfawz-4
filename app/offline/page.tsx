import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WifiOff, BookOpen, Brain, Home } from "lucide-react"
import Link from "next/link"

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-cream flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/50 shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl text-maroon-800">You're Offline</CardTitle>
          <CardDescription className="text-gray-600">
            No internet connection detected. You can still access some features that have been cached for offline use.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-maroon-800">Available Offline:</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 text-sm text-gray-700">
                <BookOpen className="w-4 h-4 text-green-600" />
                <span>Previously viewed Quran pages</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-700">
                <Brain className="w-4 h-4 text-green-600" />
                <span>Memorization practice (cached content)</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-700">
                <Home className="w-4 h-4 text-green-600" />
                <span>Basic app navigation</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-maroon-800">Requires Internet:</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                <span>New Quran content</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                <span>Audio recitations</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                <span>AI feedback and transcription</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                <span>Progress synchronization</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <Link href="/">
              <Button className="w-full bg-maroon-600 hover:bg-maroon-700 text-white">
                <Home className="w-4 h-4 mr-2" />
                Continue Offline
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Your progress will be saved locally and synced when you're back online.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
