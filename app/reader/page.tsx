"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  BookOpen,
  Settings,
  Bookmark,
  Share,
  Mic,
  MicOff,
  RotateCcw,
} from "lucide-react"
import Link from "next/link"

// Sample Qur'an data - in real app this would come from Al-Quran Cloud API
const sampleSurah = {
  number: 1,
  name: "Al-Fatiha",
  englishName: "The Opening",
  numberOfAyahs: 7,
  revelationType: "Meccan",
  ayahs: [
    {
      number: 1,
      text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
      transliteration: "Bismillahir-Rahmanir-Raheem",
      audioUrl: "/audio/001001.mp3",
    },
    {
      number: 2,
      text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      translation: "All praise is due to Allah, Lord of the worlds.",
      transliteration: "Alhamdu lillahi rabbil-alameen",
      audioUrl: "/audio/001002.mp3",
    },
    {
      number: 3,
      text: "الرَّحْمَٰنِ الرَّحِيمِ",
      translation: "The Entirely Merciful, the Especially Merciful,",
      transliteration: "Ar-Rahmanir-Raheem",
      audioUrl: "/audio/001003.mp3",
    },
    {
      number: 4,
      text: "مَالِكِ يَوْمِ الدِّينِ",
      translation: "Sovereign of the Day of Recompense.",
      transliteration: "Maliki yawmid-deen",
      audioUrl: "/audio/001004.mp3",
    },
    {
      number: 5,
      text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
      translation: "It is You we worship and You we ask for help.",
      transliteration: "Iyyaka na'budu wa iyyaka nasta'een",
      audioUrl: "/audio/001005.mp3",
    },
    {
      number: 6,
      text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
      translation: "Guide us to the straight path -",
      transliteration: "Ihdinassiratal-mustaqeem",
      audioUrl: "/audio/001006.mp3",
    },
    {
      number: 7,
      text: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
      translation:
        "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.",
      transliteration: "Siratal-lazeena an'amta alayhim ghayril-maghdoobi alayhim wa lad-dalleen",
      audioUrl: "/audio/001007.mp3",
    },
  ],
}

