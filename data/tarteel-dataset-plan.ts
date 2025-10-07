export type DatasetStage = {
  id: string
  title: string
  objective: string
  tooling: string[]
  outputs: string[]
  qa: string
}

export const datasetCurationStages: DatasetStage[] = [
  {
    id: "bootstrap",
    title: "Bootstrap archival audio",
    objective:
      "Ingest instructor-approved recordings and historic halaqa sessions, then normalize gain levels and clip to ayah boundaries.",
    tooling: ["tarteel-ml/preprocess/audio_split", "tkseem", "tnkeeh"],
    outputs: ["ayah-aligned WAV", "session-metadata.json"],
    qa: "Spot check 5% of clips for clipping artefacts and verify ayah hashes against Mushaf references.",
  },
  {
    id: "label",
    title: "Label tajweed violations",
    objective:
      "Tag mispronunciations, elongations, and qalqalah slips with rule codes so the model learns error classes, not just transcripts.",
    tooling: ["tarteel-ml/annotate", "internal tajweed rubric"],
    outputs: ["violation_labels.parquet", "reviewer-notes.md"],
    qa: "Require dual review; disagreements over 0.2 confidence trigger arbitration.",
  },
  {
    id: "synthesize",
    title: "Synthesize hard negatives",
    objective:
      "Augment data with rule-specific perturbations (e.g., ghunnah removal) to balance sparse classes before training.",
    tooling: ["tarteel-ml/augment", "custom formant filters"],
    outputs: ["augmented_clips", "rule_mispronunciation_catalog"],
    qa: "Validate augmented clips with automatic tajweed score deltas > 25% before inclusion.",
  },
  {
    id: "package",
    title: "Package training shards",
    objective:
      "Chunk curated audio+text into sharded TFRecords with aligned tajweed metadata for downstream Whisper fine-tuning.",
    tooling: ["tarteel-ml/package", "manifest integrity checks"],
    outputs: ["train-*.tfrecord", "manifest.json"],
    qa: "SHA256 each shard and store manifests in object storage with versioned dataset IDs.",
  },
]

