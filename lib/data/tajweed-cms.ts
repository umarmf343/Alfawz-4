import { randomUUID } from "crypto"

import type { UserRole } from "./teacher-database"

export type QuranAssetType =
  | "translation"
  | "tafseer"
  | "arabic_script"
  | "word_by_word"
  | "mushaf_layout"
  | "grammar_dataset"

export type AssetStatus = "draft" | "in_review" | "published"

export interface QuranAssetVersion {
  id: string
  version: string
  createdAt: string
  createdBy: string
  notes?: string
  changeSummary: string
  diffHighlights?: string[]
}

export interface TajweedAnnotationLayer {
  id: string
  name: string
  description: string
  ayahKeys: string[]
  rulesCovered: string[]
  reviewerIds: string[]
  lastReviewedAt?: string
}

export interface QuranAssetRecord {
  id: string
  type: QuranAssetType
  language: string
  slug: string
  title: string
  status: AssetStatus
  updatedAt: string
  tags: string[]
  versionHistory: QuranAssetVersion[]
  annotationLayers: TajweedAnnotationLayer[]
  latestVersionId: string
}

export type RecitationType = "ayah_segmented" | "gapless"

export interface AudioSegmentMeta {
  id: string
  ayahKey: string
  startTime: number
  endTime: number
  waveformUrl?: string
  tajweedHighlights?: string[]
  createdBy: string
  createdAt: string
  qaStatus: "pending" | "approved" | "rejected"
  qaReviewedBy?: string
  qaReviewedAt?: string
}

export interface AudioRecitationRecord {
  id: string
  reciterId: string
  reciterName: string
  style: string
  type: RecitationType
  bitrate: number
  durationSeconds: number
  uploadedAt: string
  uploadedBy: string
  status: "processing" | "ready" | "archived"
  segmentCount: number
  segments: AudioSegmentMeta[]
}

export type TajweedRole = "contributor" | "reviewer" | "scholar" | "admin"

export interface TajweedRoleAssignment {
  id: string
  userId: string
  name: string
  email: string
  role: TajweedRole
  userRole: UserRole
  scopes: string[]
  grantedBy: string
  grantedAt: string
  expiresAt?: string
}

export interface ReadingPlanMilestone {
  id: string
  title: string
  dueDate: string
  ayahKeys: string[]
  focusRule?: string
  reviewerId?: string
}

export interface CollaborativeReadingPlan {
  id: string
  title: string
  description: string
  createdBy: string
  createdAt: string
  version: string
  participantIds: string[]
  milestones: ReadingPlanMilestone[]
  linkedAssetIds: string[]
  linkedRecitationIds: string[]
}

interface TajweedCMSState {
  assets: Map<string, QuranAssetRecord>
  recitations: Map<string, AudioRecitationRecord>
  roles: Map<string, TajweedRoleAssignment>
  plans: Map<string, CollaborativeReadingPlan>
}

const cmsState: TajweedCMSState = {
  assets: new Map(),
  recitations: new Map(),
  roles: new Map(),
  plans: new Map(),
}

function registerAsset(record: QuranAssetRecord) {
  cmsState.assets.set(record.id, record)
}

function registerRecitation(record: AudioRecitationRecord) {
  cmsState.recitations.set(record.id, record)
}

function registerRole(record: TajweedRoleAssignment) {
  cmsState.roles.set(record.id, record)
}

function registerPlan(record: CollaborativeReadingPlan) {
  cmsState.plans.set(record.id, record)
}

