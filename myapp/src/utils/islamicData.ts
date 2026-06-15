export interface QuranVerse {
  arabic: string;
  translation: string;
  reference: string;
}

export interface Hadith {
  text: string;
  narrator: string;
  source: string;
}

export const verses: QuranVerse[] = [
  {
    arabic: "قُل لِّلْمُؤْمِنِينَ يَغُضُّوا مِنْ أَبْصَارِهِمْ وَيَحْفَظُوا فُرُوجَهُمْ ۚ ذَٰلِكَ أَزْكَىٰ لَهُمْ ۗ إِنَّ اللَّهَ خَبِيرٌ بِمَا يَصْنَعُونَ",
    translation: "Tell the believing men to reduce [some] of their vision and guard their private parts. That is purer for them. Indeed, Allah is Acquainted with what they do.",
    reference: "Surah An-Nur [24:30]"
  },
  {
    arabic: "وَلا تَقْرَبُوا الزِّنَى إِنَّهُ كَانَ فَاحِشَةً وَسَاءَ سَبِيلا",
    translation: "And do not approach unlawful sexual intercourse. Indeed, it is ever an immorality and is evil as a way.",
    reference: "Surah Al-Isra [17:32]"
  },
  {
    arabic: "أَلَمْ يَعْلَم بِأَنَّ اللَّهَ يَرَىٰ",
    translation: "Does he not know that Allah sees?",
    reference: "Surah Al-Alaq [96:14]"
  },
  {
    arabic: "إِنَّ السَّمْعَ وَالْبَصَرَ وَالْفُؤَادَ كُلُّ أُولَٰئِكَ كَانَ عَنْهُ مَسْئُولًا",
    translation: "Indeed, the hearing, the sight and the heart - about all those [one] will be questioned.",
    reference: "Surah Al-Isra [17:36]"
  },
  {
    arabic: "إِنَّ اللَّهَ كَانَ عَلَيْكُمْ رَقِيبًا",
    translation: "Indeed, Allah is ever, over you, an Observer.",
    reference: "Surah An-Nisa [4:1]"
  },
  {
    arabic: "يَعْلَمُ خَائِنَةَ الْأَعْيُنِ وَمَا تُخْفِي الصُّدُورُ",
    translation: "Allah knows the stealthy look of the eyes and what the breasts conceal.",
    reference: "Surah Ghafir [40:19]"
  },
  {
    arabic: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ",
    translation: "And whoever fears Allah - He will make for him a way out and will provide for him from where he does not expect.",
    reference: "Surah At-Talaq [65:2-3]"
  }
];

export const hadiths: Hadith[] = [
  {
    text: "The adultery of the eyes is the looking (at that which is unlawful).",
    narrator: "Abu Hurayrah",
    source: "Sahih al-Bukhari & Sahih Muslim"
  },
  {
    text: "Guaranteed for me six things from yourselves and I will guarantee for you Paradise: be truthful when you speak, fulfill your promises when you make them, fulfill your trusts when you are entrusted, guard your chastity, lower your gaze, and restrain your hands.",
    narrator: "Ubadah ibn as-Samit",
    source: "Musnad Ahmad"
  },
  {
    text: "A man should not look at the private parts of another man, and a woman should not look at the private parts of another woman.",
    narrator: "Abu Sa'id al-Khudri",
    source: "Sahih Muslim"
  },
  {
    text: "Whenever a man is alone with a woman, Satan is the third of them.",
    narrator: "Umar ibn al-Khattab",
    source: "Sunan al-Tirmidhi"
  },
  {
    text: "Modesty (Haya) does not bring anything except good.",
    narrator: "Imran ibn Husayn",
    source: "Sahih al-Bukhari"
  },
  {
    text: "Modesty is part of faith, and faith is in Paradise, but obscenity is part of hardness of heart, and hardness of heart is in the Fire.",
    narrator: "Abu Hurayrah",
    source: "Sunan al-Tirmidhi"
  }
];

export const motivations: string[] = [
  "Modesty (Haya) is a branch of Faith. Guard your eyes, guard your heart.",
  "Every look at unlawful content leaves a dark spot on the heart. Polish your heart with repentance (Tawbah).",
  "Your eyes are a trust (Amanah) from Allah. Use them to look at what pleases Him.",
  "Shaytan promises you poverty and orders you to immorality, while Allah promises you forgiveness from Him and bounty.",
  "True strength is controlling your desires for the sake of Allah. The reward for self-restraint is unmatched.",
  "Stay strong. Each second you resist a temptation, you are gaining immense rewards.",
  "Allah is closer to you than your jugular vein. Seek refuge in Him from temptation (Say: A'udhu Billahi minash-shaytanir-rajim).",
  "You are stronger than the algorithm designed to keep you hooked. Choose modesty. Choose Allah's pleasure."
];

export function getRandomAyah(): QuranVerse {
  const idx = Math.floor(Math.random() * verses.length);
  return verses[idx];
}

export function getRandomHadith(): Hadith {
  const idx = Math.floor(Math.random() * hadiths.length);
  return hadiths[idx];
}

export function getRandomMotivation(): string {
  const idx = Math.floor(Math.random() * motivations.length);
  return motivations[idx];
}
