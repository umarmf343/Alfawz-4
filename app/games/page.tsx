"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Sparkles, Zap, Shield, Target, Gamepad2, Trophy } from "lucide-react"

import AppLayout from "@/components/app-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useUser } from "@/hooks/use-user"

export default function GamesHubPage() {
  const { dashboard } = useUser()
  const gamePanel = dashboard?.gamePanel

  const tasks = useMemo(() => gamePanel?.tasks ?? [], [gamePanel?.tasks])
  const boosts = useMemo(() => gamePanel?.boosts ?? [], [gamePanel?.boosts])

  return (
    <AppLayout>
      <div className="p-6 space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wider text-maroon-500 font-semibold">Habit Quest Arena</p>
            <h1 className="text-3xl font-bold text-maroon-900 mt-1">Select your next challenge</h1>
            <p className="text-maroon-700 mt-2 max-w-2xl">
              Earn XP, protect your streak shield, and boost your hasanat by completing immersive Qur&apos;anic learning quests.
              Each mission is crafted by your teachers to strengthen recitation, memorization, and daily discipline.
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-3 py-2 text-sm flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            Season {gamePanel?.season.level ?? 1}
          </Badge>
        </header>

        {gamePanel && (
          <Card className="bg-gradient-to-br from-maroon-600 to-maroon-700 text-white border-0 shadow-xl">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-300" />
                  Season Progress
                </CardTitle>
                <CardDescription className="text-white/80">
                  {gamePanel.season.name} • Ends {new Date(gamePanel.season.endsOn).toLocaleDateString()}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="text-right">
                  <p className="uppercase text-white/60 tracking-wide text-xs">XP</p>
                  <p className="text-lg font-semibold">{gamePanel.season.xp} / {gamePanel.season.xpToNext}</p>
                </div>
                <Progress className="h-2 w-40 bg-white/20" value={Math.min(100, Math.round((gamePanel.season.xp / Math.max(gamePanel.season.xpToNext, 1)) * 100))} />
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              <div className="rounded-lg bg-white/10 p-4">
                <p className="text-xs uppercase text-white/70">Streak Shield</p>
                <p className="text-2xl font-semibold">{gamePanel.streak.current} days</p>
                <p className="text-sm text-white/70">Best streak {gamePanel.streak.best} days</p>
              </div>
              <div className="rounded-lg bg-white/10 p-4">
                <p className="text-xs uppercase text-white/70">Energy</p>
                <p className="text-2xl font-semibold">{gamePanel.energy.current}/{gamePanel.energy.max}</p>
                <p className="text-sm text-white/70">Refreshed {new Date(gamePanel.energy.refreshedAt).toLocaleTimeString()}</p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 space-y-2">
                <p className="text-xs uppercase text-white/70">Active boosts</p>
                {boosts.length > 0 ? (
                  boosts.map((boost) => (
                    <div
                      key={boost.id}
                      className={`rounded-md border px-3 py-2 text-xs ${boost.active ? "bg-emerald-500/20 border-emerald-200 text-emerald-100" : "bg-white/10 border-white/20 text-white/70"}`}
                    >
                      <p className="font-semibold">{boost.name}</p>
                      <p>{boost.description}</p>
                      {boost.expiresAt && <p className="text-[11px] mt-1 text-white/60">Expires {new Date(boost.expiresAt).toLocaleTimeString()}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-white/70">No boosts unlocked yet. Complete quests to earn buffs.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-2xl font-semibold text-maroon-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-maroon-600" /> Active quests
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4 text-green-600" />
              Rewards refresh daily based on your teacher&apos;s plan.
            </div>
          </div>
          <Separator />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {tasks.map((task) => {
              const completionPercent = task.target > 0 ? Math.min(100, Math.round((task.progress / task.target) * 100)) : 0
              const isCompleted = task.status === "completed"

              return (
                <Card key={task.id} className="h-full flex flex-col border-maroon-100 shadow-md">
                  <CardHeader className="space-y-2">
                    <Badge variant="outline" className="w-fit bg-maroon-50 text-maroon-700 border-maroon-200">
                      {task.type === "habit" && "Daily Quest"}
                      {task.type === "recitation" && "Boss Battle"}
                      {task.type === "memorization" && "Memory Sprint"}
                      {task.type === "daily_target" && "Streak Shield"}
                    </Badge>
                    <CardTitle className="text-xl text-maroon-900">{task.title}</CardTitle>
                    <CardDescription className="text-gray-600">{task.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    <div>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>
                          {task.progress}/{task.target} steps
                        </span>
                        <span>
                          +{task.xpReward} XP • +{task.hasanatReward} hasanat
                        </span>
                      </div>
                      <Progress value={completionPercent} className="h-2" />
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {isCompleted ? "Reward granted" : "Tap to enter the quest arena"}
                      </div>
                      <Button asChild variant={isCompleted ? "secondary" : "default"} className={isCompleted ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0"}>
                        <Link href={`/games/${task.id}`}>
                          {isCompleted ? "Review quest" : "Continue"}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {tasks.length === 0 && (
              <Card className="border-dashed border-maroon-200 bg-maroon-50/60 text-maroon-700">
                <CardContent className="py-12 text-center space-y-3">
                  <Sparkles className="h-8 w-8 mx-auto text-maroon-400" />
                  <p className="font-semibold">No quests available yet</p>
                  <p className="text-sm text-maroon-600">
                    Check back soon! Your teachers will unlock new challenges to keep your journey engaging.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-maroon-900 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" /> How to earn max rewards
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-maroon-100">
              <CardHeader>
                <CardTitle className="text-lg text-maroon-800">Complete daily quests</CardTitle>
                <CardDescription>Finish all four missions to trigger the 2x XP bonus.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-maroon-100">
              <CardHeader>
                <CardTitle className="text-lg text-maroon-800">Maintain the streak shield</CardTitle>
                <CardDescription>Keep your daily target intact to protect bonus multipliers.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-maroon-100">
              <CardHeader>
                <CardTitle className="text-lg text-maroon-800">Unlock boosts</CardTitle>
                <CardDescription>Boosts refresh every weekend—redeem them by completing boss battles.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
