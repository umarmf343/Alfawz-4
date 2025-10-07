export type SurahVerseEntry = {
  ayah: number
  arabic: string
  translation: string
}

export const SURAH_VERSE_MAP: Record<number, SurahVerseEntry[]> = {
  1: [
    {
      ayah: 1,
      arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
    },
    {
      ayah: 2,
      arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      translation: "All praise is due to Allah, Lord of the worlds.",
    },
    {
      ayah: 3,
      arabic: "الرَّحْمَٰنِ الرَّحِيمِ",
      translation: "The Entirely Merciful, the Especially Merciful.",
    },
    {
      ayah: 4,
      arabic: "مَالِكِ يَوْمِ الدِّينِ",
      translation: "Master of the Day of Judgment.",
    },
    {
      ayah: 5,
      arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
      translation: "It is You we worship and You we ask for help.",
    },
    {
      ayah: 6,
      arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
      translation: "Guide us to the straight path.",
    },
    {
      ayah: 7,
      arabic: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
      translation: "The path of those You have blessed—not of those who have earned Your anger nor of those who go astray.",
    },
  ],
  67: [
    {
      ayah: 1,
      arabic: "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
      translation: "Blessed is the One in Whose Hand rests all authority, and He is Most Capable of everything.",
    },
    {
      ayah: 2,
      arabic: "الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا وَهُوَ الْعَزِيزُ الْغَفُورُ",
      translation: "He is the One Who created death and life in order to test which of you is best in deeds. He is the Almighty, the All-Forgiving.",
    },
    {
      ayah: 3,
      arabic: "الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا مَا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ فَارْجِعِ الْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ",
      translation: "He created seven heavens, one above the other. You will never see any flaw in the creation of the Most Compassionate. So look again: do you see any cracks?",
    },
    {
      ayah: 4,
      arabic: "ثُمَّ ارْجِعِ الْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ الْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ",
      translation: "Then look again and yet again—your sight will return to you humbled and worn out.",
    },
    {
      ayah: 5,
      arabic: "وَلَقَدْ زَيَّنَّا السَّمَاءَ الدُّنْيَا بِمَصَابِيحَ وَجَعَلْنَاهَا رُجُومًا لِلشَّيَاطِينِ وَأَعْتَدْنَا لَهُمْ عَذَابَ السَّعِيرِ",
      translation: "And We have certainly adorned the lowest heaven with lamps, and made them as missiles for devils, for whom We have also prepared the torment of the Blaze.",
    },
  ],
  112: [
    {
      ayah: 1,
      arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ",
      translation: "Say, He is Allah—One and Indivisible.",
    },
    {
      ayah: 2,
      arabic: "اللَّهُ الصَّمَدُ",
      translation: "Allah—the Sustainer needed by all.",
    },
    {
      ayah: 3,
      arabic: "لَمْ يَلِدْ وَلَمْ يُولَدْ",
      translation: "He has never had offspring, nor was He born.",
    },
    {
      ayah: 4,
      arabic: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
      translation: "And there is none comparable to Him.",
    },
  ],
}

export function getVersesForRange(surahNumber: number, startAyah: number, endAyah: number) {
  const verses = SURAH_VERSE_MAP[surahNumber] ?? []
  return verses.filter((verse) => verse.ayah >= startAyah && verse.ayah <= endAyah)
}
