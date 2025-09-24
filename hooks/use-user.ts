"use client"

import { useUserContext } from "@/components/user-provider"

export function useUser() {
  return useUserContext()
}
