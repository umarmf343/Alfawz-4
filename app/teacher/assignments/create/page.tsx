"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { CheckedState } from "@radix-ui/react-checkbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  BookOpen,
  Users,
  ImageIcon,
  ArrowLeft,
  Save,
  Send,
  UploadCloud,
  Trash2,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { HotspotEditor } from "@/components/hotspot-editor"
import { useToast } from "@/hooks/use-toast"

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

const SURAH_OPTIONS = [
  { value: "al-fatiha", number: 1, label: "Al-Fatiha (The Opening)" },
  { value: "al-baqarah", number: 2, label: "Al-Baqarah (The Cow)" },
  { value: "al-imran", number: 3, label: "Al-Imran (The Family of Imran)" },
  { value: "an-nisa", number: 4, label: "An-Nisa (The Women)" },
  { value: "al-maidah", number: 5, label: "Al-Maidah (The Table)" },
  { value: "al-ikhlas", number: 112, label: "Al-Ikhlas (The Sincerity)" },
  { value: "al-falaq", number: 113, label: "Al-Falaq (The Daybreak)" },
  { value: "an-nas", number: 114, label: "An-Nas (The Mankind)" },
] as const

interface ClassOption {
  id: string
  name: string
  studentCount: number
}

interface StudentOption {
  id: string
  name: string
  email: string
  classNames: string[]
}

const SAMPLE_LIBRARY_IMAGES = [
  "/arabic-calligraphy-with-quranic-verses.jpg",
  "/islamic-geometric-patterns-with-arabic-text.jpg",
  "/mushaf-page-with-highlighted-verses.jpg",
]

