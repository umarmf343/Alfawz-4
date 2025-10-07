# Feature Ideas Inspired by TarteelAI Projects

> For a catalog of the source repositories and integration touchpoints, see [`tarteelai_repo_audit.md`](./tarteelai_repo_audit.md).

## Quran Reading & Tajweed Data Infrastructure
- **Centralized Quranic asset CMS** – Mirror QUL's Rails-powered admin that handles translations, tafsir text, Arabic scripts (ayah-by-ayah and word-by-word), Mushaf layouts, grammar/morphology datasets, and detailed version history to curate Tajweed annotations and reading plans collaboratively.【06f0ee†L1-L66】
- **Audio segment management** – Adopt QUL's tooling for uploading both ayah-by-ayah and gapless recitations, defining precise segment metadata, and exporting datasets to power verse-level playback, tajweed highlights, or mistake-replay workflows.【06f0ee†L24-L42】
- **User roles and permissions** – Use QUL's role-based access control to gate sensitive tajweed review tasks (e.g., scholar approval of correction rules) while enabling crowd contributions with audit trails.【06f0ee†L36-L41】

## Speech Capture & Streaming
- **Real-time microphone streaming** – Integrate the `react-native-microphone-stream` pattern for low-latency audio buffers, enabling live recitation monitoring and server-side tajweed analysis during a session.【1a8c5b†L1-L23】
- **Cross-platform speech recognition hooks** – Embed `@react-native-voice/voice` to start/stop recognition, surface partial/final transcripts, monitor volume, and react to errors for responsive correction prompts as the user reads.【45332e†L1-L132】

## Recitation Accuracy & Correction Detection
- **Dataset preparation scripts** – Follow `tarteel-ml` utilities (`download.py`, `create_train_test_split.py`, `generate_csv_deepspeech.py`) to assemble labeled recitation corpora for training mistake-detection or tajweed-classification models.【6dbea5†L1-L49】
- **Alphabet and ayah vocabulary generation** – Use `generate_alphabet|vocabulary.py` style workflows to create canonical symbol sets for alignment between audio transcripts and tajweed rules.【6dbea5†L27-L39】
- **Experimentation wiki** – Maintain living documentation like Tarteel-ML's wiki to standardize preprocessing pipelines and evaluation methods for correction-detection experiments.【6dbea5†L41-L48】

## Arabic Text Processing Pipeline
- **Tokenization toolkit** – Employ `tkseem`'s configurable tokenizers (word, character, SentencePiece, disjoint letter) with caching and model persistence to tokenize Quranic text for tajweed rule tagging or error localization.【fae98a†L1-L80】
- **Cleaning & normalization utilities** – Integrate `tnkeeh`'s diacritic removal, segmentation, digit normalization, and dataset splitting helpers to prepare clean training/evaluation corpora without manual regex management.【fce734†L1-L62】

## Presentation & Accessibility Enhancements
- **High-fidelity Mushaf typography** – Bundle Mushaf TTF-to-TTX exports (as in `quran-ttx`) to render calligraphically accurate pages while layering tajweed color-coding or mistake markers above the glyph outlines.【2c8099†L1-L3】
- **Mobile-first recitation client** – Reference the Expo/React Native setup from the Tarteel mobile app to accelerate building a cross-platform tajweed tutor with live microphone access and speech feedback.【bf5be9†L1-L18】【8334ae†L1-L17】

## Next Steps
1. Prioritize which content management capabilities are required for your tajweed/correction workflow and map them to QUL equivalents.
2. Prototype a React Native recitation screen that streams microphone audio, invokes speech recognition, and logs transcripts for offline error analysis.
3. Start curating a labeled dataset (audio + text + tajweed rule violations) using the Tarteel-ML preprocessing stack, coupled with `tkseem`/`tnkeeh` cleaning routines.
4. Define a roadmap for integrating Mushaf-accurate typography and permissioned review flows before scaling to broader beta testers.
