export type RecitationPipelineStage = {
  id: string
  title: string
  description: string
  owner: string
  status: "green" | "amber" | "red"
  completion: number
  lastRun: string
  scripts: Array<{
    name: string
    path: string
    status: "ready" | "needs_attention" | "in_progress"
  }>
  blockers?: string[]
}

export type RecitationExperiment = {
  id: string
  name: string
  dataset: string
  model: string
  metric: string
  value: string
  status: "training" | "deployed" | "queued"
  owner: string
  notes?: string
}

export type RecitationMonitor = {
  id: string
  title: string
  metric: string
  target: string
  status: "success" | "warning" | "error"
  trend: string
  description: string
}

export type RecitationOpsOverview = {
  summary: {
    labeledHours: number
    accuracy: number
    flaggedSessions: number
    wikiUpdatedAt: string
  }
  corpusBreakdown: Array<{
    locale: string
    hours: number
    percentage: number
  }>
  pipeline: RecitationPipelineStage[]
  experiments: RecitationExperiment[]
  monitors: RecitationMonitor[]
  alerts: Array<{
    id: string
    title: string
    severity: "low" | "medium" | "high"
    timestamp: string
    description: string
    resolved: boolean
  }>
}

export function getRecitationOpsOverview(): RecitationOpsOverview {
  return {
    summary: {
      labeledHours: 182.4,
      accuracy: 0.91,
      flaggedSessions: 8,
      wikiUpdatedAt: "2024-06-12T09:45:00Z",
    },
    corpusBreakdown: [
      { locale: "Hafs - Nigeria", hours: 88.6, percentage: 48 },
      { locale: "Warsh - Morocco", hours: 42.1, percentage: 23 },
      { locale: "IndoPak", hours: 28.4, percentage: 16 },
      { locale: "Kids / Beginner", hours: 23.3, percentage: 13 },
    ],
    pipeline: [
      {
        id: "ingestion",
        title: "Dataset Ingestion",
        description:
          "Pulls verified recitation submissions into the labeling workspace and syncs annotations to the central corpus.",
        owner: "Fatimah Idris",
        status: "green",
        completion: 82,
        lastRun: "2024-06-13 02:15 WAT",
        scripts: [
          { name: "download.py", path: "tarteel-ml/utils/download.py", status: "ready" },
          { name: "create_train_test_split.py", path: "tarteel-ml/utils/create_train_test_split.py", status: "ready" },
          { name: "generate_csv_deepspeech.py", path: "tarteel-ml/utils/generate_csv_deepspeech.py", status: "ready" },
        ],
      },
      {
        id: "vocab",
        title: "Alphabet & Ayah Vocabulary",
        description:
          "Generates canonical symbol sets so Tarteel timestamps align with tajwīd rule evaluations for each ayah.",
        owner: "Nurideen Musa",
        status: "amber",
        completion: 64,
        lastRun: "2024-06-12 17:40 WAT",
        scripts: [
          { name: "generate_alphabet.py", path: "tarteel-ml/ops/generate_alphabet.py", status: "ready" },
          { name: "generate_vocabulary.py", path: "tarteel-ml/ops/generate_vocabulary.py", status: "needs_attention" },
        ],
        blockers: [
          "Pending review of new tajwīd articulation labels for kids track",
          "Need to update stop-word list for IndoPak pronunciations",
        ],
      },
      {
        id: "alignment",
        title: "Transcription Alignment",
        description:
          "Runs forced alignment, computes per-token tajwīd deviations, and stores highlights for playback overlays.",
        owner: "Rahmah Suleiman",
        status: "green",
        completion: 71,
        lastRun: "2024-06-13 03:05 WAT",
        scripts: [
          { name: "align_segments.py", path: "ops/alignment/align_segments.py", status: "in_progress" },
          { name: "score_tajweed.py", path: "ops/analysis/score_tajweed.py", status: "ready" },
        ],
      },
      {
        id: "experiments",
        title: "Mistake Detection Experiments",
        description:
          "Train and evaluate correction detection models; publish metrics to the experimentation wiki for reproducibility.",
        owner: "Dr. Kareem",
        status: "green",
        completion: 58,
        lastRun: "2024-06-11 20:55 WAT",
        scripts: [
          { name: "train_detector.py", path: "experiments/detectors/train_detector.py", status: "in_progress" },
          { name: "evaluate_detector.py", path: "experiments/detectors/evaluate_detector.py", status: "ready" },
        ],
        blockers: [
          "GPU queue saturated during taraweeh uploads",
        ],
      },
    ],
    experiments: [
      {
        id: "tajweed-detector-v06",
        name: "Tajwīd Deviation Detector v0.6",
        dataset: "Ramadan-2024-labeled",
        model: "Conformer + CRF",
        metric: "F1",
        value: "0.87",
        status: "training",
        owner: "Rahmah Suleiman",
        notes: "Pending calibration on IndoPak dialect samples.",
      },
      {
        id: "accuracy-scorer-v11",
        name: "Recitation Accuracy Scorer v1.1",
        dataset: "Core-Combined-Train",
        model: "BiLSTM-CTC",
        metric: "WER",
        value: "8.4%",
        status: "deployed",
        owner: "Dr. Kareem",
        notes: "Production scorer in Lagos region; next step is autoscaling workers.",
      },
      {
        id: "tajweed-audit-v02",
        name: "Tajwīd Rule Audit Automation",
        dataset: "Weekly-Spot-Checks",
        model: "Rule-based + LLM",
        metric: "Precision",
        value: "0.92",
        status: "queued",
        owner: "Fatimah Idris",
      },
    ],
    monitors: [
      {
        id: "latency",
        title: "Average Tarteel Latency",
        metric: "78s",
        target: "≤ 90s",
        status: "success",
        trend: "-6% vs last week",
        description: "Queue depth stable after adding 2 more GPU workers.",
      },
      {
        id: "alignment-coverage",
        title: "Alignment Coverage",
        metric: "91%",
        target: "≥ 95%",
        status: "warning",
        trend: "-2% vs last week",
        description: "Most misses occur on IndoPak submissions with low audio gain.",
      },
      {
        id: "correction-precision",
        title: "Correction Detection Precision",
        metric: "0.89",
        target: "≥ 0.9",
        status: "warning",
        trend: "+1% vs last week",
        description: "Precision improving after vocabulary refresh; monitor recall next cycle.",
      },
    ],
    alerts: [
      {
        id: "alert-001",
        title: "Vocabulary sync pending",
        severity: "medium",
        timestamp: "2024-06-12 18:10 WAT",
        description: "Alphabet generator flagged new ghunnah label; requires review before deploy.",
        resolved: false,
      },
      {
        id: "alert-002",
        title: "Annotation backlog cleared",
        severity: "low",
        timestamp: "2024-06-11 10:45 WAT",
        description: "All 64 outstanding corrections verified and merged into corpus.",
        resolved: true,
      },
    ],
  }
}
