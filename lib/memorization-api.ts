export interface MemorizationClassSummary {
  id: string
  name: string
  description?: string
  teacherId: string
  schedule?: string
}

export interface MemorizationHistoryEntryDTO {
  verseKey: string
  repetitions: number
  completedAt: string
}

export interface MemorizationPlanDTO {
  id: string
  title: string
  verseKeys: string[]
  teacherId: string
  classIds: string[]
  createdAt: string
  notes?: string
}

export interface TeacherSummaryDTO {
  id: string
  name: string
  email: string
  role: string
  specialization?: string
}

export interface StudentPlanProgressDTO {
  studentId: string
  planId: string
  currentVerseIndex: number
  repetitionsDone: number
  totalRepetitions: number
  startedAt: string
  updatedAt: string
  lastRepetitionAt: string | null
  completedAt: string | null
  history: MemorizationHistoryEntryDTO[]
}

export interface StudentMemorizationPlanContextDTO {
  plan: MemorizationPlanDTO
  progress: StudentPlanProgressDTO
  classes: MemorizationClassSummary[]
  teacher?: TeacherSummaryDTO
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? ""
  const isJson = contentType.includes("application/json")
  if (!response.ok) {
    if (isJson) {
      const errorBody = await response.json().catch(() => undefined)
      const message = typeof errorBody?.error === "string" ? errorBody.error : response.statusText
      throw new Error(message || "Unexpected error")
    }
    throw new Error(response.statusText || "Unexpected error")
  }
  if (!isJson) {
    throw new Error("Unexpected response format")
  }
  return (await response.json()) as T
}

export async function fetchStudentMemorizationPlans(): Promise<StudentMemorizationPlanContextDTO[]> {
  const response = await fetch("/api/student/memorization-plans", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  })
  const data = await parseResponse<{ plans: StudentMemorizationPlanContextDTO[] }>(response)
  return data.plans
}

export async function fetchMemorizationPlanContext(planId: string): Promise<StudentMemorizationPlanContextDTO> {
  const response = await fetch(`/api/memorization/current-plan/${encodeURIComponent(planId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  })
  const data = await parseResponse<{ plan: StudentMemorizationPlanContextDTO }>(response)
  return data.plan
}

export async function recordMemorizationRepetition(planId: string): Promise<StudentPlanProgressDTO> {
  const response = await fetch("/api/memorization/record-repetition", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId }),
  })
  const data = await parseResponse<{ progress: StudentPlanProgressDTO }>(response)
  return data.progress
}

export async function advanceMemorizationVerse(planId: string): Promise<StudentPlanProgressDTO> {
  const response = await fetch("/api/memorization/advance-verse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId }),
  })
  const data = await parseResponse<{ progress: StudentPlanProgressDTO }>(response)
  return data.progress
}
