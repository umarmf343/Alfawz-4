"use client"

import { Label } from "@/components/ui/label"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, Square, Play, Pause, RotateCcw, Upload, Award } from "lucide-react"

interface RecordingInterfaceProps {
  expectedText: string
  ayahId: string
  onTranscriptionComplete?: (result: any) => void
}

export function RecordingInterface({ expectedText, ayahId, onTranscriptionComplete }: RecordingInterfaceProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionResult, setTranscriptionResult] = useState<any>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [waveformData, setWaveformData] = useState<number[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      streamRef.current = stream

      // Set up audio analysis for waveform
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      analyser.fftSize = 256
      analyserRef.current = analyser

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })
      mediaRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer and waveform animation
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
        updateWaveform()
      }, 100)
    } catch (error) {
      console.error("Error starting recording:", error)
      alert("Could not access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }

  const updateWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw waveform
    const barWidth = canvas.width / bufferLength
    let x = 0

    ctx.fillStyle = "#7A001F"
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
      x += barWidth + 1
    }
  }

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const resetRecording = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setTranscriptionResult(null)
    setRecordingTime(0)
    setWaveformData([])
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
  }

  const submitForTranscription = async () => {
    if (!audioBlob) return

    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.wav")
      formData.append("expectedText", expectedText)
      formData.append("ayahId", ayahId)

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Transcription failed")
      }

      const result = await response.json()
      setTranscriptionResult(result)
      onTranscriptionComplete?.(result)
    } catch (error) {
      console.error("Transcription error:", error)
      alert("Failed to transcribe audio. Please try again.")
    } finally {
      setIsTranscribing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 75) return "text-blue-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800"
    if (score >= 75) return "bg-blue-100 text-blue-800"
    if (score >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <div className="space-y-6">
      {/* Expected Text Display */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg text-maroon-800">Practice Text</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-right text-2xl leading-relaxed font-arabic p-4 bg-cream-50 rounded-lg">
            {expectedText}
          </div>
        </CardContent>
      </Card>

      {/* Recording Interface */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg text-maroon-800">Record Your Recitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Waveform Visualization */}
          <div className="bg-gray-50 rounded-lg p-4">
            <canvas ref={canvasRef} width={400} height={100} className="w-full h-20 rounded" />
            {isRecording && (
              <div className="text-center mt-2">
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  Recording: {formatTime(Math.floor(recordingTime / 10))}
                </Badge>
              </div>
            )}
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center space-x-4">
            {!isRecording && !audioBlob && (
              <Button
                onClick={startRecording}
                className="bg-maroon-600 hover:bg-maroon-700 text-white px-8 py-3"
                size="lg"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <Button onClick={stopRecording} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3" size="lg">
                <Square className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            )}

            {audioBlob && !isRecording && (
              <div className="flex items-center space-x-3">
                <Button onClick={playRecording} variant="outline" className="bg-transparent">
                  {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isPlaying ? "Pause" : "Play"}
                </Button>

                <Button onClick={resetRecording} variant="outline" className="bg-transparent">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>

                <Button
                  onClick={submitForTranscription}
                  disabled={isTranscribing}
                  className="bg-maroon-600 hover:bg-maroon-700 text-white"
                >
                  {isTranscribing ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Get Feedback
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Audio Element */}
          {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />}
        </CardContent>
      </Card>

      {/* Transcription Results */}
      {transcriptionResult && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg text-maroon-800 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Recitation Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(transcriptionResult.feedback.overallScore)}`}>
                {transcriptionResult.feedback.overallScore}%
              </div>
              <Badge className={getScoreBadgeColor(transcriptionResult.feedback.overallScore)}>Overall Score</Badge>
            </div>

            {/* Detailed Scores */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-maroon-700">{transcriptionResult.feedback.accuracy}%</div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-maroon-700">
                  {transcriptionResult.feedback.timingScore}%
                </div>
                <div className="text-sm text-gray-600">Timing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-maroon-700">
                  {transcriptionResult.feedback.fluencyScore}%
                </div>
                <div className="text-sm text-gray-600">Fluency</div>
              </div>
            </div>

            {/* Hasanat Points */}
            <div className="bg-gradient-to-r from-gold-50 to-gold-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gold-700">+{transcriptionResult.hasanatPoints} Hasanat</div>
              <div className="text-sm text-gold-600">
                {transcriptionResult.arabicLetterCount} Arabic letters × 10 ×{" "}
                {transcriptionResult.feedback.overallScore}%
              </div>
            </div>

            {/* Feedback Message */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800">{transcriptionResult.feedback.feedback}</p>
            </div>

            {/* Errors Analysis */}
            {transcriptionResult.feedback.errors.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-maroon-800">Areas for Improvement:</h4>
                <div className="space-y-2">
                  {transcriptionResult.feedback.errors.slice(0, 5).map((error: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-red-50 rounded">
                      <Badge variant="outline" className="text-red-700 border-red-300">
                        {error.type}
                      </Badge>
                      <span className="text-sm text-red-800">{error.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transcription Comparison */}
            <div className="space-y-3">
              <h4 className="font-semibold text-maroon-800">Transcription Comparison:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Expected:</Label>
                  <div className="text-right text-lg font-arabic p-3 bg-green-50 rounded border">
                    {transcriptionResult.expectedText}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Your Recitation:</Label>
                  <div className="text-right text-lg font-arabic p-3 bg-blue-50 rounded border">
                    {transcriptionResult.transcription}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
