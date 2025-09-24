"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Mic, Square, Play, Pause, RotateCcw, Upload, Volume2, VolumeX } from "lucide-react"

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void
  maxDuration?: number
  ayahText?: string
}

export function AdvancedAudioRecorder({ onRecordingComplete, maxDuration = 300, ayahText }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [volume, setVolume] = useState([1])
  const [isMuted, setIsMuted] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Initialize waveform visualization
  const initializeWaveform = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)

      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const updateWaveform = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray)
          setWaveformData(Array.from(dataArray))
          animationRef.current = requestAnimationFrame(updateWaveform)
        }
      }

      if (isRecording) {
        updateWaveform()
      }
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }, [isRecording])

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || waveformData.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, "#8B5A2B")
    gradient.addColorStop(1, "#D4A574")

    ctx.fillStyle = gradient

    const barWidth = width / waveformData.length

    waveformData.forEach((value, index) => {
      const barHeight = (value / 255) * height * 0.8
      const x = index * barWidth
      const y = height - barHeight

      ctx.fillRect(x, y, barWidth - 1, barHeight)
    })
  }, [waveformData])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      mediaRecorderRef.current = mediaRecorder
      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        onRecordingComplete(blob, duration)

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      setDuration(0)

      await initializeWaveform()

      // Start duration timer
      const startTime = Date.now()
      const timer = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000
        setDuration(elapsed)

        if (elapsed >= maxDuration) {
          stopRecording()
        }
      }, 100)

      mediaRecorder.addEventListener("stop", () => {
        clearInterval(timer)
      })
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }

  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      if (isPaused) {
        audioRef.current.play()
        setIsPaused(false)
      } else {
        audioRef.current.currentTime = 0
        audioRef.current.play()
      }
      setIsPlaying(true)
    }
  }

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      setIsPaused(true)
    }
  }

  const resetRecording = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setCurrentTime(0)
    setIsPlaying(false)
    setIsPaused(false)
    setWaveformData([])
  }

  const uploadRecording = async () => {
    if (!audioBlob) return

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setIsUploading(false)
          return 100
        }
        return prev + 10
      })
    }, 200)

    // Here you would implement actual upload logic
    // await uploadToServer(audioBlob)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume[0]
    }
  }, [volume, isMuted])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-maroon-600" />
          Advanced Audio Recorder
        </CardTitle>
        {ayahText && (
          <div className="text-right text-lg font-arabic leading-relaxed text-maroon-700 bg-cream-50 p-4 rounded-lg">
            {ayahText}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Waveform Visualization */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={120}
            className="w-full h-30 bg-gradient-to-r from-cream-50 to-cream-100 rounded-lg border"
          />
          {!isRecording && waveformData.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Waveform will appear here during recording</p>
              </div>
            </div>
          )}
        </div>

        {/* Recording Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full"
              size="lg"
            >
              <Mic className="h-5 w-5 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full animate-pulse"
              size="lg"
            >
              <Square className="h-5 w-5 mr-2" />
              Stop Recording
            </Button>
          )}

          {audioUrl && (
            <>
              {!isPlaying ? (
                <Button onClick={playRecording} variant="outline" size="lg">
                  <Play className="h-5 w-5 mr-2" />
                  Play
                </Button>
              ) : (
                <Button onClick={pauseRecording} variant="outline" size="lg">
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </Button>
              )}

              <Button onClick={resetRecording} variant="outline" size="lg">
                <RotateCcw className="h-5 w-5 mr-2" />
                Reset
              </Button>
            </>
          )}
        </div>

        {/* Duration and Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <Badge variant={isRecording ? "destructive" : "secondary"}>
              {isRecording ? "Recording..." : audioUrl ? "Ready" : "Idle"}
            </Badge>
          </div>

          <Progress value={(duration / maxDuration) * 100} className="h-2" />

          <div className="text-xs text-gray-500 text-center">Maximum duration: {formatTime(maxDuration)}</div>
        </div>

        {/* Volume Control */}
        {audioUrl && (
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>

            <div className="flex-1">
              <Slider value={volume} onValueChange={setVolume} max={1} step={0.1} className="w-full" />
            </div>

            <span className="text-sm text-gray-600 min-w-[3rem]">{Math.round(volume[0] * 100)}%</span>
          </div>
        )}

        {/* Upload Section */}
        {audioUrl && (
          <div className="space-y-3">
            <Button
              onClick={uploadRecording}
              disabled={isUploading}
              className="w-full bg-maroon-600 hover:bg-maroon-700 text-white"
              size="lg"
            >
              <Upload className="h-5 w-5 mr-2" />
              {isUploading ? "Uploading..." : "Upload Recording"}
            </Button>

            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <div className="text-sm text-center text-gray-600">Uploading... {uploadProgress}%</div>
              </div>
            )}
          </div>
        )}

        {/* Hidden audio element for playback */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onEnded={() => {
              setIsPlaying(false)
              setIsPaused(false)
              setCurrentTime(0)
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}
