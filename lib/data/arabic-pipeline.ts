import { randomUUID } from "crypto"

export type TokenizerMode = "word" | "character" | "sentencepiece" | "disjoint_letter"

export interface TokenizerConfig {
  id: string
  name: string
  mode: TokenizerMode
  library: "tkseem"
  modelPath: string
  cachePath: string
  isTrained: boolean
  description: string
  examples: string[]
  updatedAt: string
  version: string
}

export type NormalizationOperation =
  | "remove_diacritics"
  | "normalize_digits"
  | "segment_harakat"
  | "standardize_tatweel"
  | "clean_punctuation"

export interface NormalizationRoutine {
  id: string
  name: string
  library: "tnkeeh"
  operations: NormalizationOperation[]
  description: string
  enabled: boolean
  lastRunAt: string
  datasetCount: number
}

export type PipelineStageStatus = "idle" | "running" | "healthy" | "warning"

export interface PipelineStage {
  id: string
  name: string
  description: string
  status: PipelineStageStatus
  lastRunAt: string
  processedAyat: number
  avgLatencyMs: number
  successRate: number
  linkedTokenizerIds: string[]
  linkedRoutineIds: string[]
}

export interface PipelineRun {
  id: string
  stageId: string
  startedAt: string
  finishedAt: string
  processedSamples: number
  errorCount: number
  cacheHitRate: number
  notes?: string
}

export interface DatasetSnapshot {
  id: string
  label: string
  ayahCount: number
  tokenCount: number
  storageLocation: string
  generatedAt: string
  pipelineVersion: string
}

export interface ArabicPipelineOverview {
  tokenizers: TokenizerConfig[]
  normalizationRoutines: NormalizationRoutine[]
  stages: PipelineStage[]
  recentRuns: PipelineRun[]
  datasetSnapshots: DatasetSnapshot[]
}

interface PipelineState {
  tokenizers: Map<string, TokenizerConfig>
  routines: Map<string, NormalizationRoutine>
  stages: Map<string, PipelineStage>
  runs: PipelineRun[]
  datasets: DatasetSnapshot[]
}

const pipelineState: PipelineState = {
  tokenizers: new Map(),
  routines: new Map(),
  stages: new Map(),
  runs: [],
  datasets: [],
}

function seedTokenizers() {
  if (pipelineState.tokenizers.size > 0) {
    return
  }

  const baseTimestamp = new Date("2024-03-12T09:30:00Z")

  const tokenizers: TokenizerConfig[] = [
    {
      id: "tok_word_default",
      name: "Word-level Quranic",
      mode: "word",
      library: "tkseem",
      modelPath: "models/tkseem/word-v2.model",
      cachePath: "cache/tokenizers/word-level",
      isTrained: true,
      description: "Segment mushaf text into tajweed-aware word tokens with pause metadata.",
      examples: ["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَٰنِ"],
      updatedAt: new Date(baseTimestamp.getTime() + 1000 * 60 * 15).toISOString(),
      version: "2.1.0",
    },
    {
      id: "tok_char_iterative",
      name: "Character Iterate",
      mode: "character",
      library: "tkseem",
      modelPath: "models/tkseem/char-balanced.model",
      cachePath: "cache/tokenizers/character",
      isTrained: true,
      description: "Character-level dissection for tajweed mistakes localization.",
      examples: ["ب", "س", "م"],
      updatedAt: new Date(baseTimestamp.getTime() + 1000 * 60 * 45).toISOString(),
      version: "1.8.3",
    },
    {
      id: "tok_sentencepiece_tajweed",
      name: "SentencePiece Tajweed",
      mode: "sentencepiece",
      library: "tkseem",
      modelPath: "models/tkseem/sentencepiece-tajweed.model",
      cachePath: "cache/tokenizers/sentencepiece",
      isTrained: true,
      description: "SentencePiece vocabulary tuned for mixed ayah/word alignment tasks.",
      examples: ["▁بسم", "▁الله", "▁الرحمن"],
      updatedAt: new Date(baseTimestamp.getTime() + 1000 * 60 * 60).toISOString(),
      version: "0.9.7",
    },
    {
      id: "tok_disjoint_letter",
      name: "Disjoint Letter",
      mode: "disjoint_letter",
      library: "tkseem",
      modelPath: "models/tkseem/disjoint-letters.model",
      cachePath: "cache/tokenizers/disjoint",
      isTrained: true,
      description: "Separates ligatures for rasm-aware tajweed cues and audio alignment.",
      examples: ["ا", "ل", "ـل", "ه"],
      updatedAt: new Date(baseTimestamp.getTime() + 1000 * 60 * 90).toISOString(),
      version: "1.2.5",
    },
  ]

  for (const tokenizer of tokenizers) {
    pipelineState.tokenizers.set(tokenizer.id, tokenizer)
  }
}

function seedRoutines() {
  if (pipelineState.routines.size > 0) {
    return
  }

  const routines: NormalizationRoutine[] = [
    {
      id: "norm_cleanroom",
      name: "Cleanroom Normalizer",
      library: "tnkeeh",
      operations: ["remove_diacritics", "normalize_digits", "clean_punctuation"],
      description: "Prepares corpora for model evaluation by stripping noise without touching tajweed markers.",
      enabled: true,
      lastRunAt: "2024-03-11T18:10:00Z",
      datasetCount: 12,
    },
    {
      id: "norm_harakat_segmenter",
      name: "Harakat Segmenter",
      library: "tnkeeh",
      operations: ["segment_harakat", "standardize_tatweel"],
      description: "Splits diacritics into separate channels for tajweed rule tagging pipelines.",
      enabled: true,
      lastRunAt: "2024-03-12T07:45:00Z",
      datasetCount: 9,
    },
  ]

  for (const routine of routines) {
    pipelineState.routines.set(routine.id, routine)
  }
}

