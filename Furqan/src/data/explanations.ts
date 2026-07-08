// Variant explanation content. Plain-first (layman); scholarly detail behind a
// "more detail" expander. Curated notes are keyed "surah:aya:word" and are the
// ONLY place a semantic gloss is asserted — never auto-generated. Reading variants
// without a curated entry fall back to a factual generic panel.
// See memory: design-two-audience-explanations, data-track-a-synthesis.

export type Reading = { label: string; gloss: string };

export type ReadingExplanation = {
  headline: string;
  hafs: Reading;
  warsh: Reading;
  note: string;
  detail?: string;   // scholarly layer — opt-in
  cite: string;
};

// Curated, sourced explanations. Key = "surah:aya:wordIndex" (0-based Hafs word).
export const curated: Record<string, ReadingExplanation> = {
  "2:132:0": {
    headline:
      "Both readings say the same thing — Abraham urged his sons to stay true to the faith. They differ only in the exact form of one verb.",
    hafs: {
      label: "Ḥafṣ reading — “waṣṣā”",
      gloss: "“he urged / charged them” — the wording carried in the early copies of Kufa & Basra",
    },
    warsh: {
      label: "Warsh reading — “awṣā”",
      gloss: "“he instructed them / left it as his charge” — the wording in the early copies of Medina & Damascus (one extra letter)",
    },
    note:
      "Same meaning, a slightly different shade — a bit like “he urged them” versus “he left them the instruction.” The two spellings go back to the earliest official copies of the Qurʾan: a few cities wrote this word slightly differently, and each way was recited and passed down faithfully.",
    detail:
      "Morphologically: waṣṣā is form II, awṣā is form IV of the root و-ص-ي — near-synonymous. Rasm follows the regional ʿUthmanic codices: Kufan & Basran without the alif (waṣṣā), Madinan & Syrian with it (awṣā).",
    cite:
      "Variant reading recorded in Corpus Coranicum. City-by-city spelling documented in classical works on the Qurʾanic text (al-Dānī, al-Muqniʿ; Ibn Abī Dāwūd, Kitāb al-Maṣāḥif). Arabic text from the King Fahd Complex. — citations to verify.",
  },
};

// Reading variant with a short curated gloss but no full write-up.
export function genericReading(
  _hafsWord: string,
  _warshWord: string,
  gloss?: { hafs: string; warsh: string },
): ReadingExplanation {
  return {
    headline: "This word is recited differently in the Ḥafṣ and Warsh readings.",
    hafs: { label: "Ḥafṣ ʿan ʿĀṣim", gloss: gloss?.hafs ?? "" },
    warsh: { label: "Warsh ʿan Nāfiʿ", gloss: gloss?.warsh ?? "" },
    note:
      "A genuine reading (qirāʾa) difference — the two transmissions recite this word differently, which can change the sense. A fuller plain-language write-up for this verse is still to come.",
    cite:
      "Curated Ḥafṣ↔Warsh variant (verse list cross-checked against the primary texts); glosses to verify against qirāʾāt literature. Arabic text from the King Fahd Complex, verbatim.",
  };
}

export const orthoExplanation = {
  headline:
    "Same word and meaning — a minor spelling or pronunciation difference between the two traditions.",
  note:
    "Not a different word: either a spelling convention (like “muhammad” vs “mohammad”) or one of Warsh’s regular recitation rules (how hamza, elongation, etc. are pronounced). The word and its meaning are the same. This is not one of the curated meaning variants.",
};
