"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { useUser } from "@/hooks/use-user"
import { Crown, Lock, Sparkles } from "lucide-react"

interface PremiumGateProps {
  featureName: string
  description?: string
  children: ReactNode
}

export function PremiumGate({ featureName, description, children }: PremiumGateProps) {
  const { isPremium, upgradeToPremium, lockedPerks } = useUser()

  if (isPremium) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-60 blur-[1px]">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full rounded-2xl border border-maroon-200 bg-white/95 backdrop-blur-sm shadow-xl p-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-maroon-50 px-4 py-1 text-xs font-semibold text-maroon-700">
            <Crown className="h-4 w-4 text-maroon-500" />
            Premium Feature Locked
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-maroon-900">{featureName}</h3>
            {description ? <p className="text-sm text-maroon-600">{description}</p> : null}
          </div>
          {lockedPerks.length > 0 ? (
            <ul className="mx-auto max-w-md space-y-2 text-left text-xs text-maroon-600">
              {lockedPerks.slice(0, 3).map((perk) => (
                <li key={perk} className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 text-yellow-500" />
                  <span>{perk}</span>
                </li>
              ))}
              <li className="flex items-start gap-2 text-maroon-500/80">
                <Lock className="mt-0.5 h-4 w-4" />
                <span>and more premium boosts to elevate your Qur'an journey.</span>
              </li>
            </ul>
          ) : null}
          <Button
            onClick={upgradeToPremium}
            className="w-full bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0"
          >
            Unlock Premium Access
          </Button>
          <p className="text-xs text-maroon-500">
            Upgrade to activate this feature instantly across your dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