function seedStages() {
  if (pipelineState.stages.size > 0) {
    return
  }

  const stages: PipelineStage[] = [
    {
      id: "stage_tokenize",
      name: "Tokenizer Sync",
      description: "Refresh tkseem models and persist cached shards for tajweed services.",
      status: "healthy",
      lastRunAt: "2024-03-12T09:20:00Z",
      processedAyat: 6236,
      avgLatencyMs: 32,
      successRate: 0.997,
      linkedTokenizerIds: ["tok_word_default", "tok_char_iterative", "tok_sentencepiece_tajweed"],
      linkedRoutineIds: [],
    },
    {
      id: "stage_normalize",
      name: "Normalization Sweep",
      description: "Execute tnkeeh cleaning sequences before dataset export.",
      status: "healthy",
      lastRunAt: "2024-03-12T09:25:00Z",
      processedAyat: 6236,
      avgLatencyMs: 41,
      successRate: 0.992,
      linkedTokenizerIds: [],
      linkedRoutineIds: ["norm_cleanroom", "norm_harakat_segmenter"],
    },
    {
      id: "stage_export",
      name: "Dataset Export",
      description: "Package cleaned corpora and tokenizer vocabularies for downstream training.",
      status: "warning",
      lastRunAt: "2024-03-12T09:40:00Z",
      processedAyat: 3120,
      avgLatencyMs: 58,
      successRate: 0.947,
      linkedTokenizerIds: ["tok_sentencepiece_tajweed"],
      linkedRoutineIds: ["norm_cleanroom"],
    },
  ]

  for (const stage of stages) {
    pipelineState.stages.set(stage.id, stage)
  }
}

function seedRuns() {
  if (pipelineState.runs.length > 0) {
    return
  }

  const runs: PipelineRun[] = [
    {
      id: randomUUID(),
      stageId: "stage_tokenize",
      startedAt: "2024-03-12T09:15:00Z",
      finishedAt: "2024-03-12T09:20:00Z",
      processedSamples: 1140,
      errorCount: 1,
      cacheHitRate: 0.89,
      notes: "SentencePiece vocabulary auto-merged with 98% coverage.",
    },
    {
      id: randomUUID(),
      stageId: "stage_normalize",
      startedAt: "2024-03-12T09:20:00Z",
      finishedAt: "2024-03-12T09:25:00Z",
      processedSamples: 1140,
      errorCount: 0,
      cacheHitRate: 0.94,
      notes: "tnkeeh harakat segmentation produced parallel label files.",
    },
    {
      id: randomUUID(),
      stageId: "stage_export",
      startedAt: "2024-03-12T09:30:00Z",
      finishedAt: "2024-03-12T09:40:00Z",
      processedSamples: 760,
      errorCount: 4,
      cacheHitRate: 0.76,
      notes: "Some ayat missing tajweed labels – flagged for review.",
    },
  ]

  pipelineState.runs.push(...runs)
}

function seedDatasets() {
  if (pipelineState.datasets.length > 0) {
    return
  }

  const datasets: DatasetSnapshot[] = [
    {
      id: "snapshot_mushaf_v3",
      label: "Mushaf Tajweed v3",
      ayahCount: 6236,
      tokenCount: 421380,
      storageLocation: "s3://alfawz-datasets/tajweed/mushaf-v3",
      generatedAt: "2024-03-12T09:45:00Z",
      pipelineVersion: "2024.03.12",
    },
    {
      id: "snapshot_errorset_v1",
      label: "Error Localization Eval",
      ayahCount: 940,
      tokenCount: 61240,
      storageLocation: "s3://alfawz-datasets/tajweed/error-eval-v1",
      generatedAt: "2024-03-10T16:05:00Z",
      pipelineVersion: "2024.03.08",
    },
  ]

  pipelineState.datasets.push(...datasets)
}

function ensureSeeded() {
  seedTokenizers()
  seedRoutines()
  seedStages()
  seedRuns()
  seedDatasets()
}

export function getArabicPipelineOverview(): ArabicPipelineOverview {
  ensureSeeded()
  return {
    tokenizers: Array.from(pipelineState.tokenizers.values()),
    normalizationRoutines: Array.from(pipelineState.routines.values()),
    stages: Array.from(pipelineState.stages.values()),
    recentRuns: [...pipelineState.runs],
    datasetSnapshots: [...pipelineState.datasets],
  }
}

export function updateStageStatus(stageId: string, status: PipelineStageStatus) {
  ensureSeeded()
  const stage = pipelineState.stages.get(stageId)
  if (!stage) {
    throw new Error("Stage not found")
  }

  stage.status = status
  pipelineState.stages.set(stageId, stage)
}

export function recordPipelineRun(run: PipelineRun) {
  ensureSeeded()
  pipelineState.runs.unshift(run)
  pipelineState.runs = pipelineState.runs.slice(0, 20)
}

export function registerTokenizer(config: TokenizerConfig) {
  ensureSeeded()
  pipelineState.tokenizers.set(config.id, config)
}

export function registerRoutine(routine: NormalizationRoutine) {
  ensureSeeded()
  pipelineState.routines.set(routine.id, routine)
}

export function registerDataset(dataset: DatasetSnapshot) {
  ensureSeeded()
  pipelineState.datasets.unshift(dataset)
}
