# TarteelAI Repository Audit

This document captures a high-level study of the public repositories under the [TarteelAI](https://github.com/TarteelAI) organization. It highlights how each codebase can inform ongoing work on the AlFawz Qur'an Institute Platform, with special emphasis on typography fidelity and mobile-first tajweed tutoring.

## Surveyed Repositories

| Repository | Focus | Integration Notes |
| --- | --- | --- |
| `quran-ttx` | TTX exports of Mushaf page font files for precise glyph outlines. | Bundle the TTX/TTF assets into `public/mushaf-fonts/` and load them via `next/font/local` to render calligraphically accurate pages while overlaying SVG/CSS tajweed markers. |
| `quran-assets` | Centralized Quranic assets: text, translations, recitation audio metadata. | Map relevant JSON exports into the existing `data/` directory to enrich surah/ayah metadata, tajweed annotations, and audio playback manifests. |
| `quranic-universal-library` | Rails CMS that curates Quranic content, permissions, and versioning. | Reference its role/permission model to design admin tooling for tajweed review workflows or community contributions. |
| `tarteel-ml` | Machine learning pipelines for recitation quality analysis, dataset preparation, and experimentation. | Port preprocessing scripts (`download.py`, `generate_csv_deepspeech.py`, etc.) into a data engineering job queue so recorded sessions can be auto-labeled for tajweed mistakes. |
| `tarteel-mobile` | React Native app (Expo) providing the production recitation client with microphone capture and in-session feedback. | Use its Expo configuration and microphone handling components as a starting point for a cross-platform tajweed tutor with live speech scoring. |
| `react-native-microphone-stream` | Low-latency microphone streaming utility for React Native. | Mirror its ring buffer approach in a web microphone hook (via Web Audio API) so browser recitations can stream to inference services with minimal lag. |
| `tkseem` | Arabic tokenization toolkit with configurable granularities. | Apply its tokenization rules when aligning recognized phonemes with tajweed rules for precise mistake localization. |
| `tnkeeh` | Arabic text normalization helpers (diacritics, digits, segmentation). | Integrate into preprocessing jobs so transcripts stay consistent across dialects and script variants. |
| `tarteel-app` | Next.js/React front-end for Tarteel’s web experience. | Borrow UI patterns for responsive recitation dashboards, recording states, and correction timelines. |

## Presentation & Accessibility Enhancements

- **High-fidelity Mushaf typography** – Distribute the Mushaf TTF-to-TTX exports from `quran-ttx` inside the Next.js `public/` directory and register them with `next/font/local`. Render surah pages using CSS grid that aligns with the glyph coordinates while layering tajweed color coding and mistake markers above the base text. This maintains the calligraphic fidelity of the Madani Mushaf while enabling interactive overlays.
- **Mobile-first recitation client** – Scaffold an Expo-based client by reusing `tarteel-mobile`'s navigation, authentication flow, and microphone session management. Embed the `react-native-microphone-stream` module to capture live audio buffers, feed them into a websocket/HTTP streaming endpoint, and surface speech feedback (confidence scores, tajweed hints) in real time.

### Implementation Status

- ✅ Added `npm run fonts:mushaf` to sync representative `quran-ttx` exports into `public/fonts/mushaf/` with conversion guidance. The reader now swaps to the Mushaf font stack (with tajweed overlays) when the converted assets are present.
- ✅ Introduced a mobile HUD (`<MobileRecitationClient />`) that mirrors the Expo microphone controls with live volume pulses, tajweed cue summaries, and permission/error messaging.

## Tracking Follow-up Work

1. **Asset ingestion** – Create a task to import prioritized fonts and Quranic datasets into version control, confirming licensing alignment (see `quran-ttx` README for copyright).
2. **Microphone streaming prototype** – Schedule a spike to replicate the mobile microphone streaming pattern inside the web client (`useUser` context can hold session stats while streaming).
3. **Model integration roadmap** – Document dependencies from `tarteel-ml`, `tkseem`, and `tnkeeh` in the engineering tracker so the backend/service owners can plan preprocessing infrastructure.
4. **UX parity checklist** – Compare the `tarteel-app` responsive layouts with current `app/` routes to ensure the Habit Quest and recitation dashboards remain mobile friendly.

Maintaining this audit alongside sprint planning keeps the Tarteel-derived enhancements visible, testable, and incrementally deliverable.
