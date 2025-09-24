"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Users, ImageIcon, Plus, ArrowLeft, Save, Send, Target } from "lucide-react"
import Link from "next/link"
import { HotspotEditor } from "@/components/hotspot-editor"

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

export default function CreateAssignmentPage() {
  const [activeTab, setActiveTab] = useState("basic")
  const [assignmentData, setAssignmentData] = useState({
    title: "",
    description: "",
    class: "",
    dueDate: "",
    dueTime: "",
    surah: "",
    ayahRange: "",
    assignmentType: "",
    instructions: "",
  })

  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>("/arabic-calligraphy-with-quranic-verses.jpg")
  const [isAddingHotspot, setIsAddingHotspot] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingHotspot || !imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newHotspot: Hotspot = {
      id: Date.now().toString(),
      x,
      y,
      width: 0,
      height: 0,
      title: "New Hotspot",
      description: "Click to edit this hotspot",
    }

    setHotspots([...hotspots, newHotspot])
    setIsAddingHotspot(false)
  }

  const removeHotspot = (id: string) => {
    setHotspots(hotspots.filter((h) => h.id !== id))
  }

  const handleSubmit = (action: "save" | "publish") => {
    console.log("Assignment data:", assignmentData)
    console.log("Hotspots:", hotspots)
    console.log("Action:", action)
    // In real app, this would save to database
    alert(`Assignment ${action === "save" ? "saved as draft" : "published"} successfully!`)
  }

  return (
    <div className="min-h-screen bg-gradient-cream">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/teacher/dashboard"
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="w-px h-6 bg-border"></div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 gradient-maroon rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-foreground">Create Assignment</h1>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => handleSubmit("save")} className="bg-transparent">
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={() => handleSubmit("publish")} className="gradient-maroon text-white border-0">
                <Send className="w-4 h-4 mr-2" />
                Publish Assignment
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Details</TabsTrigger>
            <TabsTrigger value="content">Content & Instructions</TabsTrigger>
            <TabsTrigger value="interactive">Interactive Elements</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Assignment Details</CardTitle>
                <CardDescription>Set up the basic information for your assignment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Assignment Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Surah Al-Fatiha Memorization"
                      value={assignmentData.title}
                      onChange={(e) => setAssignmentData((prev) => ({ ...prev, title: e.target.value }))}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="class">Select Class</Label>
                    <Select
                      value={assignmentData.class}
                      onValueChange={(value) => setAssignmentData((prev) => ({ ...prev, class: value }))}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Choose a class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner-a">Beginner Class A</SelectItem>
                        <SelectItem value="beginner-b">Beginner Class B</SelectItem>
                        <SelectItem value="intermediate-a">Intermediate Class A</SelectItem>
                        <SelectItem value="intermediate-b">Intermediate Class B</SelectItem>
                        <SelectItem value="advanced-a">Advanced Class A</SelectItem>
                        <SelectItem value="advanced-b">Advanced Class B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a brief description of the assignment objectives and expectations..."
                    value={assignmentData.description}
                    onChange={(e) => setAssignmentData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={assignmentData.dueDate}
                      onChange={(e) => setAssignmentData((prev) => ({ ...prev, dueDate: e.target.value }))}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueTime">Due Time</Label>
                    <Input
                      id="dueTime"
                      type="time"
                      value={assignmentData.dueTime}
                      onChange={(e) => setAssignmentData((prev) => ({ ...prev, dueTime: e.target.value }))}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignmentType">Assignment Type</Label>
                    <Select
                      value={assignmentData.assignmentType}
                      onValueChange={(value) => setAssignmentData((prev) => ({ ...prev, assignmentType: value }))}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="memorization">Memorization</SelectItem>
                        <SelectItem value="recitation">Recitation Practice</SelectItem>
                        <SelectItem value="tajweed">Tajweed Rules</SelectItem>
                        <SelectItem value="comprehension">Comprehension</SelectItem>
                        <SelectItem value="mixed">Mixed Practice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="surah">Surah</Label>
                    <Select
                      value={assignmentData.surah}
                      onValueChange={(value) => setAssignmentData((prev) => ({ ...prev, surah: value }))}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select Surah" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="al-fatiha">Al-Fatiha (The Opening)</SelectItem>
                        <SelectItem value="al-baqarah">Al-Baqarah (The Cow)</SelectItem>
                        <SelectItem value="al-imran">Al-Imran (The Family of Imran)</SelectItem>
                        <SelectItem value="an-nisa">An-Nisa (The Women)</SelectItem>
                        <SelectItem value="al-maidah">Al-Maidah (The Table)</SelectItem>
                        <SelectItem value="al-ikhlas">Al-Ikhlas (The Sincerity)</SelectItem>
                        <SelectItem value="al-falaq">Al-Falaq (The Daybreak)</SelectItem>
                        <SelectItem value="an-nas">An-Nas (The Mankind)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ayahRange">Ayah Range</Label>
                    <Input
                      id="ayahRange"
                      placeholder="e.g., 1-7 or 15-25"
                      value={assignmentData.ayahRange}
                      onChange={(e) => setAssignmentData((prev) => ({ ...prev, ayahRange: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Instructions & Content</CardTitle>
                <CardDescription>Provide detailed instructions and learning objectives</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="instructions">Detailed Instructions</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Provide step-by-step instructions for students. Include learning objectives, expectations, and any specific requirements..."
                    value={assignmentData.instructions}
                    onChange={(e) => setAssignmentData((prev) => ({ ...prev, instructions: e.target.value }))}
                    rows={8}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Learning Objectives</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50">
                      <Target className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <Input placeholder="Add a learning objective..." className="border-0 p-0 h-auto" />
                      </div>
                      <Button variant="outline" size="sm" className="bg-transparent">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Assessment Criteria</Label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="border-border/30">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 gradient-maroon rounded-lg flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="font-medium">Memorization</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Students must demonstrate accurate memorization of the assigned ayahs
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-border/30">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 gradient-gold rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="font-medium">Recitation</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Proper pronunciation and Tajweed rules application
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interactive" className="space-y-6">
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Interactive Elements</CardTitle>
                <CardDescription>Add interactive hotspots to images for enhanced learning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Assignment Image</Label>
                    <Button
                      variant="outline"
                      className="bg-transparent"
                      onClick={() => {
                        const images = [
                          "/arabic-calligraphy-with-quranic-verses.jpg",
                          "/islamic-geometric-patterns-with-arabic-text.jpg",
                          "/mushaf-page-with-highlighted-verses.jpg",
                        ]
                        setSelectedImage(images[Math.floor(Math.random() * images.length)])
                      }}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>

                  {selectedImage && (
                    <HotspotEditor
                      imageUrl={selectedImage}
                      hotspots={hotspots}
                      onHotspotsChange={setHotspots}
                      mode="edit"
                    />
                  )}

                  {!selectedImage && (
                    <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Upload an image to start adding interactive hotspots</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
