export type TafsirTriviaOption = {
  id: string
  text: string
  isCorrect: boolean
  rationale: string
}

export type TafsirTriviaQuestion = {
  id: string
  round: "foundation" | "context" | "application"
  theme: string
  ayahReference: string
  excerpt: string
  translation: string
  prompt: string
  options: TafsirTriviaOption[]
  tafsirGem: string
  scholarVoice: string
  reflection: string
  learningTarget: string
}

export type TafsirTriviaRound = {
  id: "foundation" | "context" | "application"
  title: string
  description: string
  focus: string
}

export const tafsirTriviaRounds: TafsirTriviaRound[] = [
  {
    id: "foundation",
    title: "Round 1 • Foundations of Meaning",
    description:
      "Check your grasp of core vocabulary and direct meanings before exploring the layers of tafsir.",
    focus: "Literal translations, key terms, and immediate lessons.",
  },
  {
    id: "context",
    title: "Round 2 • Contextual Depth",
    description:
      "Connect verses to their historical backdrop, reasons of revelation, and classical commentary notes.",
    focus: "Asbāb al-nuzūl, scholarly insights, and thematic flow.",
  },
  {
    id: "application",
    title: "Round 3 • Living the Tafsir",
    description:
      "Translate the lessons into lived practice by reflecting on character, community, and spiritual growth.",
    focus: "Personal action steps and contemporary resonance.",
  },
]

