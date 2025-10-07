"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  Compass,
  Flame,
  HeartPulse,
  Lightbulb,
  ListChecks,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from "lucide-react"

import AppLayout from "@/components/app-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  TafsirTriviaQuestion,
  tafsirTriviaDeck,
  tafsirTriviaRounds,
} from "@/data/tafsir-trivia"

const TOTAL_HEARTS = 3

const FOUNDATION_COLOR = "bg-sky-50 text-sky-700 border-sky-200"
const CONTEXT_COLOR = "bg-emerald-50 text-emerald-700 border-emerald-200"
const APPLICATION_COLOR = "bg-amber-50 text-amber-700 border-amber-200"

type QuestionHistoryEntry = {
  id: string
  prompt: string
  correct: boolean
  selectedOption: string
  correctOption: string
  explanation: string
  tafsirGem: string
  reflection: string
  round: "foundation" | "context" | "application"
  xpEarned: number
  hasanatEarned: number
  usedReflection: boolean
  usedTafsirGem: boolean
}

function getRoundColor(round: TafsirTriviaQuestion["round"]): string {
  switch (round) {
    case "foundation":
      return FOUNDATION_COLOR
    case "context":
      return CONTEXT_COLOR
    case "application":
      return APPLICATION_COLOR
    default:
      return "bg-slate-100 text-slate-700 border-slate-200"
  }
}

