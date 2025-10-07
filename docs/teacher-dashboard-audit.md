# Teacher Dashboard Operationalization Plan

## Phase 1 · Inventory of Mock or Incomplete Elements

### Header & Global Context
- **Static teacher identity** – Name, honorific, and mastery badge are hardcoded to “Ustadh Muhammad Al-Rashid” / “Master Teacher” instead of reflecting the authenticated instructor. → *Untracked*.
- **Global summary source** – Dashboard calls `getInstructorDashboardSummary("teacher_001")`, bypassing session context and real data freshness. → *Untracked* and *Orphaned* (requires session-aware data access).

### Quick Stats & Gamification Insights
- Counts (total students, active today, completed assignments, average progress, gamification metrics) are single snapshot values without refresh, loading, or error states. → *Partially wired* (reads seed data only) and missing live updates.

### Overview → Recent Assignments
- Assignment cards pull from seed data and expose only a “View” link with no navigation or detail context. Buttons lack click handlers and there is no empty state. → *Partially wired* for data; *Non-functional* actions.

### Overview → Quick Actions & Schedule
- Quick action buttons route to generic pages but do not pre-filter or maintain dashboard context. “View Full Schedule” button has no destination handler. Schedule items are hardcoded strings. → *Untracked* and *Non-functional*.

### Assignments Tab
- Mirrors recent assignments list with static progress math. “View Details”, “Send Reminder”, and “Edit” buttons have no handlers. No pagination, filters, or creation feedback. → *Partially wired* data; *Non-functional* controls.

### Students Tab
- Student cards show summary metrics but “View Profile” and “Send Message” buttons do nothing. No drill-down to student timeline, attendance, or feedback threads. → *Partially wired*; actions are *Non-functional*.

### Analytics Tab
- Engagement and performance metrics are entirely static values (e.g., 75%, 89%) without source linkage. → *Untracked* mock data.
- “Top Performers” reuses `studentProgress` slice and does not sync with actual class filters. → *Partially wired* and missing cross-context state.

### Cross-cutting UX gaps
- No loading, error, or empty states anywhere in the dashboard.
- Tabs are client-only state; no routing/deep links. Selected tab does not persist across refresh or navigation. → *Untracked* global context.
- No permission or observability hooks; actions cannot be audited.

## Phase 2 · End-to-End Behavior Definitions

### Authentication & Context Banner
- **Intent**: Show instructor identity, role, and quick status.
- **Data**: `GET /api/session` → `{ userId, name, role, badges[] }`.
- **State**: Global session context via `useUser()` provider; refresh on focus.
- **Feedback**: Skeleton state while loading; error toast if session invalid; ARIA live region announcing updates.

### Class & Gamification Summaries
- **Intent**: Provide actionable overview of cohort health.
- **Data**: `GET /api/teacher/dashboard/summary` → `{ classStats, gamification, trend }` aggregated on the server with last-updated timestamps.
- **State**: Cached via SWR/React Query with stale-while-revalidate; auto-refresh on visibility change or via WebSocket `dashboard.summary.updated` event.
- **Mutations**: Bulk actions (e.g., mark attendance) trigger `PATCH` → optimistic update; errors roll back with toast + retry.
- **Feedback**: Metric cards display loading shimmer, change indicators (▲▼), and accessible descriptions.

### Recent Assignments Module
- **Intent**: Let teachers jump into grading pipeline.
- **Data**: `GET /api/teacher/assignments?status=active&limit=5` returning `{ id, title, dueDate, classId, submittedCount, totalCount, status }`.
- **State**: Local filter state; global selection persists via router query (`?tab=overview&assignmentId=...`).
- **Actions**:
  - **View** → navigate to `/teacher/assignments/[id]` with preserved tab and filter.
  - **Send Reminder** → `POST /api/teacher/assignments/{id}/reminders` with toast + audit log.
  - **Edit** → open modal backed by `PATCH` endpoint, optimistic updates, and validation errors displayed inline.
- **Feedback**: Loading skeleton rows, empty-state illustration with CTA to create assignment, success toasts, aria-live updates.

### Quick Actions & Schedule Widget
- **Intent**: Accelerate common flows.
- **Data**: Dynamic schedule from `GET /api/teacher/schedule?date=today` with slots `{ id, className, start, end, joinUrl }`.
- **State**: Local filter for day/week; caching keyed by date.
- **Actions**: “View Full Schedule” navigates to `/teacher/classes?schedule=today`. Each slot supports “Start Session” (opens meeting link) and marks attendance.
- **Feedback**: Loading placeholders, empty message, error fallback with retry.

### Assignment Management Tab
- **Intent**: Manage lifecycle of assignments.
- **Data**: `GET /api/teacher/assignments` with pagination, filters (`status`, `classId`, `dateRange`). Response includes progress analytics.
- **State**: Global filters stored in URL/query params; data fetched via React Query.
- **Mutations**: `PATCH` for updates, `DELETE` for archive, `POST` for reminders; integrate optimistic updates.
- **Feedback**: Table virtualization for long lists, inline validation, toast notifications, undo for destructive actions.