function seedAssets() {
  if (cmsState.assets.size > 0) {
    return
  }

  const translationVersion: QuranAssetVersion = {
    id: "asset_ver_001",
    version: "1.4.0",
    createdAt: "2024-01-19T10:15:00Z",
    createdBy: "admin_001",
    changeSummary: "Updated Surah Kahf ayah alignment and added Hafs annotations",
    notes: "Synced with scholar-reviewed copy from January review board",
    diffHighlights: ["Aligned ayah breaks with Medina Mushaf", "Added tajweed notes for qalqala"],
  }

  const translationAsset: QuranAssetRecord = {
    id: "asset_translation_en_hafs",
    type: "translation",
    language: "en",
    slug: "english-hafs-hilali",
    title: "English Hilali-Khan (Hafs)",
    status: "published",
    updatedAt: "2024-01-20T08:30:00Z",
    tags: ["english", "hafs", "translation", "tajweed"],
    versionHistory: [translationVersion],
    annotationLayers: [
      {
        id: "layer_tajweed_qalqala",
        name: "Qalqala Focus",
        description: "Highlights qalqala letters and recommended pauses",
        ayahKeys: ["18:1", "18:2", "18:3", "18:4"],
        rulesCovered: ["qalqala kubra", "qalqala sughra"],
        reviewerIds: ["scholar_001"],
        lastReviewedAt: "2024-01-19T20:00:00Z",
      },
    ],
    latestVersionId: translationVersion.id,
  }

  registerAsset(translationAsset)

  const scriptVersion: QuranAssetVersion = {
    id: "asset_ver_002",
    version: "2.1.2",
    createdAt: "2024-02-02T09:00:00Z",
    createdBy: "editor_003",
    changeSummary: "Imported updated Madani Mushaf layout with Waqf symbols",
    diffHighlights: ["Synced glyph mapping for Surah Yasin", "Included Rasm Uthmani ligatures"],
  }

  const scriptAsset: QuranAssetRecord = {
    id: "asset_script_ar_uthmani",
    type: "arabic_script",
    language: "ar",
    slug: "madani-uthmani-script",
    title: "Madani Mushaf Script",
    status: "in_review",
    updatedAt: "2024-02-04T16:45:00Z",
    tags: ["arabic", "mushaf", "glyphs"],
    versionHistory: [scriptVersion],
    annotationLayers: [
      {
        id: "layer_stop_marks",
        name: "Stopping Marks",
        description: "Layer for tajweed stop markers (waqf symbols)",
        ayahKeys: ["36:1", "36:2", "36:3", "36:4"],
        rulesCovered: ["waqf lazim", "waqf jaiz"],
        reviewerIds: ["reviewer_002"],
        lastReviewedAt: "2024-02-03T18:10:00Z",
      },
    ],
    latestVersionId: scriptVersion.id,
  }

  registerAsset(scriptAsset)

  const grammarVersion: QuranAssetVersion = {
    id: "asset_ver_003",
    version: "0.9.0",
    createdAt: "2023-12-12T11:00:00Z",
    createdBy: "linguist_004",
    changeSummary: "Initial import of sarf parsing for Juz Amma",
    notes: "Pending scholar validation for irregular verb forms",
  }

  const grammarAsset: QuranAssetRecord = {
    id: "asset_grammar_ar_sarf",
    type: "grammar_dataset",
    language: "ar",
    slug: "tajweed-morphology-juz-amma",
    title: "Tajweed Morphology Dataset",
    status: "draft",
    updatedAt: "2023-12-12T11:00:00Z",
    tags: ["morphology", "tajweed", "dataset"],
    versionHistory: [grammarVersion],
    annotationLayers: [],
    latestVersionId: grammarVersion.id,
  }

  registerAsset(grammarAsset)
}