export const tafsirTriviaDeck: TafsirTriviaQuestion[] = [
  {
    id: "foundation_1",
    round: "foundation",
    theme: "Praise and Gratitude",
    ayahReference: "Surah Al-Fātiḥah 1:2",
    excerpt: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ",
    translation: "All praise is for Allah, Lord of the worlds.",
    prompt:
      "Which understanding best captures why Al-Fātiḥah opens with universal praise for Allah as 'Rabb al-ʿĀlamīn'?",
    options: [
      {
        id: "a",
        text: "It reminds believers that praise is limited to times of ease only.",
        isCorrect: false,
        rationale: "The verse emphasizes constant gratitude in all states, not only ease.",
      },
      {
        id: "b",
        text: "It trains the heart to recognize Allah's nurturing care over every realm of creation.",
        isCorrect: true,
        rationale:
          "Classical exegetes explain 'Rabb' as the One who lovingly nurtures and sustains all worlds.",
      },
      {
        id: "c",
        text: "It introduces a legal ruling that praise must precede every dua.",
        isCorrect: false,
        rationale: "While recommended, scholars do not view this verse as a binding legal command.",
      },
      {
        id: "d",
        text: "It signals that the surah was revealed specifically for the angels.",
        isCorrect: false,
        rationale: "Al-Fātiḥah is described as a guidance manual for humanity, not exclusively angels.",
      },
    ],
    tafsirGem:
      "Imam Ibn Kathir notes that 'Rabb' combines ownership, nurturing, and gentle reform—teaching us that every blessing is a deliberate gift from our Sustainer.",
    scholarVoice:
      "Imam al-Ghazali: 'Gratitude blooms when the servant witnesses the continuous outpour of Allah's care.'",
    reflection:
      "List three moments from today where you felt Allah's nurturing care, even in small details.",
    learningTarget: "Recognize the nurturing qualities embedded within the word 'Rabb'.",
  },
  {
    id: "foundation_2",
    round: "foundation",
    theme: "Mercy and Hope",
    ayahReference: "Surah Az-Zumar 39:53",
    excerpt: "قُلْ يَٰعِبَادِيَ ٱلَّذِينَ أَسْرَفُواْ عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُواْ مِن رَّحْمَةِ ٱللَّهِ",
    translation: "Say, O My servants who have transgressed against themselves, do not despair of Allah's mercy.",
    prompt:
      "According to the verse, what is the immediate healing offered to believers who feel overwhelmed by their sins?",
    options: [
      {
        id: "a",
        text: "An assurance that sincere repentance invites Allah's vast mercy.",
        isCorrect: true,
        rationale:
          "The verse calls the sinner with a compassionate 'O My servants' and commands them never to despair.",
      },
      {
        id: "b",
        text: "A promise that worldly hardships will instantly disappear.",
        isCorrect: false,
        rationale: "Material relief is not guaranteed, but spiritual hope is restored through repentance.",
      },
      {
        id: "c",
        text: "A reminder that community support outweighs divine forgiveness.",
        isCorrect: false,
        rationale: "The focus is on Allah's personal mercy, though community care is beneficial.",
      },
      {
        id: "d",
        text: "An instruction to delay tawbah until one feels ready.",
        isCorrect: false,
        rationale: "Tafsir emphasizes immediate turning back to Allah without postponement.",
      },
    ],
    tafsirGem:
      "Ibn Ashur highlights that Allah addresses even excessive sinners as 'My servants' to revive their sense of belonging before commanding them to hope.",
    scholarVoice:
      "Imam ash-Shawkani: 'The door of mercy remains open regardless of the magnitude of sin, so long as the servant returns.'",
    reflection:
      "Write one line of istighfar you can repeat tonight with full presence of heart.",
    learningTarget: "Anchor repentance in hope rather than shame.",
  },
  {
    id: "foundation_3",
    round: "foundation",
    theme: "Trust in Allah",
    ayahReference: "Surah At-Tawbah 9:51",
    excerpt: "قُل لَّن يُصِيبَنَا إِلَّا مَا كَتَبَ ٱللَّهُ لَنَا",
    translation: "Say, nothing will ever befall us except what Allah has decreed for us.",
    prompt:
      "What mindset does this verse instill regarding unexpected events?",
    options: [
      {
        id: "a",
        text: "Every outcome—pleasant or difficult—is written with wisdom meant for our growth.",
        isCorrect: true,
        rationale: "The verse nurtures tawakkul by affirming Allah's protective decree over the believer.",
      },
      {
        id: "b",
        text: "Believers will never experience hardship if they have strong iman.",
        isCorrect: false,
        rationale: "Trials remain part of life; the verse reframes them, it does not erase them.",
      },
      {
        id: "c",
        text: "We should avoid making future plans altogether.",
        isCorrect: false,
        rationale: "Islam encourages planning while trusting Allah, not abandoning effort.",
      },
      {
        id: "d",
        text: "Destiny removes personal responsibility for choices.",
        isCorrect: false,
        rationale: "Qadar and accountability co-exist; tafsir warns against fatalism.",
      },
    ],
    tafsirGem:
      "Al-Qurtubi explains that the phrase 'kataba Allahu lana' means the decree is ultimately in our favor, even if wrapped in difficulty.",
    scholarVoice:
      "Ibn al-Qayyim: 'True reliance is to exert effort, then rest the heart upon the wisdom of the decree.'",
    reflection:
      "Pair this verse with a current worry. How could trusting Allah reshape your response?",
    learningTarget: "Develop resilience rooted in tawakkul.",
  },
  {
    id: "context_1",
    round: "context",
    theme: "Brotherhood After Conflict",
    ayahReference: "Surah Al-Ḥujurāt 49:10",
    excerpt: "إِنَّمَا ٱلْمُؤْمِنُونَ إِخْوَةٌ فَأَصْلِحُواْ بَيْنَ أَخَوَيْكُمْ",
    translation: "The believers are but brothers, so make peace between your brothers.",
    prompt:
      "What historical scenario shaped the revelation of this verse according to classical reports?",
    options: [
      {
        id: "a",
        text: "A dispute erupted between two Muslim tribes in Madinah requiring community mediation.",
        isCorrect: true,
        rationale:
          "Narrations mention tension between the Aws and Khazraj, prompting direct guidance on reconciliation.",
      },
      {
        id: "b",
        text: "A treaty negotiation with the Quraysh in Makkah.",
        isCorrect: false,
        rationale: "The verse addressed intra-Muslim tensions rather than external diplomacy.",
      },
      {
        id: "c",
        text: "A disagreement between angels regarding the virtues of prophets.",
        isCorrect: false,
        rationale: "Reports specifically mention human tribes, not celestial debates.",
      },
      {
        id: "d",
        text: "An argument about inheritance between two Makkan families.",
        isCorrect: false,
        rationale: "The asbāb focus on the Medinan community dealing with post-battle sensitivities.",
      },
    ],
    tafsirGem:
      "Imam as-Sa'di writes that genuine brotherhood requires actively repairing harm, not passively hoping for harmony.",
    scholarVoice:
      "Shaykh Abd ar-Rahman al-Barrak: 'Reconciliation is a collective duty when unity is threatened.'",
    reflection:
      "Identify one strained relationship and jot down a first compassionate step toward mending it.",
    learningTarget: "Link community harmony to direct divine instruction.",
  },
  {
    id: "context_2",
    round: "context",
    theme: "Night Journey Inspiration",
    ayahReference: "Surah Al-Isrā’ 17:1",
    excerpt: "سُبْحَٰنَ ٱلَّذِى أَسْرَىٰ بِعَبْدِهِ لَيْلًا",
    translation: "Glory be to the One who took His servant by night...",
    prompt:
      "How did the miracle of the Night Journey strengthen early believers according to tafsir?",
    options: [
      {
        id: "a",
        text: "It reaffirmed that spiritual openings can arrive after periods of intense hardship.",
        isCorrect: true,
        rationale:
          "The Isra' occurred after the Year of Sorrow, providing profound consolation and renewed mission.",
      },
      {
        id: "b",
        text: "It taught that prayer should be delayed until sunrise.",
        isCorrect: false,
        rationale: "The verse glorifies Allah and mentions the journey; it does not legislate prayer timings here.",
      },
      {
        id: "c",
        text: "It required believers to relocate to Jerusalem immediately.",
        isCorrect: false,
        rationale: "No instruction to migrate is mentioned in this context.",
      },
      {
        id: "d",
        text: "It discouraged the Prophet ﷺ from sharing miracles with the community.",
        isCorrect: false,
        rationale: "In fact, the Prophet ﷺ described the journey, leading to Abu Bakr's famous declaration of truthfulness.",
      },
    ],
    tafsirGem:
      "Imam an-Nasafi comments that Allah begins with 'Subhan' to remind listeners that the journey transcends human limitations.",
    scholarVoice:
      "Ibn Kathir: 'When the Prophet recounted the Isra', Abu Bakr instantly affirmed him, earning the title as-Siddiq.'",
    reflection:
      "Recall a moment when a friend's faith statement lifted your own certainty. How can you reciprocate that support?",
    learningTarget: "Draw courage from the Isra' narrative during personal tests.",
  },
  {
    id: "context_3",
    round: "context",
    theme: "Justice with Families",
    ayahReference: "Surah An-Nisā’ 4:135",
    excerpt: "يَٰأَيُّهَا ٱلَّذِينَ ءَامَنُواْ كُونُواْ قَوَّٰمِينَ بِٱلْقِسْطِ شُهَدَآءَ لِلَّهِ وَلَوْ عَلَىٰ أَنفُسِكُمْ",
    translation:
      "O believers, stand firm for justice as witnesses for Allah, even against yourselves or your parents and relatives.",
    prompt:
      "Which legal ethic do mufassirun extract from this powerful instruction?",
    options: [
      {
        id: "a",
        text: "Justice must be upheld even when it disadvantages one's own family ties.",
        isCorrect: true,
        rationale:
          "The verse explicitly commands fairness over personal interest, a cornerstone in Islamic legal integrity.",
      },
      {
        id: "b",
        text: "Witnesses can refuse testimony if family might be embarrassed.",
        isCorrect: false,
        rationale: "Shyness or shame is not an excuse to abandon justice.",
      },
      {
        id: "c",
        text: "Financial cases are exempt from the demand of justice.",
        isCorrect: false,
        rationale: "Tafsir applies this verse broadly, especially to financial and legal matters.",
      },
      {
        id: "d",
        text: "The verse only applied during the Prophet's lifetime.",
        isCorrect: false,
        rationale: "Scholars view it as enduring guidance for all Muslim societies.",
      },
    ],
    tafsirGem:
      "Imam Fakhr ad-Din ar-Razi explains that justice for Allah's sake means emotions cannot override testimony for truth.",
    scholarVoice:
      "Shaykh al-Alusi: 'Standing firm implies repeating the commitment daily, not just during court cases.'",
    reflection:
      "Where might bias cloud your judgment this week? Note one concrete correction you can make.",
    learningTarget: "Champion principled justice in family dynamics.",
  },
  {
    id: "application_1",
    round: "application",
    theme: "Service and Compassion",
    ayahReference: "Surah Al-Māʿūn 107:3-4",
    excerpt: "وَلَا يَحُضُّ عَلَىٰ طَعَامِ ٱلْمِسْكِينِ فَوَيْلٌ لِّلْمُصَلِّينَ",
    translation: "And they do not encourage feeding the poor – so woe to those who pray (yet neglect this duty).",
    prompt:
      "How should this verse transform our approach to acts of worship?",
    options: [
      {
        id: "a",
        text: "Salah must be coupled with social concern, otherwise it becomes hollow ritual.",
        isCorrect: true,
        rationale:
          "Tafsir Ibn Kathir warns against prayer devoid of compassion for society's vulnerable.",
      },
      {
        id: "b",
        text: "Charity is optional as long as prayers are on time.",
        isCorrect: false,
        rationale: "The surah condemns withholding kindness, showing it's integral to sincere faith.",
      },
      {
        id: "c",
        text: "Believers should postpone salah until community service is complete.",
        isCorrect: false,
        rationale: "Islam integrates both duties; one does not cancel the other.",
      },
      {
        id: "d",
        text: "The ayah only censures those who miss zakah payments.",
        isCorrect: false,
        rationale: "It targets a broader neglect of the needy and lack of empathy.",
      },
    ],
    tafsirGem:
      "Al-Tabari states that failing to encourage feeding the needy reveals a heart untouched by the humility of salah.",
    scholarVoice:
      "Shaykh Sa'id Hawwa: 'Prayer without service is like a body without spirit.'",
    reflection:
      "Schedule one act of quiet service this week that no one knows about but Allah.",
    learningTarget: "Fuse worship with compassionate action.",
  },
  {
    id: "application_2",
    round: "application",
    theme: "Environmental Stewardship",
    ayahReference: "Surah Al-A'raf 7:56",
    excerpt: "وَلَا تُفْسِدُوا فِي ٱلْأَرْضِ بَعْدَ إِصْلَٰحِهَا",
    translation: "Do not cause corruption on the earth after it has been set right.",
    prompt:
      "Which contemporary habit aligns with the tafsir principle of preserving Allah's balance on earth?",
    options: [
      {
        id: "a",
        text: "Reducing waste and honoring resources as trusts from Allah.",
        isCorrect: true,
        rationale:
          "Scholars extend the command to modern forms of corruption including environmental neglect.",
      },
      {
        id: "b",
        text: "Excessive consumption as a sign of gratitude.",
        isCorrect: false,
        rationale: "Israf contradicts gratitude and harms the earth's balance.",
      },
      {
        id: "c",
        text: "Limiting du'a to Masjid settings only.",
        isCorrect: false,
        rationale: "The verse addresses societal conduct, not the location of du'a.",
      },
      {
        id: "d",
        text: "Avoiding any form of urban development.",
        isCorrect: false,
        rationale: "The verse prohibits corruption, not constructive development that serves communities.",
      },
    ],
    tafsirGem:
      "Ibn Kathir relates that sowing corruption includes unjust consumption of resources and disrupting ecosystems entrusted to us.",
    scholarVoice:
      "Mufti Menk: 'Caring for the earth is part of worship; it reflects appreciation of the Creator's gifts.'",
    reflection:
      "Audit your daily routine for one habit you can adjust to reduce waste.",
    learningTarget: "Adopt eco-conscious habits as spiritual responsibility.",
  },
  {
    id: "application_3",
    round: "application",
    theme: "Resilience and Patience",
    ayahReference: "Surah Ash-Sharḥ 94:7-8",
    excerpt: "فَإِذَا فَرَغْتَ فَٱنصَبْ وَإِلَىٰ رَبِّكَ فَٱرْغَب",
    translation: "So when you are free, then strive hard, and to your Lord turn your desire.",
    prompt:
      "What practical rhythm do scholars encourage based on these verses?",
    options: [
      {
        id: "a",
        text: "Cycle between purposeful effort and heartfelt devotion, never drifting into aimlessness.",
        isCorrect: true,
        rationale:
          "Tafsir scholars describe a believer transitioning from one beneficial endeavor to another while renewing intention.",
      },
      {
        id: "b",
        text: "Work intensely for a year, then rest entirely for another year.",
        isCorrect: false,
        rationale: "The verse calls for consistent effort, not prolonged abandonment.",
      },
      {
        id: "c",
        text: "Detach worship from work responsibilities.",
        isCorrect: false,
        rationale: "The verse integrates both, guiding believers to turn to Allah through and after their tasks.",
      },
      {
        id: "d",
        text: "Reserve du'a only for emergencies.",
        isCorrect: false,
        rationale: "The verse nurtures continuous yearning towards Allah, not sporadic devotion.",
      },
    ],
    tafsirGem:
      "Imam ash-Shanqiti interprets 'fansab' as engaging with the next act of worship or service energetically once one task concludes.",
    scholarVoice:
      "Imam al-Biqā'i: 'Your heart should always have a destination: longing for your Lord.'",
    reflection:
      "Plan a mini-ritual to transition from daily work into evening worship with presence.",
    learningTarget: "Design sustainable rhythms of effort and devotion.",
  },
]