export default function TafsirTriviaGamePage() {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [gameComplete, setGameComplete] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [hintVisible, setHintVisible] = useState(false)
  const [eliminatedOptionIds, setEliminatedOptionIds] = useState<string[]>([])
  const [reflectionActive, setReflectionActive] = useState(false)
  const [lifelines, setLifelines] = useState({ tafsirGem: 1, fiftyFifty: 1, reflection: 1 })
  const [usedGemThisQuestion, setUsedGemThisQuestion] = useState(false)
  const [usedReflectionThisQuestion, setUsedReflectionThisQuestion] = useState(false)

  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [hearts, setHearts] = useState(TOTAL_HEARTS)
  const [xp, setXp] = useState(0)
  const [hasanat, setHasanat] = useState(0)
  const [knowledgeScore, setKnowledgeScore] = useState(0)
  const [history, setHistory] = useState<QuestionHistoryEntry[]>([])

  const totalQuestions = tafsirTriviaDeck.length
  const currentQuestion = gameComplete ? null : tafsirTriviaDeck[questionIndex]

  const accuracy = useMemo(() => {
    if (history.length === 0) return 0
    const correctCount = history.filter((entry) => entry.correct).length
    return Math.round((correctCount / history.length) * 100)
  }, [history])

  const roundRoadmap = useMemo(() => {
    return tafsirTriviaRounds.map((round) => {
      const total = tafsirTriviaDeck.filter((question) => question.round === round.id).length
      const answered = history.filter((entry) => entry.round === round.id).length
      return {
        ...round,
        total,
        answered,
      }
    })
  }, [history])

  const questionProgress = useMemo(() => {
    if (gameComplete) return 100
    const completedCount = history.length
    return Math.round(((completedCount + (isSubmitted ? 1 : 0)) / totalQuestions) * 100)
  }, [gameComplete, history, isSubmitted, totalQuestions])

  const remainingThemes = useMemo(() => {
    if (!currentQuestion) return []
    return tafsirTriviaDeck.slice(questionIndex + 1).map((question) => ({
      id: question.id,
      theme: question.theme,
      round: question.round,
      ayahReference: question.ayahReference,
    }))
  }, [currentQuestion, questionIndex])

  const handleRevealTafsirGem = useCallback(() => {
    if (!currentQuestion || lifelines.tafsirGem <= 0 || hintVisible || isSubmitted) return
    setHintVisible(true)
    setLifelines((prev) => ({ ...prev, tafsirGem: prev.tafsirGem - 1 }))
    setUsedGemThisQuestion(true)
    setFeedback("A tafsir gem has been revealed. Reflect on how it guides your choice.")
  }, [currentQuestion, hintVisible, isSubmitted, lifelines.tafsirGem])

  const handleFiftyFifty = useCallback(() => {
    if (!currentQuestion || lifelines.fiftyFifty <= 0 || isSubmitted) return
    const availableWrongOptions = currentQuestion.options.filter(
      (option) => !option.isCorrect && !eliminatedOptionIds.includes(option.id),
    )
    if (availableWrongOptions.length === 0) return
    const shuffled = [...availableWrongOptions].sort(() => Math.random() - 0.5)
    const toEliminate = shuffled.slice(0, Math.min(2, shuffled.length)).map((option) => option.id)
    setEliminatedOptionIds((prev) => [...prev, ...toEliminate])
    setLifelines((prev) => ({ ...prev, fiftyFifty: prev.fiftyFifty - 1 }))
    setFeedback("Two challenging options faded away. Choose with confidence.")
  }, [currentQuestion, eliminatedOptionIds, isSubmitted, lifelines.fiftyFifty])

  const handleActivateReflection = useCallback(() => {
    if (!currentQuestion || lifelines.reflection <= 0 || reflectionActive || isSubmitted) return
    setReflectionActive(true)
    setUsedReflectionThisQuestion(true)
    setLifelines((prev) => ({ ...prev, reflection: prev.reflection - 1 }))
    setFeedback("Pause for reflection. Let the verse speak to your context before answering.")
  }, [currentQuestion, isSubmitted, lifelines.reflection, reflectionActive])

  const handleSubmit = useCallback(() => {
    if (!currentQuestion || !selectedOptionId || isSubmitted) return
    const selectedOption = currentQuestion.options.find((option) => option.id === selectedOptionId)
    if (!selectedOption) return

    const correctOption = currentQuestion.options.find((option) => option.isCorrect)
    const isCorrect = selectedOption.isCorrect

    const comboBonus = isCorrect ? combo * 6 : 0
    const reflectionBonus = isCorrect && usedReflectionThisQuestion ? 10 : 0
    const hintPenalty = isCorrect && usedGemThisQuestion ? 6 : 0
    const baseXp = isCorrect ? 40 : 12
    const baseHasanat = isCorrect ? 24 : 8

    const xpEarned = Math.max(8, baseXp + comboBonus + reflectionBonus - hintPenalty)
    const hasanatEarned = Math.max(
      6,
      baseHasanat + Math.floor(comboBonus / 2) + (usedReflectionThisQuestion ? 5 : 0) - Math.floor(hintPenalty / 2),
    )
    const knowledgeEarned = xpEarned + hasanatEarned

    if (isCorrect) {
      const updatedCombo = combo + 1
      const updatedStreak = streak + 1
      setCombo(updatedCombo)
      setBestCombo((prev) => Math.max(prev, updatedCombo))
      setStreak(updatedStreak)
      setBestStreak((prev) => Math.max(prev, updatedStreak))
      setFeedback("Excellent! Your tafsir intuition is sharpening.")
    } else {
      setCombo(0)
      setStreak(0)
      setHearts((prev) => Math.max(0, prev - 1))
      setFeedback("Let's review the insight and strengthen that connection.")
    }

    setXp((prev) => prev + xpEarned)
    setHasanat((prev) => prev + hasanatEarned)
    setKnowledgeScore((prev) => prev + knowledgeEarned)

    setHistory((prev) => [
      ...prev,
      {
        id: currentQuestion.id,
        prompt: currentQuestion.prompt,
        correct: isCorrect,
        selectedOption: selectedOption.text,
        correctOption: correctOption?.text ?? "",
        explanation: isCorrect ? selectedOption.rationale : correctOption?.rationale ?? "",
        tafsirGem: currentQuestion.tafsirGem,
        reflection: currentQuestion.reflection,
        round: currentQuestion.round,
        xpEarned,
        hasanatEarned,
        usedReflection: usedReflectionThisQuestion,
        usedTafsirGem: usedGemThisQuestion,
      },
    ])

    setIsSubmitted(true)
  }, [
    combo,
    currentQuestion,
    isSubmitted,
    selectedOptionId,
    streak,
    usedGemThisQuestion,
    usedReflectionThisQuestion,
  ])

  const handleNext = useCallback(() => {
    if (!isSubmitted) return

    if (questionIndex === totalQuestions - 1) {
      setGameComplete(true)
    } else {
      setQuestionIndex((prev) => prev + 1)
    }

    setSelectedOptionId(null)
    setIsSubmitted(false)
    setHintVisible(false)
    setEliminatedOptionIds([])
    setReflectionActive(false)
    setUsedGemThisQuestion(false)
    setUsedReflectionThisQuestion(false)
    setFeedback(null)
  }, [isSubmitted, questionIndex, totalQuestions])

  const resetGame = useCallback(() => {
    setQuestionIndex(0)
    setGameComplete(false)
    setSelectedOptionId(null)
    setIsSubmitted(false)
    setFeedback(null)
    setHintVisible(false)
    setEliminatedOptionIds([])
    setReflectionActive(false)
    setLifelines({ tafsirGem: 1, fiftyFifty: 1, reflection: 1 })
    setUsedGemThisQuestion(false)
    setUsedReflectionThisQuestion(false)
    setCombo(0)
    setBestCombo(0)
    setStreak(0)
    setBestStreak(0)
    setHearts(TOTAL_HEARTS)
    setXp(0)
    setHasanat(0)
    setKnowledgeScore(0)
    setHistory([])
  }, [])

  const roundBadge = (round: TafsirTriviaQuestion["round"]) => (
    <Badge variant="outline" className={`capitalize ${getRoundColor(round)}`}>
      {round}
    </Badge>
  )

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Link href="/games" className="inline-flex items-center gap-2 text-sm text-maroon-600 hover:text-maroon-800">
              <ArrowLeft className="h-4 w-4" /> Back to Habit Quest Arena
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-maroon-900">Tafsir Trivia Quest</h1>
              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">New</Badge>
            </div>
            <p className="text-maroon-700 max-w-2xl">
              Journey through three rounds of tafsir exploration. Decode vocabulary, uncover historical context, and translate
              each verse into actionable insight. Keep your streak alive to amplify the knowledge multiplier.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-maroon-100 bg-maroon-50/60 p-4 text-maroon-700">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4" /> Learning Goals
            </div>
            <ul className="text-sm space-y-1">
              <li>• Anchor tafsir concepts in vivid Qur&apos;anic themes.</li>
              <li>• Train reflective habits with guided prompts.</li>
              <li>• Earn hasanat streaks by answering with intention.</li>
            </ul>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <Card className="border-maroon-100">
              <CardHeader className="space-y-2">
                <CardTitle className="flex flex-wrap items-center gap-3 text-maroon-900">
                  <BookOpenCheck className="h-5 w-5 text-maroon-600" />
                  {gameComplete ? "Mastery Summary" : currentQuestion?.theme}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {gameComplete
                    ? "Review your tafsir journey, reflect on growth areas, and decide your next quest."
                    : currentQuestion?.learningTarget}
                </CardDescription>
                {!gameComplete && currentQuestion && (
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    {roundBadge(currentQuestion.round)}
                    <span className="inline-flex items-center gap-2">
                      <Compass className="h-4 w-4 text-maroon-500" /> {currentQuestion.ayahReference}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Target className="h-4 w-4 text-maroon-500" /> Question {questionIndex + 1} of {totalQuestions}
                    </span>
                  </div>
                )}
              </CardHeader>

              {!gameComplete && currentQuestion && (
                <>
                  <CardContent className="space-y-6">
                    <div className="rounded-xl border border-maroon-100 bg-maroon-50/40 p-5 space-y-3">
                      <p className="text-sm uppercase tracking-wide text-maroon-500 font-semibold">Verse spotlight</p>
                      <p className="text-2xl font-semibold text-maroon-900">{currentQuestion.excerpt}</p>
                      <p className="text-maroon-700">{currentQuestion.translation}</p>
                    </div>

                    <div className="space-y-4">
                      <p className="text-lg font-semibold text-maroon-900">{currentQuestion.prompt}</p>
                      <div className="space-y-3">
                        {currentQuestion.options.map((option, optionIndex) => {
                          const isEliminated = eliminatedOptionIds.includes(option.id)
                          const isActive = selectedOptionId === option.id
                          const isCorrectOption = isSubmitted && option.isCorrect
                          const isIncorrectSelection =
                            isSubmitted && option.id === selectedOptionId && !option.isCorrect

                          const baseClasses =
                            "w-full text-left rounded-xl border p-4 transition-all duration-200 shadow-sm focus:outline-none"
                          const inactiveClasses =
                            "bg-white hover:border-maroon-300 hover:shadow-md active:scale-[0.99]"
                          const activeClasses = "border-maroon-500 bg-maroon-50 ring-2 ring-maroon-200"
                          const correctClasses = "border-emerald-500 bg-emerald-50 text-emerald-700"
                          const incorrectClasses = "border-rose-500 bg-rose-50 text-rose-700"
                          const eliminatedClasses = "border-dashed border-gray-200 bg-gray-50/60 text-gray-400 cursor-not-allowed"

                          let className = `${baseClasses} ${inactiveClasses}`
                          if (isEliminated) {
                            className = `${baseClasses} ${eliminatedClasses}`
                          } else if (isCorrectOption) {
                            className = `${baseClasses} ${correctClasses}`
                          } else if (isIncorrectSelection) {
                            className = `${baseClasses} ${incorrectClasses}`
                          } else if (isActive) {
                            className = `${baseClasses} ${activeClasses}`
                          }

                          return (
                            <button
                              key={option.id}
                              type="button"
                              disabled={isSubmitted || isEliminated}
                              onClick={() => {
                                if (isSubmitted || isEliminated) return
                                setSelectedOptionId(option.id)
                                setFeedback(null)
                              }}
                              className={className}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <Badge variant="outline" className="mt-1 border-maroon-200 text-maroon-700">
                                    {String.fromCharCode(65 + optionIndex)}
                                  </Badge>
                                  <div className="space-y-1">
                                    <p className="font-medium text-maroon-900">{option.text}</p>
                                    {(isSubmitted || hintVisible) && option.rationale && (
                                      <p className="text-sm text-gray-600">{option.rationale}</p>
                                    )}
                                  </div>
                                </div>
                                {isCorrectOption && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                                {isIncorrectSelection && <XCircle className="h-5 w-5 text-rose-500" />}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {(hintVisible || isSubmitted) && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
                          <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                            <Lightbulb className="h-4 w-4" /> Tafsir Gem
                          </div>
                          <p className="text-sm text-emerald-800">{currentQuestion.tafsirGem}</p>
                          <p className="text-xs text-emerald-700/80">{currentQuestion.scholarVoice}</p>
                        </div>
                      )}
                      {(reflectionActive || isSubmitted) && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
                          <div className="flex items-center gap-2 text-amber-700 font-semibold">
                            <Brain className="h-4 w-4" /> Reflection Prompt
                          </div>
                          <p className="text-sm text-amber-800">{currentQuestion.reflection}</p>
                        </div>
                      )}
                    </div>

                    {feedback && (
                      <div className="rounded-xl border border-maroon-200 bg-maroon-50/80 p-4 text-sm text-maroon-700">
                        {feedback}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-gray-600">
                      {isSubmitted
                        ? "Explore the tafsir explanation before moving forward."
                        : "Choose the insight that aligns most with the scholars' commentary."}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isSubmitted ? (
                        <Button
                          onClick={handleSubmit}
                          disabled={!selectedOptionId}
                          className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0"
                        >
                          Lock in answer
                        </Button>
                      ) : (
                        <Button
                          onClick={handleNext}
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0"
                        >
                          {questionIndex === totalQuestions - 1 ? "View mastery summary" : "Next verse challenge"}
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </>
              )}

              {gameComplete && (
                <CardContent className="space-y-6">
                  <div className="rounded-xl border border-maroon-100 bg-white p-5 space-y-3">
                    <p className="text-sm uppercase tracking-wide text-maroon-500 font-semibold">Achievement unlocked</p>
                    <h2 className="text-2xl font-bold text-maroon-900">Tafsir Trailblazer</h2>
                    <p className="text-maroon-700">
                      You explored {totalQuestions} verses, activating hope, context, and application. Keep journaling your
                      reflections to transform knowledge into steady action.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                        <Trophy className="h-4 w-4" /> Performance Highlights
                      </div>
                      <ul className="text-sm text-emerald-800 space-y-1">
                        <li>Knowledge Score: {knowledgeScore} pts</li>
                        <li>Accuracy: {accuracy}%</li>
                        <li>Best Streak: {bestStreak} in a row</li>
                      </ul>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-amber-700 font-semibold">
                        <ListChecks className="h-4 w-4" /> Suggested Next Steps
                      </div>
                      <ul className="text-sm text-amber-800 space-y-1">
                        <li>Revisit two journal prompts that stirred the most emotion.</li>
                        <li>Share one tafsir gem with a study partner today.</li>
                        <li>Queue up a related habit quest to reinforce application.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-maroon-700">
                      <BookOpenCheck className="h-4 w-4" /> Reflection Journal
                    </div>
                    <ScrollArea className="h-64 rounded-xl border border-maroon-100 bg-white p-4">
                      <div className="space-y-4 text-sm">
                        {history.map((entry) => (
                          <div key={entry.id} className="rounded-lg border border-maroon-100 bg-maroon-50/50 p-4 space-y-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-maroon-600 font-semibold">
                              {roundBadge(entry.round)}
                              <span>{entry.correct ? "✔ Insight captured" : "✦ Insight to revisit"}</span>
                              <span>{entry.xpEarned} XP • {entry.hasanatEarned} hasanat</span>
                            </div>
                            <p className="font-medium text-maroon-900">{entry.prompt}</p>
                            <p className="text-maroon-700">Your response: {entry.selectedOption}</p>
                            {!entry.correct && (
                              <p className="text-sm text-gray-600">
                                Correct focus: <span className="font-semibold text-maroon-700">{entry.correctOption}</span>
                              </p>
                            )}
                            <p className="text-sm text-gray-700">{entry.explanation}</p>
                            <p className="text-xs text-emerald-700">{entry.tafsirGem}</p>
                            <p className="text-xs text-amber-700">{entry.reflection}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              )}

              {gameComplete && (
                <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button asChild variant="outline">
                    <Link href="/games">Return to Games Hub</Link>
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={resetGame} className="gap-2 text-maroon-700">
                      <RotateCcw className="h-4 w-4" /> Replay challenge
                    </Button>
                    <Button className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0" asChild>
                      <Link href="/habits">Stack a habit quest</Link>
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>

            {!gameComplete && (
              <Card className="border-maroon-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-maroon-900">
                    <Brain className="h-5 w-5 text-maroon-600" /> Power-ups & Lifelines
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Use them wisely—each support shapes your final score and reflection depth.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TooltipProvider>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex h-full flex-col items-start gap-2 rounded-xl border-maroon-200 p-4 text-left"
                            onClick={handleRevealTafsirGem}
                            disabled={lifelines.tafsirGem === 0 || hintVisible || isSubmitted}
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="font-semibold text-maroon-700">Tafsir Gem</span>
                              <Badge variant="secondary">{lifelines.tafsirGem}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              Reveal a scholar&apos;s insight. Minor XP penalty, major clarity boost.
                            </p>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-sm">
                          Unlock a classical tafsir highlight to guide your choice. Best for nuanced verses.
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex h-full flex-col items-start gap-2 rounded-xl border-maroon-200 p-4 text-left"
                            onClick={handleFiftyFifty}
                            disabled={lifelines.fiftyFifty === 0 || isSubmitted}
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="font-semibold text-maroon-700">Option Filter</span>
                              <Badge variant="secondary">{lifelines.fiftyFifty}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              Remove two distractors. Ideal when choices feel equally strong.
                            </p>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-sm">
                          Clears away two incorrect options to help you focus on the most accurate tafsir.
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex h-full flex-col items-start gap-2 rounded-xl border-maroon-200 p-4 text-left"
                            onClick={handleActivateReflection}
                            disabled={lifelines.reflection === 0 || reflectionActive || isSubmitted}
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="font-semibold text-maroon-700">Reflection Pause</span>
                              <Badge variant="secondary">{lifelines.reflection}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              Unlock a journaling cue and bonus hasanat when answered correctly.
                            </p>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-sm">
                          Activate a guided reflection to deepen application. Earn bonus hasanat when you answer right.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-maroon-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-maroon-900">
                  <Flame className="h-5 w-5 text-orange-500" /> Scoreboard
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Maintain your streak to unlock higher multipliers and knowledge combos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-maroon-100 bg-maroon-50/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-maroon-500 font-semibold">Knowledge score</p>
                    <p className="text-2xl font-bold text-maroon-900">{knowledgeScore}</p>
                    <p className="text-xs text-maroon-600">XP {xp} • Hasanat {hasanat}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold">Streak</p>
                    <p className="text-2xl font-bold text-emerald-700">{streak}</p>
                    <p className="text-xs text-emerald-600">Best {bestStreak}</p>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-amber-600 font-semibold">Combo</p>
                    <p className="text-2xl font-bold text-amber-700">{combo}</p>
                    <p className="text-xs text-amber-600">Peak {bestCombo}</p>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-gray-600">
                    <span>Journey progress</span>
                    <span>{questionProgress}% complete</span>
                  </div>
                  <Progress value={questionProgress} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="flex items-center gap-2">
                    Hearts
                    <span className="flex items-center gap-1">
                      {Array.from({ length: TOTAL_HEARTS }).map((_, index) => (
                        <HeartPulse
                          key={index}
                          className={`h-4 w-4 ${index < hearts ? "text-rose-500" : "text-gray-300"}`}
                        />
                      ))}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">Accuracy {accuracy}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-maroon-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-maroon-900">
                  <Target className="h-5 w-5 text-maroon-600" /> Round Roadmap
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Track how each tafsir dimension is unfolding across the session.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {roundRoadmap.map((round) => (
                  <div key={round.id} className="rounded-xl border border-maroon-100 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-maroon-700">
                        {roundBadge(round.id)}
                        <span>{round.title}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {round.answered}/{round.total} complete
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{round.description}</p>
                    <Progress value={(round.answered / round.total) * 100} className="mt-3 h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {!gameComplete && remainingThemes.length > 0 && (
              <Card className="border-maroon-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-maroon-900">
                    <Lightbulb className="h-5 w-5 text-amber-500" /> Upcoming themes
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Preview the focus of upcoming ayat to prime your mindset.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-700">
                  {remainingThemes.map((theme) => (
                    <div key={theme.id} className="rounded-lg border border-maroon-100 bg-maroon-50/40 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-maroon-800">{theme.theme}</span>
                        {roundBadge(theme.round)}
                      </div>
                      <p className="mt-1 text-xs text-gray-600">{theme.ayahReference}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
