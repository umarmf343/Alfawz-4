const ARABIC_LETTER_REGEX = /[\u0621-\u063A\u0641-\u064A]/g

export function countArabicLetters(text: string): number {
  if (!text) {
    return 0
  }
  return text.match(ARABIC_LETTER_REGEX)?.length ?? 0
}

export function calculateHasanatForText(text: string, rewardPerLetter = 10): number {
  const letters = countArabicLetters(text)
  return letters * rewardPerLetter
}