export default function CreateAssignmentPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("basic")
  const [assignmentData, setAssignmentData] = useState({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
    surah: "",
    ayahRange: "",
    assignmentType: "recitation",
    instructions: "",
  })

  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(SAMPLE_LIBRARY_IMAGES[0] ?? null)
  const [uploadedImageName, setUploadedImageName] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assignmentId, setAssignmentId] = useState<string | null>(null)
  const [classOptions, setClassOptions] = useState<ClassOption[]>([])
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([])
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const assignmentIdParam = searchParams.get("assignmentId")
    if (!assignmentIdParam || assignmentIdParam === assignmentId) {
      return
    }

    let isMounted = true

    const loadAssignment = async () => {
      try {
        const response = await fetch(`/api/teacher/assignments/${assignmentIdParam}`)
        const data = (await response.json()) as {
          assignment?: {
            assignment?: {
              title: string
              description?: string
              instructions?: string
              assignmentType: string
              surahName: string
              surahNumber: number
              ayahRange: string
              dueDate: string
              imageUrl?: string | null
              classIds: string[]
              studentIds: string[]
              hotspots: Hotspot[]
            }
          }
          error?: string
        }

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load assignment")
        }

        const assignment = data.assignment?.assignment
        if (!assignment || !isMounted) {
          return
        }

        const dueDate = new Date(assignment.dueDate)
        const dueDateValid = !Number.isNaN(dueDate.getTime())
        const dueDateValue = dueDateValid ? dueDate.toISOString() : ""
        const surahOption = SURAH_OPTIONS.find((option) => option.number === assignment.surahNumber)

        setAssignmentId(assignmentIdParam)
        setAssignmentData((prev) => ({
          ...prev,
          title: assignment.title ?? "",
          description: assignment.description ?? "",
          instructions: assignment.instructions ?? "",
          assignmentType: assignment.assignmentType ?? prev.assignmentType,
          surah: surahOption?.value ?? prev.surah,
          ayahRange: assignment.ayahRange ?? "",
          dueDate: dueDateValue ? dueDateValue.slice(0, 10) : "",
          dueTime: dueDateValue ? dueDateValue.slice(11, 16) : "",
        }))
        setSelectedClassIds([...assignment.classIds])
        setSelectedStudentIds([...assignment.studentIds])
        setSelectedImage(assignment.imageUrl ?? null)
        setUploadedImageName(null)
        setHotspots(
          (assignment.hotspots ?? []).map((hotspot, index) => ({
            id: hotspot.id ?? `${assignmentIdParam}_hotspot_${index + 1}`,
            title: hotspot.title ?? `Hotspot ${index + 1}`,
            description: hotspot.description ?? "",
            x: hotspot.x ?? 0,
            y: hotspot.y ?? 0,
            width: hotspot.width ?? 0,
            height: hotspot.height ?? 0,
            audioUrl: hotspot.audioUrl,
          })),
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load assignment"
        toast({ title: "Could not load assignment", description: message, variant: "destructive" })
      }
    }

    loadAssignment()

    return () => {
      isMounted = false
    }
  }, [assignmentId, searchParams, toast])

  useEffect(() => {
    let isMounted = true

    const loadDestinations = async () => {
      setIsLoadingDestinations(true)
      try {
        const [classResponse, studentResponse] = await Promise.all([
          fetch("/api/teacher/classes"),
          fetch("/api/teacher/students"),
        ])

        const classData = (await classResponse.json()) as { classes: { id: string; name: string; studentCount: number }[]; error?: string }
        if (!classResponse.ok) {
          throw new Error(classData.error ?? "Unable to load classes")
        }

        const studentData = (await studentResponse.json()) as {
          students: { id: string; name: string; email: string; classNames: string[] }[]
          error?: string
        }
        if (!studentResponse.ok) {
          throw new Error(studentData.error ?? "Unable to load students")
        }

        if (!isMounted) return

        const sortedClasses = [...(classData.classes ?? [])].sort((a, b) => a.name.localeCompare(b.name))
        const sortedStudents = [...(studentData.students ?? [])].sort((a, b) => a.name.localeCompare(b.name))

        setClassOptions(sortedClasses)
        setStudentOptions(sortedStudents)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load roster information"
        toast({
          title: "Unable to load roster",
          description: message,
          variant: "destructive",
        })
      } finally {
        if (isMounted) {
          setIsLoadingDestinations(false)
        }
      }
    }

    loadDestinations()

    return () => {
      isMounted = false
    }
  }, [toast])

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [])

  const updateSelection = (
    id: string,
    checked: CheckedState,
    setState: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setState((prev) => {
      if (checked === true) {
        if (prev.includes(id)) {
          return prev
        }
        return [...prev, id]
      }
      return prev.filter((value) => value !== id)
    })
  }

  const handleClassSelectionChange = (classId: string, checked: CheckedState) => {
    updateSelection(classId, checked, setSelectedClassIds)
  }

  const handleStudentSelectionChange = (studentId: string, checked: CheckedState) => {
    updateSelection(studentId, checked, setSelectedStudentIds)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const objectUrl = URL.createObjectURL(file)
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
    }
    objectUrlRef.current = objectUrl
    setSelectedImage(objectUrl)
    setUploadedImageName(file.name)
    setHotspots([])
    event.target.value = ""
  }

  const handleUseSampleImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    const nextImage = SAMPLE_LIBRARY_IMAGES[Math.floor(Math.random() * SAMPLE_LIBRARY_IMAGES.length)] ?? null
    setSelectedImage(nextImage)
    setUploadedImageName(null)
    setHotspots([])
  }

  const clearImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setSelectedImage(null)
    setUploadedImageName(null)
    setHotspots([])
  }

  const handleSubmit = async (action: "save" | "publish") => {
    if (!assignmentData.title.trim()) {
      toast({ title: "Add a title", description: "Please provide a clear assignment title before continuing.", variant: "destructive" })
      return
    }

    if (!assignmentData.dueDate) {
      toast({ title: "Missing due date", description: "Choose when this assignment should be due.", variant: "destructive" })
      return
    }

    const surahOption = SURAH_OPTIONS.find((option) => option.value === assignmentData.surah)
    if (!surahOption) {
      toast({ title: "Select a surah", description: "Pick the surah your students should focus on.", variant: "destructive" })
      return
    }

    if (!assignmentData.ayahRange.trim()) {
      toast({ title: "Add an ayah range", description: "Specify the ayah range the students should work on.", variant: "destructive" })
      return
    }

    if (selectedClassIds.length === 0 && selectedStudentIds.length === 0) {
      toast({
        title: "Choose who should receive this",
        description: "Select at least one class or learner before publishing.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        title: assignmentData.title,
        description: assignmentData.description,
        instructions: assignmentData.instructions,
        assignmentType: assignmentData.assignmentType || "recitation",
        surahName: surahOption.label,
        surahNumber: surahOption.number,
        ayahRange: assignmentData.ayahRange,
        dueDate: assignmentData.dueDate,
        dueTime: assignmentData.dueTime || undefined,
        classIds: selectedClassIds,
        studentIds: selectedStudentIds,
        imageUrl: selectedImage || undefined,
        hotspots: hotspots.map(({ title, description, x, y, width, height, audioUrl }) => ({
          title,
          description,
          x,
          y,
          width,
          height,
          audioUrl,
        })),
        publish: action === "publish",
      }

      if (assignmentId) {
        payload.assignmentId = assignmentId
      }

      const response = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as { error?: string; assignment?: { assignment?: { id?: string } } }
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save assignment")
      }

      const createdId = data.assignment?.assignment?.id ?? null
      if (createdId) {
        setAssignmentId(createdId)
      }

      toast({
        title: action === "save" ? "Draft saved" : "Assignment published",
        description:
          action === "save"
            ? "Your draft is stored safely. You can keep refining it and publish when ready."
            : "Students now have this assignment in their recitation panel.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again later."
      toast({
        title: "Unable to save assignment",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
                Save Draft
              </Button>
              <Button
                onClick={() => handleSubmit("publish")}
                className="gradient-maroon text-white border-0"
                disabled={isSubmitting}
              >
                <Send className="w-4 h-4 mr-2" />
                Publish Assignment
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Details</TabsTrigger>
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
                    <Label htmlFor="instructions">Instructions & Notes</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Clarify expectations, tajweed reminders, or submission guidance for learners."
                      value={assignmentData.instructions}
                      onChange={(e) => setAssignmentData((prev) => ({ ...prev, instructions: e.target.value }))}
                      rows={4}
                    />
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
                        {SURAH_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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

            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Assign To
                </CardTitle>
                <CardDescription>Send this assignment to entire classes, specific students, or a mix of both.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Classes</h3>
                      <p className="text-sm text-muted-foreground">Select the cohorts that should receive this assignment.</p>
                    </div>
                    {isLoadingDestinations && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  <div className="space-y-3 rounded-lg border border-border/60 p-4">
                    {classOptions.length === 0 && !isLoadingDestinations ? (
                      <p className="text-sm text-muted-foreground">No classes available yet.</p>
                    ) : (
                      classOptions.map((classOption) => (
                        <label key={classOption.id} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedClassIds.includes(classOption.id)}
                              onCheckedChange={(checked) => handleClassSelectionChange(classOption.id, checked)}
                              id={`class-${classOption.id}`}
                            />
                            <div>
                              <p className="font-medium leading-none">{classOption.name}</p>
                              <p className="text-xs text-muted-foreground">{classOption.studentCount} students</p>
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Individual learners (optional)</h3>
                    <p className="text-sm text-muted-foreground">
                      Layer on personal assignments or spotlight students who need extra coaching.
                    </p>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-border/60 p-4">
                    {studentOptions.length === 0 && !isLoadingDestinations ? (
                      <p className="text-sm text-muted-foreground">No students found.</p>
                    ) : (
                      studentOptions.map((student) => (
                        <label key={student.id} className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedStudentIds.includes(student.id)}
                            onCheckedChange={(checked) => handleStudentSelectionChange(student.id, checked)}
                            id={`student-${student.id}`}
                          />
                          <div>
                            <p className="font-medium leading-none">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                            {student.classNames.length > 0 && (
                              <p className="text-xs text-muted-foreground">{student.classNames.join(", ")}</p>
                            )}
                          </div>
                        </label>
                      ))
                    )}
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
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <Label>Assignment Image</Label>
                      <p className="text-xs text-muted-foreground">
                        Upload from your device or use a sample to anchor your hotspots.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <Button variant="outline" className="bg-transparent" onClick={() => fileInputRef.current?.click()}>
                        <UploadCloud className="w-4 h-4 mr-2" />
                        Upload from device
                      </Button>
                      <Button variant="outline" className="bg-transparent" onClick={handleUseSampleImage}>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Use sample
                      </Button>
                      {selectedImage && (
                        <Button variant="ghost" className="text-red-600 hover:text-red-700" onClick={clearImage}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  {uploadedImageName && (
                    <p className="text-xs text-muted-foreground">Selected: {uploadedImageName}</p>
                  )}

                  {selectedImage ? (
                    <HotspotEditor
                      imageUrl={selectedImage}
                      hotspots={hotspots}
                      onHotspotsChange={setHotspots}
                      mode="edit"
                    />
                  ) : (
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
