"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export type VoicePreference = {
  voiceURI: string | null
  rate: number
  pitch: number
  volume: number
}

export type VoiceOption = {
  voiceURI: string
  name: string
  lang: string
}

export type UseVoiceFeedbackResult = {
  isSupported: boolean
  isSpeaking: boolean
  voices: VoiceOption[]
  preferences: VoicePreference
  setVoice: (voiceURI: string | null) => void
  setRate: (rate: number) => void
  setPitch: (pitch: number) => void
  setVolume: (volume: number) => void
  speak: (text: string, options?: { queue?: boolean }) => void
  cancel: () => void
  refreshVoices: () => void
}

const STORAGE_KEY = "alfawz.voiceFeedback.preferences"

const DEFAULT_PREFERENCES: VoicePreference = {
  voiceURI: null,
  rate: 1,
  pitch: 1,
  volume: 1,
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function useVoiceFeedback(): UseVoiceFeedbackResult {
  const [isSupported, setIsSupported] = useState(false)
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [preferences, setPreferences] = useState<VoicePreference>(DEFAULT_PREFERENCES)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const supported = useMemo(() => typeof window !== "undefined" && "speechSynthesis" in window, [])

  useEffect(() => {
    if (!supported) {
      return
    }

    setIsSupported(true)

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as VoicePreference
        setPreferences({
          voiceURI: parsed.voiceURI ?? null,
          rate: clamp(Number(parsed.rate) || 1, 0.5, 2),
          pitch: clamp(Number(parsed.pitch) || 1, 0.5, 2),
          volume: clamp(Number(parsed.volume) || 1, 0, 1),
        })
      }
    } catch (error) {
      console.warn("Failed to load voice preferences", error)
    }
  }, [supported])

  const persistPreferences = useCallback((next: VoicePreference) => {
    setPreferences(next)
    if (!supported) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch (error) {
      console.warn("Failed to persist voice preferences", error)
    }
  }, [supported])

  const loadVoices = useCallback(() => {
    if (!supported) {
      return
    }
    const availableVoices = window.speechSynthesis.getVoices()
    const mapped: VoiceOption[] = availableVoices.map((voice) => ({
      voiceURI: voice.voiceURI,
      name: voice.name,
      lang: voice.lang,
    }))
    setVoices(mapped)
  }, [supported])

  useEffect(() => {
    if (!supported) {
      return
    }
    loadVoices()
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices)
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices)
    }
  }, [supported, loadVoices])

  const setVoice = useCallback((voiceURI: string | null) => {
    persistPreferences({ ...preferences, voiceURI })
  }, [persistPreferences, preferences])

  const setRate = useCallback((rate: number) => {
    persistPreferences({ ...preferences, rate: clamp(rate, 0.5, 2) })
  }, [persistPreferences, preferences])

  const setPitch = useCallback((pitch: number) => {
    persistPreferences({ ...preferences, pitch: clamp(pitch, 0.5, 2) })
  }, [persistPreferences, preferences])

  const setVolume = useCallback((volume: number) => {
    persistPreferences({ ...preferences, volume: clamp(volume, 0, 1) })
  }, [persistPreferences, preferences])

  const cancel = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    utteranceRef.current = null
    setIsSpeaking(false)
  }, [supported])

  const speak = useCallback(
    (text: string, options?: { queue?: boolean }) => {
      if (!supported || !text.trim()) {
        return
      }

      const synthesis = window.speechSynthesis
      if (!options?.queue) {
        synthesis.cancel()
      }

      const utterance = new SpeechSynthesisUtterance(text)
      if (preferences.voiceURI) {
        const voice = synthesis.getVoices().find((item) => item.voiceURI === preferences.voiceURI)
        if (voice) {
          utterance.voice = voice
        }
      }

      utterance.rate = clamp(preferences.rate, 0.5, 2)
      utterance.pitch = clamp(preferences.pitch, 0.5, 2)
      utterance.volume = clamp(preferences.volume, 0, 1)

      utterance.onstart = () => {
        setIsSpeaking(true)
        utteranceRef.current = utterance
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        utteranceRef.current = null
      }

      utterance.onerror = () => {
        setIsSpeaking(false)
        utteranceRef.current = null
      }

      synthesis.speak(utterance)
    },
    [preferences, supported],
  )

  useEffect(() => () => {
    cancel()
  }, [cancel])

  return {
    isSupported,
    isSpeaking,
    voices,
    preferences,
    setVoice,
    setRate,
    setPitch,
    setVolume,
    speak,
    cancel,
    refreshVoices: loadVoices,
  }
}
