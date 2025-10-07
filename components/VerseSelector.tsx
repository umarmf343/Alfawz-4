"use client"

import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { SurahOption } from "@/lib/verse-validator"
import { Minus, Trash2 } from "lucide-react"

export type VerseSelectionMode = "range" | "custom"

export interface VerseSelectionBlock {
  id: string
  title?: string
  mode: VerseSelectionMode
  surahNumber?: number | null
  fromAyah?: number | null
  toAyah?: number | null
  customVerseKeys: string
}

interface VerseSelectorProps {
  index: number
  block: VerseSelectionBlock
  onChange: (block: VerseSelectionBlock) => void
  surahOptions: SurahOption[]
  canRemove: boolean
  onRemove?: () => void
  error?: string
}

export function VerseSelector({
  index,
  block,
  onChange,
  surahOptions,
  canRemove,
  onRemove,
  error,
}: VerseSelectorProps) {
  const selectedSurah = useMemo(
    () => surahOptions.find((option) => option.number === block.surahNumber) ?? null,
    [block.surahNumber, surahOptions],
  )

  const ayahOptions = useMemo(() => {
    const count = selectedSurah?.ayahCount ?? 0
    return Array.from({ length: count }, (_, indexValue) => indexValue + 1)
  }, [selectedSurah])

  const handleModeChange = (nextMode: VerseSelectionMode) => {
    if (nextMode === block.mode) {
      return
    }
    onChange({
      ...block,
      mode: nextMode,
      customVerseKeys: nextMode === "custom" ? block.customVerseKeys : "",
    })
  }

  const handleSurahChange = (value: string) => {
    const surahNumber = Number.parseInt(value, 10)
    if (!Number.isFinite(surahNumber)) {
      return
    }
    onChange({
      ...block,
      surahNumber,
      fromAyah: null,
      toAyah: null,
    })
  }

  const handleFromAyahChange = (value: string) => {
    const ayah = Number.parseInt(value, 10)
    if (!Number.isFinite(ayah)) {
      return
    }
    onChange({
      ...block,
      fromAyah: ayah,
      toAyah: block.toAyah ?? ayah,
    })
  }

  const handleToAyahChange = (value: string) => {
    const ayah = Number.parseInt(value, 10)
    if (!Number.isFinite(ayah)) {
      return
    }
    onChange({
      ...block,
      toAyah: ayah,
    })
  }

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-100 text-emerald-800">Block {index + 1}</Badge>
          <Input
            placeholder="e.g., Today's sabaq"
            value={block.title ?? ""}
            onChange={(event) => onChange({ ...block, title: event.target.value })}
            className="h-9 max-w-[220px] border-emerald-200/70"
          />
        </div>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-maroon-600 hover:text-maroon-800"
          >
            <Trash2 className="mr-1 h-4 w-4" /> Remove
          </Button>
        ) : (
          <Badge variant="outline" className="border-dashed border-emerald-200 text-emerald-700">
            <Minus className="mr-1 h-3 w-3" /> Required block
          </Badge>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-maroon-900">Selection mode</Label>
          <Tabs value={block.mode} onValueChange={(value) => handleModeChange(value as VerseSelectionMode)}>
            <TabsList className="grid w-full grid-cols-2 bg-emerald-50/70">
              <TabsTrigger value="range">Surah & ayah range</TabsTrigger>
              <TabsTrigger value="custom">Custom verse keys</TabsTrigger>
            </TabsList>
            <TabsContent value="range" className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-emerald-700">Surah</Label>
                  <Select value={block.surahNumber?.toString() ?? ""} onValueChange={handleSurahChange}>
                    <SelectTrigger className="h-10 border-emerald-200/70">
                      <SelectValue placeholder="Choose Surah" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {surahOptions.map((option) => (
                        <SelectItem key={option.number} value={option.number.toString()}>
                          {option.number}. {option.arabicName} ({option.englishName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase text-emerald-700">From ayah</Label>
                  <Select
                    value={block.fromAyah?.toString() ?? ""}
                    onValueChange={handleFromAyahChange}
                    disabled={!selectedSurah}
                  >
                    <SelectTrigger className="h-10 border-emerald-200/70">
                      <SelectValue placeholder="Start" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {ayahOptions.map((ayah) => (
                        <SelectItem key={ayah} value={ayah.toString()}>
                          Ayah {ayah}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase text-emerald-700">To ayah</Label>
                  <Select
                    value={block.toAyah?.toString() ?? ""}
                    onValueChange={handleToAyahChange}
                    disabled={!selectedSurah}
                  >
                    <SelectTrigger className="h-10 border-emerald-200/70">
                      <SelectValue placeholder="End" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {ayahOptions.map((ayah) => (
                        <SelectItem key={ayah} value={ayah.toString()}>
                          Ayah {ayah}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="mt-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase text-emerald-700">Verse keys</Label>
                <Textarea
                  placeholder="e.g., 112:1,112:2,2:255"
                  value={block.customVerseKeys}
                  onChange={(event) => onChange({ ...block, customVerseKeys: event.target.value })}
                  rows={3}
                  className="border-emerald-200/70"
                />
                <p className="text-xs text-emerald-700/80">
                  Separate keys with commas. Use the format <strong>Surah:Ayah</strong>.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {error && <p className="rounded-md bg-rose-50/80 px-3 py-2 text-sm text-rose-700">{error}</p>}
      </div>
    </div>
  )
}