function seedRecitations() {
  if (cmsState.recitations.size > 0) {
    return
  }

  const gaplessSegments: AudioSegmentMeta[] = [
    {
      id: "segment_gapless_18_1",
      ayahKey: "18:1",
      startTime: 0,
      endTime: 6.4,
      waveformUrl: "/audio/waveforms/reciter001/18_1.json",
      tajweedHighlights: ["ghunnah"],
      createdBy: "engineer_002",
      createdAt: "2024-02-01T09:45:00Z",
      qaStatus: "approved",
      qaReviewedBy: "scholar_001",
      qaReviewedAt: "2024-02-02T08:00:00Z",
    },
    {
      id: "segment_gapless_18_2",
      ayahKey: "18:2",
      startTime: 6.4,
      endTime: 13.8,
      createdBy: "engineer_002",
      createdAt: "2024-02-01T09:45:00Z",
      qaStatus: "pending",
    },
  ]

  const gaplessRecitation: AudioRecitationRecord = {
    id: "rec_gapless_hafs_001",
    reciterId: "reciter_hafs_001",
    reciterName: "Mishary Alafasy",
    style: "Hafs Gapless",
    type: "gapless",
    bitrate: 192,
    durationSeconds: 4200,
    uploadedAt: "2024-02-01T09:30:00Z",
    uploadedBy: "engineer_002",
    status: "ready",
    segmentCount: gaplessSegments.length,
    segments: gaplessSegments,
  }

  registerRecitation(gaplessRecitation)

  const ayahSegments: AudioSegmentMeta[] = [
    {
      id: "segment_ayah_36_1",
      ayahKey: "36:1",
      startTime: 0,
      endTime: 4.2,
      createdBy: "producer_001",
      createdAt: "2024-01-15T12:10:00Z",
      qaStatus: "approved",
      qaReviewedBy: "scholar_002",
      qaReviewedAt: "2024-01-16T11:40:00Z",
      tajweedHighlights: ["mad tabi\u02bby"],
    },
    {
      id: "segment_ayah_36_2",
      ayahKey: "36:2",
      startTime: 4.2,
      endTime: 9.1,
      createdBy: "producer_001",
      createdAt: "2024-01-15T12:10:00Z",
      qaStatus: "approved",
      qaReviewedBy: "scholar_002",
      qaReviewedAt: "2024-01-16T11:40:00Z",
    },
  ]

  const segmentedRecitation: AudioRecitationRecord = {
    id: "rec_ayah_hafs_002",
    reciterId: "reciter_hafs_002",
    reciterName: "Saud Al-Shuraim",
    style: "Hafs Ayah Segmented",
    type: "ayah_segmented",
    bitrate: 128,
    durationSeconds: 2100,
    uploadedAt: "2024-01-14T15:20:00Z",
    uploadedBy: "producer_001",
    status: "ready",
    segmentCount: ayahSegments.length,
    segments: ayahSegments,
  }

  registerRecitation(segmentedRecitation)
}

function seedRoles() {
  if (cmsState.roles.size > 0) {
    return
  }

  const assignments: TajweedRoleAssignment[] = [
    {
      id: "role_assign_001",
      userId: "scholar_001",
      name: "Shaykh Yusuf Idris",
      email: "yusuf@alfawz.example",
      role: "scholar",
      userRole: "teacher",
      scopes: ["tajweed_rules:approve", "audio_segments:qa"],
      grantedBy: "admin_001",
      grantedAt: "2023-11-01T10:00:00Z",
    },
    {
      id: "role_assign_002",
      userId: "reviewer_002",
      name: "Maryam Adeyemi",
      email: "maryam@alfawz.example",
      role: "reviewer",
      userRole: "teacher",
      scopes: ["translations:edit", "tajweed_layers:review"],
      grantedBy: "admin_001",
      grantedAt: "2023-12-05T09:15:00Z",
    },
    {
      id: "role_assign_003",
      userId: "contrib_005",
      name: "Aisha Okafor",
      email: "aisha@alfawz.example",
      role: "contributor",
      userRole: "student",
      scopes: ["audio_segments:annotate"],
      grantedBy: "reviewer_002",
      grantedAt: "2024-01-10T14:25:00Z",
      expiresAt: "2024-06-01T00:00:00Z",
    },
  ]

  assignments.forEach(registerRole)
}

