"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Play, Pause, SkipBack, SkipForward, Volume2, Bookmark, BookmarkCheck, Languages, Repeat } from "lucide-react"
import { quranAPI, type Surah, type Ayah, type Translation, type Reciter } from "@/lib/quran-api"

interface QuranReaderProps {
  initialSurah?: number
  initialAyah?: number
  showTranslation?: boolean
  showControls?: boolean
}

export function QuranReader({
  initialSurah = 1,
  initialAyah = 1,
  showTranslation = true,
  showControls = true,
}: QuranReaderProps) {
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [currentSurah, setCurrentSurah] = useState<Surah | null>(null)
  const [ayahs, setAyahs] = useState<Ayah[]>([])
  const [translations, setTranslations] = useState<{ [key: number]: Translation[] }>({})
  const [reciters, setReciters] = useState<Reciter[]>([])
  const [selectedReciter, setSelectedReciter] = useState("ar.alafasy")
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showTranslations, setShowTranslations] = useState(showTranslation)
  const [showAllAyahs, setShowAllAyahs] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [volume, setVolume] = useState(0.8)
  const [repeatMode, setRepeatMode] = useState<"none" | "ayah" | "surah">("none")
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [audioUrls, setAudioUrls] = useState<string[]>([])

  const audioRef = useRef<HTMLAudioElement>(null)

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load surah when selection changes
  useEffect(() => {
    if (initialSurah) {
      loadSurah(initialSurah)
    }
  }, [initialSurah])

  useEffect(() => {
    if (!showTranslations || !currentSurah || ayahs.length === 0) {
      return
    }

    const hasCompleteTranslations = ayahs.every((ayah) => {
      const ayahTranslations = translations[ayah.numberInSurah]
      return Array.isArray(ayahTranslations) && ayahTranslations.length > 0
    })

    if (!hasCompleteTranslations) {
      loadTranslations(ayahs, currentSurah.number)
    }
  }, [showTranslations, currentSurah, ayahs, translations])

  const loadInitialData = async () => {
    setIsLoading(true)
    try {
      const [surahsData, recitersData] = await Promise.all([quranAPI.getSurahs(), quranAPI.getReciters()])

      setSurahs(surahsData)
      setReciters(recitersData)
    } catch (error) {
      console.error("Error loading initial data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSurah = async (surahNumber: number) => {
    setIsLoading(true)
    try {
      const surahData = await quranAPI.getSurah(surahNumber)
      if (surahData) {
        setCurrentSurah(surahData.surah)
        setAyahs(surahData.ayahs)
        setCurrentAyahIndex(initialAyah - 1)

        // Load translations for all ayahs
        if (showTranslations) {
          await loadTranslations(surahData.ayahs, surahNumber)
        }

        // Load audio URLs
        await loadAudio(surahNumber)
      }
    } catch (error) {
      console.error("Error loading surah:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTranslations = async (ayahList: Ayah[], surahNumber: number) => {
    const translationPromises = ayahList.map(async (ayah) => {
      const ayahData = await quranAPI.getAyah(surahNumber, ayah.numberInSurah, ["en.sahih", "en.pickthall"])
      return { ayahNumber: ayah.numberInSurah, translations: ayahData?.translations || [] }
    })

    const translationResults = await Promise.all(translationPromises)
    const translationMap: { [key: number]: Translation[] } = {}

    translationResults.forEach(({ ayahNumber, translations: ayahTranslations }) => {
      translationMap[ayahNumber] = ayahTranslations
    })

    setTranslations(translationMap)
  }

  const loadAudio = async (surahNumber: number) => {
    try {
      const audioSegments = await quranAPI.getSurahAudio(surahNumber, selectedReciter)
      const urls = audioSegments.map((segment) => segment.url)
      setAudioUrls(urls)
    } catch (error) {
      console.error("Error loading audio:", error)
    }
  }

  const playAyah = (index: number) => {
    if (audioRef.current && audioUrls[index]) {
      audioRef.current.src = audioUrls[index]
      audioRef.current.playbackRate = playbackSpeed
      audioRef.current.volume = volume
      audioRef.current.play()
      setIsPlaying(true)
      setCurrentAyahIndex(index)
    }
  }

  const pauseAyah = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const nextAyah = () => {
    const nextIndex = currentAyahIndex + 1
    if (nextIndex < ayahs.length) {
      setCurrentAyahIndex(nextIndex)
      if (isPlaying) {
        playAyah(nextIndex)
      }
    }
  }

  const previousAyah = () => {
    const prevIndex = currentAyahIndex - 1
    if (prevIndex >= 0) {
      setCurrentAyahIndex(prevIndex)
      if (isPlaying) {
        playAyah(prevIndex)
      }
    }
  }

  const toggleBookmark = (ayahNumber: number) => {
    const bookmarkKey = `${currentSurah?.number}-${ayahNumber}`
    const newBookmarks = new Set(bookmarkedAyahs)

    if (newBookmarks.has(bookmarkKey)) {
      newBookmarks.delete(bookmarkKey)
    } else {
      newBookmarks.add(bookmarkKey)
    }

    setBookmarkedAyahs(newBookmarks)
    // In real app, save to localStorage or database
    localStorage.setItem("quran-bookmarks", JSON.stringify(Array.from(newBookmarks)))
  }

  const handleAudioEnded = () => {
    if (repeatMode === "ayah") {
      playAyah(currentAyahIndex)
    } else if (repeatMode === "none" && currentAyahIndex < ayahs.length - 1) {
      nextAyah()
    } else if (repeatMode === "surah" && currentAyahIndex === ayahs.length - 1) {
      setCurrentAyahIndex(0)
      playAyah(0)
    } else {
      setIsPlaying(false)
    }
  }

  // Load bookmarks from localStorage
  useEffect(() => {
    const savedBookmarks = localStorage.getItem("quran-bookmarks")
    if (savedBookmarks) {
      setBookmarkedAyahs(new Set(JSON.parse(savedBookmarks)))
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading Quran...</p>
        </div>
      </div>
    )
  }

  const currentAyah = ayahs[currentAyahIndex]
  const ayahEntries = showAllAyahs
    ? ayahs.map((ayah, index) => ({ ayah, index }))
    : currentAyah
      ? [{ ayah: currentAyah, index: currentAyahIndex }]
      : []

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Controls Header */}
      {showControls && (
        <Card className="border-maroon-100 bg-white/90 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Surah Selector */}
              <div className="flex items-center space-x-2">
                <Label className="text-sm font-medium text-maroon-800">Surah:</Label>
                <Select
                  value={currentSurah ? currentSurah.number.toString() : ""}
                  onValueChange={(value) => loadSurah(Number.parseInt(value))}
                >
                  <SelectTrigger className="w-48 bg-white/80">
                    <SelectValue placeholder="Select Surah" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {surahs.map((surah) => (
                      <SelectItem key={surah.number} value={surah.number.toString()}>
                        {surah.number}. {surah.englishName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reciter Selector */}
              <div className="flex items-center space-x-2">
                <Label className="text-sm font-medium text-maroon-800">Reciter:</Label>
                <Select
                  value={selectedReciter}
                  onValueChange={(value) => {
                    setSelectedReciter(value)
                    if (currentSurah) {
                      loadAudio(currentSurah.number)
                    }
                  }}
                >
                  <SelectTrigger className="w-40 bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar.alafasy">Mishary Alafasy</SelectItem>
                    <SelectItem value="ar.husary">Mahmoud Husary</SelectItem>
                    <SelectItem value="ar.minshawi">Mohamed Minshawi</SelectItem>
                    <SelectItem value="ar.sudais">Abdul Rahman Sudais</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Translation Toggle */}
              <div className="flex items-center space-x-2">
                <Switch id="show-translation" checked={showTranslations} onCheckedChange={setShowTranslations} />
                <Label htmlFor="show-translation" className="text-sm text-maroon-800">
                  <Languages className="w-4 h-4 inline mr-1" />
                  Translation
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="show-all-ayahs" checked={showAllAyahs} onCheckedChange={setShowAllAyahs} />
                <Label htmlFor="show-all-ayahs" className="text-sm text-maroon-800">
                  All Ayahs
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Surah Header */}
      {currentSurah && (
        <Card className="border-maroon-100 bg-gradient-to-r from-cream-50 to-white/90">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-maroon-800">
              {currentSurah.name} - {currentSurah.englishName}
            </CardTitle>
            <p className="text-maroon-700">
              {currentSurah.englishNameTranslation} • {currentSurah.numberOfAyahs} Ayahs • {currentSurah.revelationType}
            </p>
          </CardHeader>
        </Card>
      )}

      {/* Audio Controls */}
      {showControls && (
        <div className="sticky top-4 z-20">
          <Card className="border-maroon-100 bg-white/95 shadow-lg shadow-maroon-100/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button onClick={previousAyah} disabled={currentAyahIndex === 0} variant="outline" size="sm">
                    <SkipBack className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={isPlaying ? pauseAyah : () => playAyah(currentAyahIndex)}
                    className="bg-maroon-600 hover:bg-maroon-700 text-white"
                    size="sm"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>

                  <Button onClick={nextAyah} disabled={currentAyahIndex === ayahs.length - 1} variant="outline" size="sm">
                    <SkipForward className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={() => {
                      const modes: ("none" | "ayah" | "surah")[] = ["none", "ayah", "surah"]
                      const currentIndex = modes.indexOf(repeatMode)
                      const nextMode = modes[(currentIndex + 1) % modes.length]
                      setRepeatMode(nextMode)
                    }}
                    variant="outline"
                    size="sm"
                    className={repeatMode !== "none" ? "bg-maroon-50 text-maroon-700 border border-maroon-200" : ""}
                  >
                    <Repeat className="w-4 h-4 mr-1" />
                    {repeatMode === "none" ? "No Repeat" : repeatMode === "ayah" ? "Repeat Ayah" : "Repeat Surah"}
                  </Button>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-4 h-4" />
                    <Slider
                      value={[volume]}
                      onValueChange={(value) => setVolume(value[0])}
                      max={1}
                      step={0.1}
                      className="w-20"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label className="text-sm text-maroon-800">Speed:</Label>
                    <Select
                      value={playbackSpeed.toString()}
                      onValueChange={(value) => setPlaybackSpeed(Number.parseFloat(value))}
                    >
                      <SelectTrigger className="w-20 bg-white/80">
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
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ayahs Display */}
      <div className="space-y-4">
        {ayahEntries.length === 0 ? (
          <Card className="border border-dashed border-maroon-200 bg-white/80">
            <CardContent className="p-6 text-center text-sm text-maroon-700">
              Toggle “All Ayahs” on or select a verse to display it here.
            </CardContent>
          </Card>
        ) : (
          ayahEntries.map(({ ayah, index }) => {
            const isCurrentAyah = index === currentAyahIndex
            const bookmarkKey = `${currentSurah?.number}-${ayah.numberInSurah}`
            const isBookmarked = bookmarkedAyahs.has(bookmarkKey)
            const ayahTranslations = translations[ayah.numberInSurah] || []

            return (
              <Card
                key={ayah.number}
                className={`border border-maroon-100 transition-all duration-200 ${
                  isCurrentAyah ? "ring-2 ring-maroon-200 bg-maroon-50/40" : "bg-white/95"
                }`}
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <Badge variant="outline" className="border border-maroon-200 bg-maroon-50 text-maroon-700">
                      Ayah {ayah.numberInSurah}
                    </Badge>

                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => toggleBookmark(ayah.numberInSurah)}
                        variant="ghost"
                        size="sm"
                        className={
                          isBookmarked ? "text-gold-600 hover:text-gold-700" : "text-gray-400 hover:text-gray-600"
                        }
                      >
                        {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      </Button>

                      <Button
                        onClick={() => playAyah(index)}
                        variant="ghost"
                        size="sm"
                        className="text-maroon-600 hover:text-maroon-700"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Arabic Text */}
                  <div className="font-arabic mb-6 rounded-lg bg-cream-50 p-4 text-right text-2xl leading-relaxed text-maroon-800 md:text-3xl">
                    {ayah.text}
                  </div>

                  {/* Translations */}
                  {showTranslations && ayahTranslations.length > 0 && (
                    <div className="space-y-3">
                      {ayahTranslations.map((translation, tIndex) => (
                        <div
                          key={tIndex}
                          className="rounded-md border-l-4 border-maroon-200 bg-cream-50/80 p-4 text-left"
                        >
                          <p className="leading-relaxed text-maroon-800">{translation.text}</p>
                          <p className="mt-1 text-sm text-maroon-600">— {translation.translator}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ayah Metadata */}
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                    <Badge
                      variant="secondary"
                      className="border border-maroon-200/60 bg-cream-50 text-xs text-maroon-700"
                    >
                      Juz {ayah.juz}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="border border-maroon-200/60 bg-cream-50 text-xs text-maroon-700"
                    >
                      Page {ayah.page}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="border border-maroon-200/60 bg-cream-50 text-xs text-maroon-700"
                    >
                      Manzil {ayah.manzil}
                    </Badge>
                    {ayah.sajda && (
                      <Badge variant="secondary" className="bg-green-100 text-xs text-green-800">
                        Sajda
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        className="hidden"
      />
    </div>
  )
}
