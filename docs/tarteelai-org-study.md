# TarteelAI Organization Study

This brief maps the public repositories published under the [TarteelAI GitHub organization](https://github.com/TarteelAI) and highlights assets that support automated recitation accuracy and correction-detection experiments.

## Repository Landscape

| Repository | Focused capability | Primary tech | Stars (approx.) | Latest update |
|------------|--------------------|--------------|-----------------|---------------|
| `tarteel-app` | Production web client that surfaces Tarteel's recitation feedback and premium features. | JavaScript (Next.js/React) | 43 | 2025-09-01 |
| `tarteel-ml` | Core machine-learning toolkit for preprocessing, dataset assembly, model training, and experiment orchestration. | Python & Jupyter | 210 | 2025-10-05 |
| `tarteel-mobile` | React Native/Expo mobile application published to the iOS and Android stores. | JavaScript | 20 | 2025-05-16 |
| `voice` | Standalone React Native speech-to-text bridge leveraged inside Tarteel mobile clients. | Objective-C & Java | 8 | 2025-08-04 |
| `quran-ttx` | Typography resources (TTX extractions) for Mushaf typefaces used to align visual tajweed cues. | Shell | 4 | 2025-07-02 |

*Stars and last-update timestamps come directly from the GitHub REST API at the time of writing to aid release tracking.*

### Notable feature spotlights

- **`tarteel-app`** – Hosts the marketing site and authenticated recitation experience. The README links to the public mobile listings and explains the Expo-driven installation workflow, underscoring that the client is React Native first-party friendly.
- **`tarteel-ml`** – Bundles turnkey scripts to fetch the recitation corpus, normalize metadata, create DeepSpeech-compatible manifests, and iterate on tajweed experiments via notebooks and documentation.
- **`tarteel-mobile`** – Shares Expo configuration, store badges, and instructions for setting up the native build pipeline required for QA on devices.
- **`voice`** – Provides the speech recognition bridge (`React Native Voice`) that powers live feedback in the mobile app, and advertises its CI, npm distribution, and Discord support channels.
- **`quran-ttx`** – Supplies Mushaf fonts exported to TTX so downstream apps can render tajweed glyphs consistently.

## Recitation Accuracy & Correction-Detection Workflow

The `tarteel-ml` repository remains the canonical toolkit for preparing supervised data and training tajweed mistake-detection models. The following sequence keeps a correction-detection experiment reproducible and fully tracked:

1. **Bootstrap the raw audio/text corpus**
   - Use `download.py` to retrieve Tarteel V1 audio for specific surahs or the entire dataset, with caching and resumable downloads to minimize redundant bandwidth.
   - Maintain the downloaded archives under versioned storage (e.g., object storage buckets with lifecycle policies) and log the commit SHA of `download.py` used for provenance.
2. **Construct stratified dataset splits**
   - Run `create_train_test_split.py` against the consolidated Quran text to generate CSV manifests with the default 60/20/20 split. Override the random seed or split ratios in reproducible experiment configs and record them in your ML tracking system.
   - Persist split artefacts (train/test/validation) in object storage and register them inside your experiment tracker (e.g., MLflow, Weights & Biases).
3. **Emit DeepSpeech-formatted metadata**
   - Execute `generate_csv_deepspeech.py` to build train/validation/test CSV files that pair wav filepaths, byte sizes, and transcripts. The script encapsulates default split fractions and handles dataset shuffling with scikit-learn utilities.
   - Archive the generated CSVs alongside the audio to guarantee downstream models receive the same alignments.
4. **Synchronize alphabet and vocabulary references**
   - Produce canonical symbol sets with `generate_alphabet.py`, iterating across every surah/ayah to capture unique characters used in the Quranic script.
   - Create ayah-level transcripts using `generate_vocabulary.py`, which writes one ayah per line. Store both outputs in source control (or dataset versioning tools like DVC) so alignment between transcripts and tajweed rule mappings stays auditable.
5. **Document experiments continuously**
   - Mirror Tarteel-ML's practice of keeping wikis or `/docs` folders up to date with preprocessing steps, hyperparameters, evaluation metrics, and qualitative notes. Link each experiment log back to the exact dataset artefacts and script commit SHAs used above.

## Operational Tracking Checklist

To keep the ecosystem functional and observable:

- **Repository health monitoring** – Subscribe to releases or push events on the five core repositories above so regressions in shared libraries (e.g., `voice`) are surfaced quickly.
- **Automated verification** – Configure CI pipelines that execute linting/tests referenced in each README (Expo builds for mobile, Node lint/test suites for `tarteel-app`, unit tests for `tarteel-ml`). Surface build status in dashboards used by the AlFawz platform team.
- **Dependency auditing** – Periodically scan the JavaScript and Python projects for vulnerable dependencies, capturing reports in the tracking system to ensure remediation is scheduled.
- **Experiment registry** – When launching new correction-detection studies, register datasets, scripts, model checkpoints, and evaluation reports with unique IDs so future audits can reproduce results end-to-end.

This overview should equip the team to engage with TarteelAI's public assets, extend recitation accuracy research, and maintain traceability across experiments and deployments.
