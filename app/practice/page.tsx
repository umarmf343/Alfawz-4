"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AdvancedAudioRecorder } from "@/components/advanced-audio-recorder"
import { BookOpen, Target, Award, TrendingUp } from "lucide-react"

const sampleAyahs = [
  {
    id: 1,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
    surah: "Al-Fatiha",
    ayah: 1,
    difficulty: "Beginner",
  },
  {
    id: 2,
    arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    translation: "All praise is due to Allah, Lord of the worlds.",
    surah: "Al-Fatiha",
    ayah: 2,
    difficulty: "Beginner",
  },
  {
    id: 3,
    arabic: "وَإِذَا قُرِئَ الْقُرْآنُ فَاسْتَمِعُوا لَهُ وَأَنصِتُوا لَعَلَّكُمْ تُرْحَمُونَ",
    translation: "So when the Qur'an is recited, then listen to it and pay attention that you may receive mercy.",
    surah: "Al-A'raf",
    ayah: 204,
    difficulty: "Intermediate",
  },
]

export default function PracticePage() {
  const [currentAyah, setCurrentAyah] = useState(sampleAyahs[0])
  const [practiceSession, setPracticeSession] = useState({
    completed: 0,
    total: 10,
    accuracy: 85,
    hasanatEarned: 245,
  })

  const handleRecordingComplete = (audioBlob: Blob, duration: number) => {
    console.log("Recording completed:", { duration, size: audioBlob.size })
    // Here you would send the audio to your transcription service

    // Simulate practice completion
    setPracticeSession((prev) => ({
      ...prev,
      completed: prev.completed + 1,
      hasanatEarned: prev.hasanatEarned + 25,
    }))
  }

  const nextAyah = () => {
    const currentIndex = sampleAyahs.findIndex((ayah) => ayah.id === currentAyah.id)
    const nextIndex = (currentIndex + 1) % sampleAyahs.length
    setCurrentAyah(sampleAyahs[nextIndex])
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-maroon-800 mb-2">Recitation Practice</h1>
          <p className="text-gray-600">
            Practice your Quranic recitation with AI-powered feedback and progress tracking
          </p>
        </div>

        {/* Practice Session Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-maroon-600" />
                <div>
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="text-xl font-bold text-maroon-800">
                    {practiceSession.completed}/{practiceSession.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Accuracy</p>
                  <p className="text-xl font-bold text-green-700">{practiceSession.accuracy}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-sm text-gray-600">Hasanat</p>
                  <p className="text-xl font-bold text-amber-700">{practiceSession.hasanatEarned}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Difficulty</p>
                  <Badge variant="secondary">{currentAyah.difficulty}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session Progress */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-maroon-800">Session Progress</h3>
              <span className="text-sm text-gray-600">
                {Math.round((practiceSession.completed / practiceSession.total) * 100)}% Complete
              </span>
            </div>
            <Progress value={(practiceSession.completed / practiceSession.total) * 100} className="h-3" />
          </CardContent>
        </Card>

        {/* Current Ayah */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Ayah</span>
              <Badge variant="outline">
                {currentAyah.surah} - Ayah {currentAyah.ayah}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-right text-2xl font-arabic leading-relaxed text-maroon-800 bg-cream-50 p-6 rounded-lg border-r-4 border-maroon-600">
                {currentAyah.arabic}
              </div>
              <div className="text-gray-700 italic bg-gray-50 p-4 rounded-lg">{currentAyah.translation}</div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Audio Recorder */}
        <div className="mb-8">
          <AdvancedAudioRecorder
            onRecordingComplete={handleRecordingComplete}
            maxDuration={120}
            ayahText={currentAyah.arabic}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <Button onClick={nextAyah} className="bg-maroon-600 hover:bg-maroon-700 text-white px-8" size="lg">
            Next Ayah
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
