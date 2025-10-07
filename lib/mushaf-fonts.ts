export type MushafOverlayMode = "tajweed" | "mistakes" | "none"

export interface MushafFontSource {
  family: string
  weight: number
  style: "normal" | "italic"
  file: string
  format: "woff2" | "woff"
}

export const MUSHAF_FONT_SOURCES: MushafFontSource[] = [
  {
    family: "Mushaf Madinah",
    weight: 400,
    style: "normal",
    file: "mushaf-madinah.woff2",
    format: "woff2",
  },
  {
    family: "Mushaf Madinah",
    weight: 400,
    style: "normal",
    file: "mushaf-madinah.woff",
    format: "woff",
  },
]

export const MUSHAF_FONT_PUBLIC_PATH = "/fonts/mushaf"

export const MUSHAF_FONTS_AVAILABLE = process.env.NEXT_PUBLIC_MUSHAF_FONTS_READY === "true"

export function resolveMushafFontUrl(source: MushafFontSource): string {
  return `${MUSHAF_FONT_PUBLIC_PATH}/${source.file}`
}

export interface TajweedRuleColor {
  background: string
  border: string
  text: string
}

const FALLBACK_TAJWEED_COLOR: TajweedRuleColor = {
  background: "rgba(220, 38, 38, 0.12)",
  border: "rgba(220, 38, 38, 0.35)",
  text: "#b91c1c",
}

const TAJWEED_RULE_COLOR_MAP: Record<string, TajweedRuleColor> = {
  ikhfa: { background: "rgba(251, 191, 36, 0.22)", border: "rgba(245, 158, 11, 0.45)", text: "#b45309" },
  idgham: { background: "rgba(74, 222, 128, 0.22)", border: "rgba(34, 197, 94, 0.45)", text: "#15803d" },
  qalqalah: { background: "rgba(252, 165, 165, 0.25)", border: "rgba(248, 113, 113, 0.45)", text: "#b91c1c" },
  madd: { background: "rgba(147, 197, 253, 0.22)", border: "rgba(59, 130, 246, 0.45)", text: "#1d4ed8" },
  ghunnah: { background: "rgba(253, 186, 116, 0.22)", border: "rgba(249, 115, 22, 0.45)", text: "#c2410c" },
  lamShamsiyyah: { background: "rgba(217, 249, 157, 0.22)", border: "rgba(163, 230, 53, 0.5)", text: "#4d7c0f" },
  hamzatWasl: { background: "rgba(221, 214, 254, 0.22)", border: "rgba(165, 180, 252, 0.45)", text: "#4338ca" },
}

export function getTajweedRuleColor(ruleName?: string | null): TajweedRuleColor {
  if (!ruleName) {
    return FALLBACK_TAJWEED_COLOR
  }

  const normalized = ruleName
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")

  for (const [key, value] of Object.entries(TAJWEED_RULE_COLOR_MAP)) {
    if (normalized.includes(key.toLowerCase())) {
      return value
    }
  }

  return FALLBACK_TAJWEED_COLOR
}
