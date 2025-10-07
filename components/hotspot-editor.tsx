"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Play, Pause, Save, Mic } from "lucide-react"

interface Hotspot {
  id: string
  x: number
  y: number
  width: number
  height: number
  title: string
  description: string
  audioUrl?: string
}

interface HotspotEditorProps {
  imageUrl: string
  hotspots: Hotspot[]
  onHotspotsChange: (hotspots: Hotspot[]) => void
  mode: "edit" | "view"
}

export function HotspotEditor({ imageUrl, hotspots, onHotspotsChange, mode }: HotspotEditorProps) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [currentHotspot, setCurrentHotspot] = useState<Hotspot | null>(null)
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== "edit") return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setIsDrawing(true)
    setStartPos({ x, y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== "edit") return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const width = Math.abs(x - startPos.x)
    const height = Math.abs(y - startPos.y)
    const left = Math.min(x, startPos.x)
    const top = Math.min(y, startPos.y)

    setCurrentHotspot({
      id: `temp-${Date.now()}`,
      x: left,
      y: top,
      width,
      height,
      title: "",
      description: "",
    })
  }

  const handleMouseUp = () => {
    if (!isDrawing || !currentHotspot) return

    if (currentHotspot.width > 2 && currentHotspot.height > 2) {
      const newHotspot = {
        ...currentHotspot,
        id: `hotspot-${Date.now()}`,
        title: `Hotspot ${hotspots.length + 1}`,
        description: "Click to add description",
      }
      onHotspotsChange([...hotspots, newHotspot])
      setSelectedHotspot(newHotspot.id)
    }

    setIsDrawing(false)
    setCurrentHotspot(null)
  }

  const updateHotspot = (id: string, updates: Partial<Hotspot>) => {
    const updated = hotspots.map((h) => (h.id === id ? { ...h, ...updates } : h))
    onHotspotsChange(updated)
  }

  const deleteHotspot = (id: string) => {
    onHotspotsChange(hotspots.filter((h) => h.id !== id))
    setSelectedHotspot(null)
  }

  const startRecording = async () => {
    if (!selectedHotspot) {
      console.warn("Select a hotspot before recording audio")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        setAudioBlob(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const saveAudioToHotspot = () => {
    if (audioBlob && selectedHotspot) {
      // In a real app, upload to server and get URL
      const audioUrl = URL.createObjectURL(audioBlob)
      updateHotspot(selectedHotspot, { audioUrl })
      setAudioBlob(null)
    }
  }

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl)
    audio.play()
  }

  const selectedHotspotData = hotspots.find((h) => h.id === selectedHotspot)

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="relative inline-block">
          <img
            ref={imageRef}
            src={imageUrl || "/placeholder.svg"}
            alt="Assignment"
            className="max-w-full h-auto rounded-lg shadow-lg"
            onLoad={() => {
              // Ensure canvas matches image dimensions
              const canvas = canvasRef.current
              const img = imageRef.current
              if (canvas && img) {
                canvas.width = img.offsetWidth
                canvas.height = img.offsetHeight
              }
            }}
          />

          <canvas
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ pointerEvents: mode === "edit" ? "auto" : "none" }}
          />

          {/* Render hotspots */}
          {hotspots.map((hotspot) => (
            <div
              key={hotspot.id}
              className={`absolute border-2 transition-all duration-200 ${
                selectedHotspot === hotspot.id
                  ? "border-maroon-600 bg-maroon-100/30"
                  : "border-maroon-400 bg-maroon-50/20 hover:bg-maroon-100/40"
              }`}
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
                width: `${hotspot.width}%`,
                height: `${hotspot.height}%`,
                cursor: mode === "edit" ? "pointer" : "help",
              }}
              onClick={() => {
                if (mode === "edit") {
                  setSelectedHotspot(hotspot.id)
                } else {
                  setShowTooltip(showTooltip === hotspot.id ? null : hotspot.id)
                }
              }}
              onMouseEnter={() => mode === "view" && setShowTooltip(hotspot.id)}
              onMouseLeave={() => mode === "view" && setShowTooltip(null)}
            >
              {/* Hotspot number badge */}
              <Badge className="absolute -top-2 -left-2 bg-maroon-600 text-white text-xs">
                {hotspots.indexOf(hotspot) + 1}
              </Badge>

              {/* Tooltip for view mode */}
              {mode === "view" && showTooltip === hotspot.id && (
                <div className="absolute z-10 bg-white p-3 rounded-lg shadow-xl border border-gray-200 min-w-48 -top-2 left-full ml-2">
                  <h4 className="font-semibold text-maroon-800 mb-1">{hotspot.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{hotspot.description}</p>
                  {hotspot.audioUrl && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        playAudio(hotspot.audioUrl!)
                      }}
                      className="bg-maroon-600 hover:bg-maroon-700"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Play Audio
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Current drawing hotspot */}
          {currentHotspot && (
            <div
              className="absolute border-2 border-dashed border-maroon-400 bg-maroon-100/30"
              style={{
                left: `${currentHotspot.x}%`,
                top: `${currentHotspot.y}%`,
                width: `${currentHotspot.width}%`,
                height: `${currentHotspot.height}%`,
              }}
            />
          )}
        </div>
      </div>

      {/* Hotspot editor panel */}
      {mode === "edit" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hotspot list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-maroon-800">Hotspots ({hotspots.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {hotspots.length === 0 ? (
                <p className="text-gray-500 text-sm">Click and drag on the image to create hotspots</p>
              ) : (
                hotspots.map((hotspot, index) => (
                  <div
                    key={hotspot.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedHotspot === hotspot.id
                        ? "border-maroon-300 bg-maroon-50"
                        : "border-gray-200 hover:border-maroon-200"
                    }`}
                    onClick={() => setSelectedHotspot(hotspot.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="outline" className="mr-2">
                          #{index + 1}
                        </Badge>
                        <span className="font-medium">{hotspot.title}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteHotspot(hotspot.id)
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {hotspot.audioUrl && (
                      <Badge variant="secondary" className="mt-1">
                        Has Audio
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Hotspot editor */}
          {selectedHotspotData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-maroon-800">Edit Hotspot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input
                    value={selectedHotspotData.title}
                    onChange={(e) => updateHotspot(selectedHotspot!, { title: e.target.value })}
                    placeholder="Hotspot title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    value={selectedHotspotData.description}
                    onChange={(e) => updateHotspot(selectedHotspot!, { description: e.target.value })}
                    placeholder="Hotspot description"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Audio Feedback</label>
                  <div className="space-y-2">
                    {selectedHotspotData.audioUrl ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => playAudio(selectedHotspotData.audioUrl!)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Play
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateHotspot(selectedHotspot!, { audioUrl: undefined })}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={isRecording ? stopRecording : startRecording}
                            className={
                              isRecording ? "bg-red-600 hover:bg-red-700" : "bg-maroon-600 hover:bg-maroon-700"
                            }
                            disabled={!selectedHotspot}
                            title={
                              selectedHotspot
                                ? undefined
                                : "Select a hotspot from the list before recording voice notes"
                            }
                          >
                            {isRecording ? (
                              <>
                                <Pause className="w-4 h-4 mr-1" />
                                Stop Recording
                              </>
                            ) : (
                              <>
                                <Mic className="w-4 h-4 mr-1" />
                                Record Audio
                              </>
                            )}
                          </Button>
                        </div>

                        {audioBlob && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => playAudio(URL.createObjectURL(audioBlob))}
                              variant="outline"
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                            <Button size="sm" onClick={saveAudioToHotspot} className="bg-green-600 hover:bg-green-700">
                              <Save className="w-4 h-4 mr-1" />
                              Save Audio
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
