"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Volume2, Square, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"

const WELCOME_AUDIO_SRC = "/audio/welcome-student.mp3"
const PLAYBACK_STORAGE_KEY = "alfawz:studentWelcome:v1"

type PlaybackState = "idle" | "playing" | "ready" | "error"

interface StudentWelcomeAudioProps {
  className?: string
}

export function StudentWelcomeAudio({ className }: StudentWelcomeAudioProps) {
  const { profile, isLoading } = useUser()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [hasHeardMessage, setHasHeardMessage] = useState(false)
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle")
  const [hasAttemptedAutoplay, setHasAttemptedAutoplay] = useState(false)
  const [showAutoplayNotice, setShowAutoplayNotice] = useState(false)

  const isStudent = profile.role === "student"

  const ensureAudio = useCallback(() => {
    if (typeof window === "undefined") {
      return null
    }

    if (!audioRef.current) {
      const audio = new Audio(WELCOME_AUDIO_SRC)
      audio.preload = "auto"
      audio.onended = () => {
        setPlaybackState("ready")
      }
      audioRef.current = audio
    }

    return audioRef.current
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    if (sessionStorage.getItem(PLAYBACK_STORAGE_KEY) === "true") {
      setHasHeardMessage(true)
      setPlaybackState("ready")
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    if (isLoading) {
      return
    }

    if (!isStudent) {
      return
    }

    if (hasAttemptedAutoplay) {
      return
    }

    setHasAttemptedAutoplay(true)

    if (sessionStorage.getItem(PLAYBACK_STORAGE_KEY) === "true") {
      setHasHeardMessage(true)
      setPlaybackState("ready")
      return
    }

    const audio = ensureAudio()
    if (!audio) {
      return
    }

    audio.currentTime = 0
    setPlaybackState("playing")

    audio
      .play()
      .then(() => {
        sessionStorage.setItem(PLAYBACK_STORAGE_KEY, "true")
        setHasHeardMessage(true)
        setShowAutoplayNotice(false)
      })
      .catch(() => {
        setPlaybackState("error")
        setShowAutoplayNotice(true)
      })
  }, [ensureAudio, hasAttemptedAutoplay, isLoading, isStudent])

  useEffect(() => {
    return () => {
      const audio = audioRef.current
      if (!audio) {
        return
      }
      audio.pause()
      audio.src = ""
      audioRef.current = null
    }
  }, [])

  const handlePlay = useCallback(async () => {
    const audio = ensureAudio()
    if (!audio) {
      return
    }

    audio.currentTime = 0
    setPlaybackState("playing")
    try {
      await audio.play()
      sessionStorage.setItem(PLAYBACK_STORAGE_KEY, "true")
      setHasHeardMessage(true)
      setShowAutoplayNotice(false)
    } catch {
      setPlaybackState("error")
      setShowAutoplayNotice(true)
    }
  }, [ensureAudio])

  const handleStop = useCallback(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }
    audio.pause()
    audio.currentTime = 0
    setPlaybackState("ready")
  }, [])

  const isStopDisabled = !audioRef.current || audioRef.current.paused

  if (!isStudent) {
    return null
  }

  return (
    <div className={cn("rounded-2xl border border-maroon-100 bg-maroon-50 p-5 shadow-sm", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-maroon-900">Your motivational welcome</p>
          <p className="text-sm text-maroon-700">
            {showAutoplayNotice
              ? "Press play to hear your welcome message. Your browser blocked automatic playback."
              : hasHeardMessage
              ? "Need a boost? Replay the welcome message anytime."
              : "We prepared a powerful welcome message to spark your study session."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePlay}
            disabled={playbackState === "playing"}
            className="min-w-[11rem] border-maroon-200 text-maroon-900 hover:bg-maroon-100"
          >
            <Volume2 className="mr-2 h-4 w-4" />
            {playbackState === "playing" ? "Playing..." : hasHeardMessage ? "Replay welcome" : "Play welcome"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleStop}
            disabled={isStopDisabled}
            className="text-maroon-800 hover:bg-maroon-100"
          >
            <Square className="mr-2 h-4 w-4" />Stop
          </Button>
        </div>
      </div>
      {playbackState === "error" && (
        <div className="mt-3 flex items-center gap-2 text-sm text-maroon-800">
          <AlertTriangle className="h-4 w-4" />
          Playback was blocked. Press “Play welcome” to listen.
        </div>
      )}
    </div>
  )
}
