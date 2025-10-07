"use client"

import type React from "react"

import { useEffect, useState } from "react"
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
import { useToast } from "@/hooks/use-toast"
import {
  getTeacherClasses,
  saveTeacherAssignmentDraft,
  publishTeacherAssignment,
  type AssignmentHotspotRecord,
} from "@/lib/data/teacher-database"
import { listSurahs } from "@/lib/quran-data"
interface ClassOption {
  id: string
  name: string
}

type Hotspot = AssignmentHotspotRecord

export default function CreateAssignmentPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("basic")
  const [assignmentId, setAssignmentId] = useState<string | null>(null)
  const [assignmentData, setAssignmentData] = useState({
    title: "",
    description: "",
    classId: "",
    dueDate: "",
    dueTime: "",
    surahNumber: "",
    ayahRange: "",
    assignmentType: "recitation",
    instructions: "",
  })

  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>("/arabic-calligraphy-with-quranic-verses.jpg")
  const [availableClasses, setAvailableClasses] = useState<ClassOption[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingAction, setPendingAction] = useState<"save" | "publish" | null>(null)
  const [surahOptions] = useState(() => listSurahs())

  useEffect(() => {
    const classes = getTeacherClasses("teacher_001").map((classRecord) => ({
      id: classRecord.id,
      name: classRecord.name,
    }))
    setAvailableClasses(classes)
  }, [])

  const handleSubmit = (action: "save" | "publish") => {
    if (isSubmitting) {
      return
    }

    const trimmedTitle = assignmentData.title.trim()
    const trimmedDescription = assignmentData.description.trim()
    const trimmedAyahRange = assignmentData.ayahRange.trim()
    const trimmedInstructions = assignmentData.instructions.trim()

    if (!trimmedTitle) {
      toast({ title: "Assignment title is required", variant: "destructive" })
      return
    }

    if (!assignmentData.classId) {
      toast({ title: "Please select a class", variant: "destructive" })
      return
    }

    if (!assignmentData.surahNumber) {
      toast({ title: "Please choose a Surah", variant: "destructive" })
      return
    }

    if (!trimmedAyahRange) {
      toast({ title: "Specify an ayah range", variant: "destructive" })
      return
    }

    if (!assignmentData.dueDate) {
      toast({ title: "Select a due date", variant: "destructive" })
      return
    }

    const surahNumber = Number.parseInt(assignmentData.surahNumber, 10)
    if (!Number.isFinite(surahNumber) || surahNumber <= 0) {
      toast({ title: "Invalid Surah selection", variant: "destructive" })
      return
    }

    const dueTime = assignmentData.dueTime && assignmentData.dueTime.trim() ? assignmentData.dueTime : "23:59"
    const dueAtCandidate = new Date(`${assignmentData.dueDate}T${dueTime}`)
    if (Number.isNaN(dueAtCandidate.getTime())) {
      toast({ title: "Unable to parse due date", variant: "destructive" })
      return
    }

    setPendingAction(action)
    setIsSubmitting(true)
    try {
      const payload = {
        assignmentId: assignmentId ?? undefined,
        classIds: [assignmentData.classId],
        title: trimmedTitle,
        description: trimmedDescription,
        instructions: trimmedInstructions,
        surahNumber,
        ayahRange: trimmedAyahRange,
        assignmentType: assignmentData.assignmentType || "recitation",
        dueAt: dueAtCandidate.toISOString(),
        imageUrl: selectedImage,
        hotspots,
      }

      const result =
        action === "save"
          ? saveTeacherAssignmentDraft("teacher_001", payload)
          : publishTeacherAssignment("teacher_001", payload)

      setAssignmentId(result.assignment.id)

      if (action === "save") {
        toast({
          title: "Draft saved",
          description: "Your assignment draft has been stored. You can continue refining the details anytime.",
        })
      } else {
        const assignedCount = result.assignedStudentIds.length
        toast({
          title: "Assignment published",
          description:
            assignedCount > 0
              ? `Sent to ${assignedCount} student${assignedCount === 1 ? "" : "s"} in the selected class.`
              : "The assignment is live, but no students are currently linked to the chosen class.",
        })
      }
    } catch (error) {
      const description = error instanceof Error ? error.message : "An unexpected error occurred"
      toast({
        title: action === "save" ? "Unable to save draft" : "Unable to publish assignment",
        description,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setPendingAction(null)
    }
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
              <Button
                variant="outline"
                onClick={() => handleSubmit("save")}
                className="bg-transparent"
                disabled={isSubmitting}
              >
                <Save className="w-4 h-4 mr-2" />
                {pendingAction === "save" ? "Saving…" : "Save Draft"}
              </Button>
              <Button
                onClick={() => handleSubmit("publish")}
                className="gradient-maroon text-white border-0"
                disabled={isSubmitting}
              >
                <Send className="w-4 h-4 mr-2" />
                {pendingAction === "publish" ? "Publishing…" : "Publish Assignment"}
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
                      value={assignmentData.classId}
                      onValueChange={(value) => setAssignmentData((prev) => ({ ...prev, classId: value }))}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={availableClasses.length ? "Choose a class" : "No classes available"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableClasses.length > 0 ? (
                          availableClasses.map((classOption) => (
                            <SelectItem key={classOption.id} value={classOption.id}>
                              {classOption.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-class" disabled>
                            No classes available
                          </SelectItem>
                        )}
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
                      value={assignmentData.surahNumber}
                      onValueChange={(value) => setAssignmentData((prev) => ({ ...prev, surahNumber: value }))}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select Surah" />
                      </SelectTrigger>
                      <SelectContent>
                        {surahOptions.map((surah) => (
                          <SelectItem key={surah.number} value={String(surah.number)}>
                            {surah.englishName} ({surah.arabicName})
                          </SelectItem>
                        ))}
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