function seedPlans() {
  if (cmsState.plans.size > 0) {
    return
  }

  const plan: CollaborativeReadingPlan = {
    id: "plan_tajweed_juz18",
    title: "Juz 18 Tajweed Intensive",
    description: "Collaborative plan focusing on qalqala, madd, and waqf rules for Juz 18",
    createdBy: "scholar_001",
    createdAt: "2024-01-05T10:45:00Z",
    version: "0.3.0",
    participantIds: ["scholar_001", "reviewer_002", "contrib_005"],
    milestones: [
      {
        id: "milestone_qalqala",
        title: "Qalqala Application",
        dueDate: "2024-02-10",
        ayahKeys: ["18:1", "18:2", "18:3", "18:4"],
        focusRule: "qalqala kubra",
        reviewerId: "reviewer_002",
      },
      {
        id: "milestone_waqf",
        title: "Waqf Symbol Review",
        dueDate: "2024-02-20",
        ayahKeys: ["36:1", "36:2", "36:3", "36:4"],
        focusRule: "waqf lazim",
        reviewerId: "scholar_001",
      },
    ],
    linkedAssetIds: ["asset_script_ar_uthmani", "asset_translation_en_hafs"],
    linkedRecitationIds: ["rec_gapless_hafs_001", "rec_ayah_hafs_002"],
  }

  registerPlan(plan)
}

function ensureSeeded() {
  seedAssets()
  seedRecitations()
  seedRoles()
  seedPlans()
}

export function listQuranAssets(): QuranAssetRecord[] {
  ensureSeeded()
  return Array.from(cmsState.assets.values()).map((asset) => ({
    ...asset,
    tags: [...asset.tags],
    versionHistory: asset.versionHistory.map((version) => ({ ...version })),
    annotationLayers: asset.annotationLayers.map((layer) => ({
      ...layer,
      ayahKeys: [...layer.ayahKeys],
      rulesCovered: [...layer.rulesCovered],
      reviewerIds: [...layer.reviewerIds],
    })),
  }))
}

export function getAssetById(assetId: string): QuranAssetRecord | undefined {
  ensureSeeded()
  const asset = cmsState.assets.get(assetId)
  if (!asset) {
    return undefined
  }
  return {
    ...asset,
    tags: [...asset.tags],
    versionHistory: asset.versionHistory.map((version) => ({ ...version })),
    annotationLayers: asset.annotationLayers.map((layer) => ({
      ...layer,
      ayahKeys: [...layer.ayahKeys],
      rulesCovered: [...layer.rulesCovered],
      reviewerIds: [...layer.reviewerIds],
    })),
  }
}

export interface RecordAssetChangeInput {
  assetId: string
  userId: string
  changeSummary: string
  notes?: string
  diffHighlights?: string[]
}

export function recordAssetChange(input: RecordAssetChangeInput): QuranAssetVersion {
  ensureSeeded()
  const asset = cmsState.assets.get(input.assetId)
  if (!asset) {
    throw new Error("Asset not found")
  }

  const latestVersion = asset.versionHistory[asset.versionHistory.length - 1]
  const newVersionNumber = latestVersion
    ? `${Number.parseInt(latestVersion.version, 10) + 0.1}`
    : "1.0.0"

  const version: QuranAssetVersion = {
    id: randomUUID(),
    version: newVersionNumber,
    createdAt: new Date().toISOString(),
    createdBy: input.userId,
    changeSummary: input.changeSummary,
    notes: input.notes,
    diffHighlights: input.diffHighlights,
  }

  asset.versionHistory.push(version)
  asset.latestVersionId = version.id
  asset.updatedAt = version.createdAt
  cmsState.assets.set(asset.id, asset)

  return { ...version }
}

export function listAudioRecitations(): AudioRecitationRecord[] {
  ensureSeeded()
  return Array.from(cmsState.recitations.values()).map((recitation) => ({
    ...recitation,
    segments: recitation.segments.map((segment) => ({ ...segment })),
  }))
}

export interface RegisterAudioSegmentInput {
  recitationId: string
  segment: Omit<AudioSegmentMeta, "id" | "createdAt" | "qaStatus"> & {
    id?: string
    createdAt?: string
    qaStatus?: AudioSegmentMeta["qaStatus"]
  }
}

