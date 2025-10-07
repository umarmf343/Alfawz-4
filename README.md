# AlFawz Qur'an Institute Platform

AlFawz is an immersive Next.js platform for Qur'an study that blends AI-assisted recitation tools with habit-forming game mechanics. This repository contains the front-end experience, including dashboards for students, teachers, and administrators.

## Key Enhancements

- **Default user system** – A client-side provider supplies realistic profile, subscription, and progress data for the demo experience. Components can access the user context through the `useUser` hook to render personalized information and update statistics safely.
- **Habit Quest Arena** – A dedicated habit-building game (`/habits`) lets learners complete themed quests, earn XP/hasanat, and track weekly streaks with a tactile UI inspired by RPG dashboards.
- **Premium feature gating** – The reusable `<PremiumGate />` component visually locks advanced cards (e.g., AI Tajweed Coach, advanced analytics) until the user upgrades. It is tightly integrated with the user provider so the “Unlock Premium” action immediately updates the interface.
- **Toast notifications & feedback** – Completing a habit fires polished toasts so learners receive instant encouragement and guidance while experimenting locally.
- **Mushaf typography pipeline** – The reader now loads high-fidelity Madinah Mushaf outlines sourced from TarteelAI’s `quran-ttx` exports. A helper script (`npm run fonts:mushaf`) fetches the latest TTX files and the reader layers tajweed or mistake overlays above the glyphs.
- **Mobile-first recitation client** – A compact microphone HUD modeled after the Expo `tarteel-mobile` client guides smartphone learners with live volume feedback, tajweed cues, and permission warnings.
- **Tarteel ML integration dashboard** – The admin panel now fetches live metadata, script availability, and requirements straight from [tarteel-ml](https://github.com/TarteelAI/tarteel-ml) so ops teams can verify preprocessing pipelines without leaving the platform.

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) with the App Router
- **Language:** TypeScript + React 18
- **Styling:** Tailwind CSS v4 + shadcn/ui component primitives
- **Icons:** [lucide-react](https://lucide.dev/)
- **State Management:** Custom React context (`UserProvider`) + hooks

## Project Structure

```
app/
  ├─ layout.tsx           # Root layout with providers & global styles
  ├─ page.tsx             # Marketing landing page
  ├─ dashboard/           # Student dashboard
  ├─ habits/              # Habit Quest Arena (new)
  ├─ billing/             # Subscription management
  ├─ ...
components/
  ├─ user-provider.tsx    # Default user system & habit logic
  ├─ premium-gate.tsx     # Premium locking overlay
  ├─ navigation.tsx       # Sidebar updated with live user info
  ├─ app-layout.tsx       # Layout shell with navigation
  └─ ui/                  # shadcn/ui primitives
hooks/
  ├─ use-user.ts          # Helper hook for user context
  └─ use-toast.ts         # Toast manager for in-app notifications
```

## Getting Started

### Prerequisites

Set up the following tools before working with the project locally:

- **Node.js** `>= 18.18.0` – aligns with the version required by the Next.js runtime.
- **npm** `>= 10.0.0` – used for dependency management and scripts.
- **Git** – to clone the repository and manage version control.
- **Python 3 + FontTools (optional)** – only needed when you want to fetch and convert the Madinah Mushaf font assets (see [Mushaf font assets](#mushaf-font-assets-from-quran-ttx)).

Verify your Node.js and npm versions:

```bash
node -v
npm -v
```

### Local development

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-org>/Alfawz-4.git
   cd Alfawz-4
   ```
2. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```
   Fill in the required keys listed in [Environment variables](#environment-variables) before running the app.
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **(Optional) Sync Mushaf fonts** – run this if you want the high-fidelity Mushaf reader locally.
   ```bash
   npm run fonts:mushaf
   ```
5. **Start the development server**
   ```bash
   npm run rundev
   ```
   The application will be available at `http://localhost:3001`.
6. **Run lint checks (optional but recommended)**
   ```bash
   npm run lint
   ```

### Mushaf font assets (from `quran-ttx`)

High-fidelity Madinah Mushaf outlines are not stored in the repository. Fetch and convert them locally before running the reader:

1. Download the latest TTX exports from TarteelAI by running:
   ```bash
   npm run fonts:mushaf
   ```
   The script saves representative pages into `public/fonts/mushaf/manifest.json`.
2. Install [FontTools](https://fonttools.readthedocs.io/) if you have not already:
   ```bash
   pip install fonttools
   ```
3. Convert the TTX files into browser formats (repeat for additional pages as required):
   ```bash
   ttx -f -o public/fonts/mushaf/mushaf-madinah.ttf public/fonts/mushaf/QCF_P001.ttx
   ttx -f -o public/fonts/mushaf/mushaf-madinah.woff2 -t woff2 public/fonts/mushaf/mushaf-madinah.ttf
   ```
4. Restart the dev server so the new fonts are picked up. The reader automatically switches to the Mushaf typography when the converted files are present.

### Environment variables

Copy the provided `.env.example` into a new `.env.local` file before running the API routes. The key settings are:

- `NEXT_PUBLIC_APP_URL` – The public URL of the site (used for callback URLs).
- `PAYSTACK_SECRET_KEY` – Secret key from your Paystack dashboard for initializing payments and verifying webhooks.
- `TARTEEL_API_KEY` – Tarteel transcription API key used to transcribe recitations.

### cPanel deployment notes

1. Build the production bundle locally:
   ```bash
   npm run build
   ```
2. Upload the `.next/standalone`, `.next/static`, `public`, and `package.json` directories/files to your cPanel Node.js application directory.
3. Copy your `.env.local` (or set environment variables through the cPanel UI) alongside the uploaded files.
4. Configure the application start command in cPanel to `npm run start:standalone` (which runs `node .next/standalone/server.js`). This uses Next.js' standalone output so only production dependencies are required.
5. Restart the application from the cPanel dashboard whenever you push an updated build.

## Default User System

- Wrapped around the entire app via `UserProvider` (`components/user-provider.tsx`).
- Exposes profile, stats, habit quests, perks, and subscription status.
- Provides helper actions:
  - `completeHabit(habitId)` – Updates streaks, XP, hasanat, and weekly progress with intelligent rules.
  - `upgradeToPremium()` / `downgradeToFree()` – Toggle plan instantly and re-render gated UI.
- Consumers access the data using the `useUser()` hook.

### Example

```tsx
import { useUser } from "@/hooks/use-user"

const { profile, stats, completeHabit } = useUser()
```

### Demo data reference

On first load the platform seeds a rich learner profile so every dashboard view feels realistic. The default records live in
`lib/data/teacher-database.ts` and are summarized below. To sign in manually, use any of the seeded credentials from
`lib/data/auth.ts` – the default session picks the student account automatically:

- **Student dashboard:** `ahmad@example.com` / `student123`
- **Teacher dashboard:** `kareem@alfawz.example` / `teacher123`
- **Parent portal:** `parent@example.com` / `parent123`
- **Admin console:** `admin@example.com` / `admin123`

- **Learner:** Ahmad Al-Hafiz (`user_001`, `ahmad@example.com`) on the **free** plan with locale `en-US`.
- **Core stats:** 1,247 hasanat, level 8 (3,400 XP with 500 XP to next level), seven-day streak, 342 ayahs read, and 135 study minutes this week.
- **Habits in progress:**
  - *Daily Recitation Quest* (medium) – level 3, streak 6, progress 40%, rewards 60 XP / 45 hasanat per completion.
  - *Memorization Review* (hard) – level 2, streak 4, progress 60%, rewards 75 XP / 60 hasanat.
  - *Reflection Journal* (easy) – level 2, streak 3, progress 10%, rewards 40 XP / 30 hasanat.
- **Dashboard snapshot:** Daily target of 10 ayahs (4 already completed today), last read at Surah Al-Baqarah ayah 156, featured habit set to Daily Recitation, and active goals such as completing Surah Al-Mulk and memorising five new ayahs.
- **Instructor context:**
  - `teacher_001` – Ustadh Kareem (Tajweed lead).
  - `teacher_002` – Ustadha Maryam (Memorization mentor).
  - Both teachers have existing feedback notes, assignments, and review queues tied to Ahmad’s profile so recitation and memorisation panels render populated states.

Use this reference when exploring or extending the UI so you know which default entities and IDs are already available for mocks, tests, or premium-gating flows.

## Habit Quest Arena (Game Loop)

Navigate to `/habits` from the sidebar to experience the gamified flow:

- Choose among curated quests (recitation, memorization review, reflection journal).
- View detailed quest dashboards, daily targets, and streak history.
- Click **“Complete today’s quest”** to trigger `completeHabit` – XP, hasanat, and streaks update live and a toast celebrates the action.
- Weekly progress cards visualize completion momentum for the selected habit.
- Reward & perk sidebars summarize benefits and prompt premium upgrades for deeper analytics.

## Premium Feature Gating

Use the `<PremiumGate>` wrapper to protect premium-only features. Example usage from the dashboard:

```tsx
<PremiumGate featureName="AI Tajweed Coach" description="Unlock instant pronunciation scoring.">
  <Card>...premium content...</Card>
</PremiumGate>
```

When the current plan is `free`, the gate blurs the child, surfaces locked perks, and provides an upgrade CTA. After `upgradeToPremium()` runs, the premium UI becomes fully interactive.

## Testing & Quality

- `npm run lint` – Ensures the codebase adheres to lint rules and catches TypeScript issues.
- UI feedback relies on the built-in toast system (`<Toaster />` is mounted globally), so no extra setup is required to observe habit completion events.

## Contributing

1. Fork/clone the repository.
2. Create feature branches as needed (e.g., `git checkout -b feature/habit-rewards`).
3. Run `npm run lint` before committing.
4. Open a pull request describing changes and screenshots if UI adjustments are visible.

## License

This project is provided under the MIT License. See [`LICENSE`](LICENSE) if present, or consult the project owner for specific distribution terms.
