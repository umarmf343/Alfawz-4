import { getLearnerIdByEmail, getLearnerProfile, type UserRole } from "./teacher-database"

export interface AuthSession {
  userId: string
  role: UserRole
  email: string
}

let activeSession: AuthSession | null = null

function createDefaultSession(): AuthSession | null {
  const defaultUserId = getLearnerIdByEmail("ahmad@example.com")
  if (!defaultUserId) return null
  const profile = getLearnerProfile(defaultUserId)
  if (!profile) return null
  return {
    userId: profile.id,
    role: profile.role,
    email: profile.email,
  }
}

export function getActiveSession(): AuthSession | null {
  if (!activeSession) {
    activeSession = createDefaultSession()
  }
  return activeSession
}

export function signInWithEmail(email: string): AuthSession {
  const learnerId = getLearnerIdByEmail(email)
  if (!learnerId) {
    throw new Error("Invalid credentials")
  }
  const profile = getLearnerProfile(learnerId)
  if (!profile) {
    throw new Error("Unable to load learner profile")
  }
  activeSession = {
    userId: profile.id,
    role: profile.role,
    email: profile.email,
  }
  return activeSession
}

export function signOut(): void {
  activeSession = null
}