export function registerAudioSegment({ recitationId, segment }: RegisterAudioSegmentInput): AudioSegmentMeta {
  ensureSeeded()
  const recitation = cmsState.recitations.get(recitationId)
  if (!recitation) {
    throw new Error("Recitation not found")
  }

  const segmentRecord: AudioSegmentMeta = {
    id: segment.id ?? randomUUID(),
    ayahKey: segment.ayahKey,
    startTime: segment.startTime,
    endTime: segment.endTime,
    waveformUrl: segment.waveformUrl,
    tajweedHighlights: segment.tajweedHighlights ? [...segment.tajweedHighlights] : undefined,
    createdBy: segment.createdBy,
    createdAt: segment.createdAt ?? new Date().toISOString(),
    qaStatus: segment.qaStatus ?? "pending",
    qaReviewedBy: segment.qaReviewedBy,
    qaReviewedAt: segment.qaReviewedAt,
  }

  recitation.segments.push(segmentRecord)
  recitation.segmentCount = recitation.segments.length
  cmsState.recitations.set(recitation.id, recitation)

  return { ...segmentRecord }
}

export function listRoleAssignments(): TajweedRoleAssignment[] {
  ensureSeeded()
  return Array.from(cmsState.roles.values()).map((record) => ({ ...record, scopes: [...record.scopes] }))
}

export interface AssignTajweedRoleInput {
  userId: string
  name: string
  email: string
  role: TajweedRole
  userRole: UserRole
  scopes: string[]
  grantedBy: string
  expiresAt?: string
}

export function assignTajweedRole(input: AssignTajweedRoleInput): TajweedRoleAssignment {
  ensureSeeded()
  const record: TajweedRoleAssignment = {
    id: randomUUID(),
    userId: input.userId,
    name: input.name,
    email: input.email,
    role: input.role,
    userRole: input.userRole,
    scopes: [...input.scopes],
    grantedBy: input.grantedBy,
    grantedAt: new Date().toISOString(),
    expiresAt: input.expiresAt,
  }

  cmsState.roles.set(record.id, record)
  return { ...record, scopes: [...record.scopes] }
}

export function listCollaborativePlans(): CollaborativeReadingPlan[] {
  ensureSeeded()
  return Array.from(cmsState.plans.values()).map((plan) => ({
    ...plan,
    participantIds: [...plan.participantIds],
    milestones: plan.milestones.map((milestone) => ({
      ...milestone,
      ayahKeys: [...milestone.ayahKeys],
    })),
    linkedAssetIds: [...plan.linkedAssetIds],
    linkedRecitationIds: [...plan.linkedRecitationIds],
  }))
}

export function linkAssetToPlan(planId: string, assetId: string) {
  ensureSeeded()
  const plan = cmsState.plans.get(planId)
  if (!plan) {
    throw new Error("Plan not found")
  }

  if (!cmsState.assets.has(assetId)) {
    throw new Error("Asset not found")
  }

  if (!plan.linkedAssetIds.includes(assetId)) {
    plan.linkedAssetIds.push(assetId)
  }

  cmsState.plans.set(plan.id, plan)
}

export function linkRecitationToPlan(planId: string, recitationId: string) {
  ensureSeeded()
  const plan = cmsState.plans.get(planId)
  if (!plan) {
    throw new Error("Plan not found")
  }

  if (!cmsState.recitations.has(recitationId)) {
    throw new Error("Recitation not found")
  }

  if (!plan.linkedRecitationIds.includes(recitationId)) {
    plan.linkedRecitationIds.push(recitationId)
  }

  cmsState.plans.set(plan.id, plan)
}

export interface TajweedCMSOverview {
  assets: QuranAssetRecord[]
  recitations: AudioRecitationRecord[]
  roleAssignments: TajweedRoleAssignment[]
  plans: CollaborativeReadingPlan[]
}

export function getTajweedCMSOverview(): TajweedCMSOverview {
  ensureSeeded()
  return {
    assets: listQuranAssets(),
    recitations: listAudioRecitations(),
    roleAssignments: listRoleAssignments(),
    plans: listCollaborativePlans(),
  }
}
