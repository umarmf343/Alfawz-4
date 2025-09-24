# AlFawz Qur'an Institute Platform

AlFawz is an immersive Next.js platform for Qur'an study that blends AI-assisted recitation tools with habit-forming game mechanics. This repository contains the front-end experience, including dashboards for students, teachers, and administrators.

## Key Enhancements

- **Default user system** – A client-side provider supplies realistic profile, subscription, and progress data for the demo experience. Components can access the user context through the `useUser` hook to render personalized information and update statistics safely.
- **Habit Quest Arena** – A dedicated habit-building game (`/habits`) lets learners complete themed quests, earn XP/hasanat, and track weekly streaks with a tactile UI inspired by RPG dashboards.
- **Premium feature gating** – The reusable `<PremiumGate />` component visually locks advanced cards (e.g., AI Tajweed Coach, advanced analytics) until the user upgrades. It is tightly integrated with the user provider so the “Unlock Premium” action immediately updates the interface.
- **Toast notifications & feedback** – Completing a habit fires polished toasts so learners receive instant encouragement and guidance while experimenting locally.

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

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Start the development server**
   ```bash
   npm run rundev
   ```
   Visit `http://localhost:3000` to explore the dashboards and Habit Quest Arena.
3. **Run lint checks**
   ```bash
   npm run lint
   ```

### Environment variables

Copy the provided `.env.example` into a new `.env.local` file before running the API routes. The key settings are:

- `NEXT_PUBLIC_APP_URL` – The public URL of the site (used for callback URLs).
- `PAYSTACK_SECRET_KEY` – Secret key from your Paystack dashboard for initializing payments and verifying webhooks.
- `OPENAI_API_KEY` – Whisper API key used to transcribe recitations.

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
