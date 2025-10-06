import {
  createLearnerAccount,
  getLearnerIdByEmail,
  getLearnerProfile,
  type CreateLearnerInput,
  type SubscriptionPlan,
  type UserRole,
} from "./teacher-database"

export interface AuthSession {
  userId: string
  role: UserRole
  email: string
}

interface CredentialRecord {
  userId: string
  email: string
  passwordHash: string
  role: UserRole
}

interface DefaultUserDefinition {
  id?: string
  name: string
  email: string
  password: string
  role: UserRole
  plan?: SubscriptionPlan
  locale?: string
}

export interface CreateAccountInput extends CreateLearnerInput {
  password: string
  createdBy?: "self" | "admin" | "system"
}

const credentialStore = new Map<string, CredentialRecord>()

let activeSession: AuthSession | null = null

const DEFAULT_USERS: DefaultUserDefinition[] = [
  {
    name: "Ahmad Al-Hafiz",
    email: "ahmad@example.com",
    password: "student123",
    role: "student",
    id: "user_001",
    plan: "free",
  },
  {
    name: "Ustadh Kareem",
    email: "kareem@alfawz.example",
    password: "teacher123",
    role: "teacher",
    id: "teacher_001",
    plan: "premium",
  },
  {
    name: "Fatimah Al-Amin",
    email: "parent@example.com",
    password: "parent123",
    role: "parent",
    id: "parent_001",
  },
  {
    name: "System Administrator",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
    id: "admin_001",
    plan: "premium",
  },
]

const DEFAULT_REDIRECTS: Record<UserRole, string> = {
  student: "/dashboard",
  teacher: "/teacher/dashboard",
  parent: "/progress",
  admin: "/admin",
}

const DEFAULT_STUDENT_EMAIL = "ahmad@example.com"

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function hashPassword(email: string, password: string): string {
  const normalizedEmail = normalizeEmail(email)
  const salted = `${normalizedEmail}::${password}`
  let hash = 0
  for (let index = 0; index < salted.length; index += 1) {
    const charCode = salted.charCodeAt(index)
    hash = (hash << 5) - hash + charCode
    hash |= 0
  }
  return `h${(hash >>> 0).toString(16)}`
}

function storeCredentials(record: CredentialRecord) {
  credentialStore.set(normalizeEmail(record.email), record)
}

function createAccountRecord(input: CreateAccountInput): CredentialRecord {
  const email = input.email.trim()
  if (!email) {
    throw new Error("Email is required")
  }

  const password = input.password
  if (!password) {
    throw new Error("Password is required")
  }

  const normalizedEmail = normalizeEmail(email)

  if (credentialStore.has(normalizedEmail)) {
    throw new Error("An account with this email already exists")
  }

  if (getLearnerIdByEmail(normalizedEmail)) {
    throw new Error("An account with this email already exists")
  }

  const learnerState = createLearnerAccount({
    id: input.id,
    name: input.name,
    email: email,
    role: input.role,
    locale: input.locale,
    plan: input.plan,
    joinedAt: input.joinedAt,
  })

  const passwordHash = hashPassword(normalizedEmail, password)

  const record: CredentialRecord = {
    userId: learnerState.profile.id,
    email: learnerState.profile.email,
    passwordHash,
    role: learnerState.profile.role,
  }

  storeCredentials(record)

  return record
}

function ensureDefaultUsers() {
  DEFAULT_USERS.forEach((user) => {
    const normalizedEmail = normalizeEmail(user.email)
    if (credentialStore.has(normalizedEmail)) {
      return
    }

    let learnerId = getLearnerIdByEmail(normalizedEmail)

    if (!learnerId) {
      const state = createLearnerAccount({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        locale: user.locale,
      })
      learnerId = state.profile.id
    }

    const profile = getLearnerProfile(learnerId)
    if (!profile) {
      return
    }

    const passwordHash = hashPassword(normalizedEmail, user.password)

    storeCredentials({
      userId: profile.id,
      email: profile.email,
      passwordHash,
      role: profile.role,
    })
  })
}

ensureDefaultUsers()

function createDefaultSession(): AuthSession | null {
  const credential = credentialStore.get(normalizeEmail(DEFAULT_STUDENT_EMAIL))
  if (!credential) {
    return null
  }
  const profile = getLearnerProfile(credential.userId)
  if (!profile) {
    return null
  }
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

export function signInWithEmail(email: string, password: string): AuthSession {
  const normalizedEmail = normalizeEmail(email)
  const credentials = credentialStore.get(normalizedEmail)
  if (!credentials) {
    throw new Error("Invalid email or password")
  }

  const computedHash = hashPassword(normalizedEmail, password)
  if (computedHash !== credentials.passwordHash) {
    throw new Error("Invalid email or password")
  }

  const profile = getLearnerProfile(credentials.userId)
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

export function registerUserAccount(input: CreateAccountInput): AuthSession {
  const record = createAccountRecord({ ...input, createdBy: "self" })
  const profile = getLearnerProfile(record.userId)
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

export function createUserAccount(input: CreateAccountInput): CredentialRecord {
  return createAccountRecord({ ...input, createdBy: input.createdBy ?? "admin" })
}

export function getDefaultRedirect(role: UserRole): string {
  return DEFAULT_REDIRECTS[role] ?? "/dashboard"
}

export function signOut(): void {
  activeSession = null
}
