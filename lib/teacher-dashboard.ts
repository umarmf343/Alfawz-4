import {
  getInstructorDashboardSummary,
  getLearnerStats,
  getTeacherProfile,
  listClassesForTeacher,
  listStudentsForTeacher,
  listTeacherAssignments,
  listTeacherRecitationTasks,
  type AssignmentWithStats,
  type InstructorAssignmentSummary,
  type InstructorDashboardSummary,
  type TeacherClassSummary,
  type TeacherRecitationTaskSummary,
  type TeacherRole,
  type TeacherStudentSummary,
} from "@/lib/data/teacher-database"
import type { RecitationTaskStatus } from "@/lib/data/teacher-database"

export interface TeacherUpcomingSession {
  id: string
  studentId: string
  studentName: string
  title: string
  dueDate: string
  status: RecitationTaskStatus
  isOverdue: boolean
}

export interface TeacherDashboardAnalytics {
  dailyActivePercentage: number
  assignmentSubmissionRate: number
  pendingReviewRate: number
  averageStudyMinutes: number
  averageRecitationScore: number
  memorizationAverage: number
  pendingReviewCount: number
  reviewedCount: number
}

export type TeacherDashboardAssignmentSummary = InstructorAssignmentSummary & {
  studentId?: string
  studentName?: string
}

export interface TeacherDashboardSnapshot {
  teacher: {
    id: string
    name: string
    role: TeacherRole
    specialization?: string
  }
  summary: InstructorDashboardSummary
  recentAssignments: TeacherDashboardAssignmentSummary[]
  assignments: AssignmentWithStats[]
  recitationTasks: TeacherRecitationTaskSummary[]
  students: TeacherStudentSummary[]
  classes: TeacherClassSummary[]
  classDirectory: Record<string, string>
  studentDirectory: Record<string, { name: string; email: string }>
  upcomingSessions: TeacherUpcomingSession[]
  analytics: TeacherDashboardAnalytics
}

function computeUpcomingSessions(tasks: TeacherRecitationTaskSummary[]): TeacherUpcomingSession[] {
  const now = Date.now()
  return tasks
    .map((task) => {
      const due = new Date(task.dueDate)
      const dueTime = due.getTime()
      if (Number.isNaN(dueTime)) {
        return null
      }
      return {
        id: task.id,
        studentId: task.studentId,
        studentName: task.studentName,
        title: `${task.surah} • ${task.ayahRange}`,
        dueDate: task.dueDate,
        status: task.status,
        isOverdue: dueTime < now && task.status !== "reviewed",
      }
    })
    .filter((session): session is TeacherUpcomingSession => Boolean(session))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5)
}

function computeAnalytics(
  summary: InstructorDashboardSummary,
  tasks: TeacherRecitationTaskSummary[],
  students: TeacherStudentSummary[],
): TeacherDashboardAnalytics {
  const totalStudents = summary.classStats.totalStudents
  const dailyActivePercentage =
    totalStudents === 0
      ? 0
      : Math.round((summary.classStats.activeStudents / totalStudents) * 100)

  const totalTasks = tasks.length
  const submittedTasks = tasks.filter((task) => task.status !== "assigned").length
  const pendingReviewCount = tasks.filter((task) => task.status === "submitted").length
  const reviewedCount = tasks.filter((task) => task.status === "reviewed").length

  const assignmentSubmissionRate =
    totalTasks === 0 ? 0 : Math.round((submittedTasks / totalTasks) * 100)
  const pendingReviewRate =
    totalTasks === 0 ? 0 : Math.round((pendingReviewCount / totalTasks) * 100)

  const recitationScores = tasks
    .map((task) => task.lastScore)
    .filter((score): score is number => typeof score === "number" && !Number.isNaN(score))
  const averageRecitationScore =
    recitationScores.length === 0
      ? 0
      : Math.round(recitationScores.reduce((total, score) => total + score, 0) / recitationScores.length)

  const memorizationAverage =
    summary.studentProgress.length === 0
      ? 0
      : Math.round(
          summary.studentProgress.reduce((total, student) => total + student.progress, 0) /
            summary.studentProgress.length,
        )

  const totalStudyMinutes = students.reduce((total, student) => {
    const stats = getLearnerStats(student.id)
    return total + (stats?.studyMinutes ?? 0)
  }, 0)
  const averageStudyMinutes =
    students.length === 0 ? 0 : Math.round(totalStudyMinutes / students.length)

  return {
    dailyActivePercentage,
    assignmentSubmissionRate,
    pendingReviewRate,
    averageStudyMinutes,
    averageRecitationScore,
    memorizationAverage,
    pendingReviewCount,
    reviewedCount,
  }
}

export function getTeacherDashboardSnapshot(teacherId: string): TeacherDashboardSnapshot {
  const summary = getInstructorDashboardSummary(teacherId)
  const assignments = listTeacherAssignments(teacherId)
  const recitationTasks = listTeacherRecitationTasks(teacherId)
  const students = listStudentsForTeacher(teacherId)
  const classes = listClassesForTeacher(teacherId)
  const teacherProfile = getTeacherProfile(teacherId)

  const classDirectory = Object.fromEntries(classes.map((classRecord) => [classRecord.id, classRecord.name]))
  const studentDirectory = Object.fromEntries(
    students.map((student) => [student.id, { name: student.name, email: student.email }]),
  )

  const recentAssignments: TeacherDashboardAssignmentSummary[] = summary.recentAssignments.map((assignment) => {
    const relatedTask = recitationTasks.find((task) => task.id === assignment.id)
    return {
      ...assignment,
      studentId: relatedTask?.studentId,
      studentName: relatedTask?.studentName,
    }
  })

  return {
    teacher: {
      id: teacherProfile?.id ?? teacherId,
      name: teacherProfile?.name ?? "Instructor",
      role: teacherProfile?.role ?? "head",
      specialization: teacherProfile?.specialization,
    },
    summary,
    recentAssignments,
    assignments,
    recitationTasks,
    students,
    classes,
    classDirectory,
    studentDirectory,
    upcomingSessions: computeUpcomingSessions(recitationTasks),
    analytics: computeAnalytics(summary, recitationTasks, students),
  }
}