### Student Progress Tab
- **Intent**: Identify at-risk students and follow up.
- **Data**: `GET /api/teacher/students?classId=` returning roster with KPIs `{ id, name, avatar, progress, streak, lastActive, recitationAccuracy, alerts[] }`.
- **State**: Global selected class; local expand/collapse state per student.
- **Actions**: “View Profile” → `/teacher/students/[id]` with performance timeline; “Send Message” opens communication drawer hitting `POST /api/messages`.
- **Feedback**: Risk badges, color-coded alerts, inline message success, accessible modals.

### Analytics Tab
- **Intent**: Surface actionable trends.
- **Data**: `GET /api/teacher/analytics?range=week` delivering chart data arrays for engagement, completion, accuracy; `GET /api/teacher/top-performers` tied to filters.
- **State**: Date range filter persisted globally; charts update via WebSocket `analytics.updated` events.
- **Feedback**: Loading skeleton charts, empty states, accessible chart summaries.

### Notifications & Observability
- Hook into `useTeacherNotifications()` retrieving unread counts via `GET /api/teacher/notifications`. Mark-as-read triggers `PATCH` and updates badges instantly.
- Emit analytics events (`teacher.dashboard.viewed`, `teacher.assignment.reminder_sent`) through instrumentation layer.

## Phase 3 · System Integration Blueprint

1. **Client hooks**
   - `useTeacherDashboardSummary(teacherId)` – wraps SWR/React Query around summary endpoint with WebSocket integration.
   - `useTeacherAssignments(filters)` – handles pagination, mutations, and optimistic updates.
   - `useTeacherSchedule(date)` – fetches schedule, exposes mutation to mark sessions complete.
   - `useTeacherStudents(classId)` – returns roster, risk flags, and messaging helpers.
   - `useTeacherNotifications()` – syncs notification state and audit logs.

2. **API service layer**
   - `/api/teacher/dashboard/summary` (GET) – aggregates class stats, gamification, alerts.
   - `/api/teacher/assignments` (GET/POST); `/api/teacher/assignments/[id]` (GET/PATCH/DELETE); `/api/teacher/assignments/[id]/reminders` (POST).
   - `/api/teacher/students` (GET) with filter & pagination; `/api/teacher/students/[id]/messages` (POST) for outreach.
   - `/api/teacher/schedule` (GET) & `/api/teacher/schedule/[id]/attendance` (PATCH).
   - `/api/teacher/analytics` (GET) & `/api/teacher/top-performers` (GET).
   - Employ middleware guard ensuring `role === "teacher"` and scope to teacher’s classes.

3. **Routing & deep links**
   - Use parallel routes like `/teacher/dashboard?tab=students&class=alpha` for persistence.
   - Provide nested routes for assignment review: `/teacher/dashboard/class/[classId]/assignment/[assignmentId]`.

4. **State synchronization**
   - Centralize teacher context in `UserProvider` to expose class list, permissions, feature flags.
   - Implement cache invalidation after any mutation (`queryClient.invalidateQueries(['teacher-dashboard-summary'])`).
   - Integrate WebSocket channel (`/realtime/teacher/{id}`) to broadcast updates across tabs/devices.

5. **Observability & accessibility**
   - Add structured logging on API handlers with action + actor metadata.
   - Instrument client actions via analytics dispatcher.
   - Ensure buttons have descriptive `aria-label`s, dynamic counts announce via `aria-live`, and focus is trapped within modals.

## Phase 4 · Validation Checklist

- **Functional Integrity**: Cypress specs covering assignment reminder flow, student messaging, schedule attendance, and analytics filter updates.
- **Data Fidelity**: Contract tests verifying API responses mirror database records; snapshot tests on computed stats.
- **User Autonomy**: Confirm undo for destructive actions, autosave draft states, and persistence on navigation.
- **Zero Mock Remnants**: CI lint to reject TODO/mock markers; visual regression ensures placeholders removed.
- **Cross-Context Consistency**: Integration test ensures roster metrics align with analytics view.
- **Performance**: Validate list virtualization, memoized selectors, and chart lazy loading; track load times via Core Web Vitals.

## Implementation Mandate
> "The Teacher Dashboard is not a report—it’s a command center for pedagogy. Every number must be actionable, every button must have consequence, and every state must be truthful. If a teacher sees a red alert for low participation, they must be able to act on it in one click. If they grade a paper, the student’s view must update instantly. Eliminate every trace of fiction. This dashboard must breathe with the rhythm of real teaching."

This roadmap converts the existing mock-driven dashboard into a cohesive, reactive system aligned with authentic teacher workflows and data-driven decision making.