export default function QuranReaderPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentAyah, setCurrentAyah] = useState(0)
  const [volume, setVolume] = useState([75])
  const [playbackSpeed, setPlaybackSpeed] = useState("1")
  const [showTranslation, setShowTranslation] = useState(true)
  const [showTransliteration, setShowTransliteration] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [fontSize, setFontSize] = useState("text-4xl")
  const [reciter, setReciter] = useState("mishary")

  const audioRef = useRef<HTMLAudioElement>(null)

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleNextAyah = () => {
    if (currentAyah < sampleSurah.ayahs.length - 1) {
      setCurrentAyah(currentAyah + 1)
      setIsPlaying(false)
    }
  }

  const handlePrevAyah = () => {
    if (currentAyah > 0) {
      setCurrentAyah(currentAyah - 1)
      setIsPlaying(false)
    }
  }

  const handleAyahClick = (index: number) => {
    setCurrentAyah(index)
    setIsPlaying(false)
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // In real app, this would start/stop audio recording for AI feedback
  }

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100
      audioRef.current.playbackRate = Number.parseFloat(playbackSpeed)
    }
  }, [volume, playbackSpeed])

  return (
    <div className="min-h-screen bg-gradient-cream">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-8 h-8 gradient-maroon rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-foreground">AlFawz Reader</h1>
                </div>
              </Link>
              <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Surah {sampleSurah.number}</span>
                <span>•</span>
                <span>{sampleSurah.name}</span>
                <span>•</span>
                <span>{sampleSurah.englishName}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="bg-transparent">
                <Bookmark className="w-4 h-4 mr-2" />
                Bookmark
              </Button>
              <Button variant="outline" size="sm" className="bg-transparent">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="bg-transparent">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Reader */}
          <div className="lg:col-span-3">
            <Card className="border-border/50 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl gradient-maroon bg-clip-text text-transparent">
                      {sampleSurah.name} - {sampleSurah.englishName}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">
                      {sampleSurah.numberOfAyahs} Ayahs • {sampleSurah.revelationType}
                    </p>
                  </div>
                  <Badge className="gradient-gold text-white border-0">
                    Ayah {currentAyah + 1} of {sampleSurah.numberOfAyahs}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-8">
                {/* Current Ayah Display */}
                <div className="text-center space-y-6 py-8">
                  <div
                    className={`arabic-text ${fontSize} leading-loose text-primary cursor-pointer hover:text-primary/80 transition-colors`}
                    onClick={() => handleAyahClick(currentAyah)}
                  >
                    {sampleSurah.ayahs[currentAyah].text}
                  </div>

                  {showTransliteration && (
                    <p className="text-lg text-muted-foreground italic">
                      {sampleSurah.ayahs[currentAyah].transliteration}
                    </p>
                  )}

                  {showTranslation && (
                    <p className="text-lg text-foreground max-w-3xl mx-auto leading-relaxed">
                      {sampleSurah.ayahs[currentAyah].translation}
                    </p>
                  )}

                  <div className="flex items-center justify-center space-x-2">
                    <Badge variant="secondary">Ayah {sampleSurah.ayahs[currentAyah].number}</Badge>
                  </div>
                </div>

                {/* Audio Controls */}
                <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevAyah}
                      disabled={currentAyah === 0}
                      className="bg-transparent"
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>

                    <Button
                      onClick={handlePlayPause}
                      size="lg"
                      className="gradient-maroon text-white border-0 w-16 h-16 rounded-full"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextAyah}
                      disabled={currentAyah === sampleSurah.ayahs.length - 1}
                      className="bg-transparent"
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Volume2 className="w-5 h-5 text-muted-foreground" />
                    <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="flex-1" />
                    <span className="text-sm text-muted-foreground w-12">{volume[0]}%</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <Select value={playbackSpeed} onValueChange={setPlaybackSpeed}>
                        <SelectTrigger className="w-20 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.5">0.5x</SelectItem>
                          <SelectItem value="0.75">0.75x</SelectItem>
                          <SelectItem value="1">1x</SelectItem>
                          <SelectItem value="1.25">1.25x</SelectItem>
                          <SelectItem value="1.5">1.5x</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={reciter} onValueChange={setReciter}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mishary">Mishary Rashid</SelectItem>
                          <SelectItem value="sudais">Abdul Rahman Al-Sudais</SelectItem>
                          <SelectItem value="husary">Mahmoud Khalil Al-Husary</SelectItem>
                          <SelectItem value="minshawi">Mohamed Siddiq El-Minshawi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      variant={isRecording ? "destructive" : "outline"}
                      size="sm"
                      onClick={toggleRecording}
                      className={isRecording ? "" : "bg-transparent"}
                    >
                      {isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                      {isRecording ? "Stop Recording" : "Practice Recitation"}
                    </Button>
                  </div>
                </div>

                {/* All Ayahs List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">All Ayahs</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                    {sampleSurah.ayahs.map((ayah, index) => (
                      <div
                        key={ayah.number}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          index === currentAyah
                            ? "border-primary bg-primary/5"
                            : "border-border/50 hover:border-primary/30"
                        }`}
                        onClick={() => handleAyahClick(index)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant={index === currentAyah ? "default" : "secondary"} className="text-xs">
                            {ayah.number}
                          </Badge>
                          {index === currentAyah && isPlaying && (
                            <div className="flex items-center space-x-1">
                              <div className="w-1 h-4 bg-primary rounded animate-pulse"></div>
                              <div className="w-1 h-6 bg-primary rounded animate-pulse delay-100"></div>
                              <div className="w-1 h-4 bg-primary rounded animate-pulse delay-200"></div>
                            </div>
                          )}
                        </div>
                        <div className="arabic-text text-xl leading-relaxed text-primary mb-2">{ayah.text}</div>
                        {showTranslation && (
                          <p className="text-sm text-muted-foreground leading-relaxed">{ayah.translation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Controls */}
          <div className="space-y-6">
            {/* Display Settings */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Display Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Font Size</label>
                  <Select value={fontSize} onValueChange={setFontSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-2xl">Small</SelectItem>
                      <SelectItem value="text-3xl">Medium</SelectItem>
                      <SelectItem value="text-4xl">Large</SelectItem>
                      <SelectItem value="text-5xl">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTranslation}
                      onChange={(e) => setShowTranslation(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-sm">Show Translation</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTransliteration}
                      onChange={(e) => setShowTransliteration(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-sm">Show Transliteration</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Progress Tracking */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Surah Progress</span>
                    <span>{Math.round(((currentAyah + 1) / sampleSurah.numberOfAyahs) * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="gradient-maroon h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentAyah + 1) / sampleSurah.numberOfAyahs) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Today's Goal</span>
                    <span className="text-primary font-medium">5 Ayahs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="text-primary font-medium">{currentAyah + 1} Ayahs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Streak</span>
                    <span className="text-accent font-medium">7 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Repeat Current Ayah
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Add to Favorites
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Share className="w-4 h-4 mr-2" />
                  Share Progress
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={sampleSurah.ayahs[currentAyah].audioUrl}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  )
}
