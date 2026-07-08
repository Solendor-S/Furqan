export type Verse = {
  hafs_aya: number;
  warsh_aya: number;
  abuamr_aya: number;
  bazzi_aya: number;
  hafs: string[];
  warsh: string[];   // aligned to hafs positions; "" = no counterpart (e.g. basmala)
  abuamr: string[];  // Abū ʿAmr al-Baṣrī (al-Dūrī), aligned to hafs positions
  bazzi: string[];   // Ibn Kathīr al-Makkī (al-Bazzī), aligned to hafs positions
  reading: number[]; // Hafs word indices that are a curated Ḥafṣ↔Warsh reading variant
  ortho: number[];   // minor differences (spelling / Warsh pronunciation rules)
  abuamr_only: number[]; // Ḥafṣ≈Warsh but Abū ʿAmr differs — shown only with the Abū ʿAmr column
  bazzi_only: number[];  // Ḥafṣ≈Warsh but Ibn Kathīr differs — shown only with the Ibn Kathīr column
  meaning?: Record<string, {
    hafs?: string; warsh?: string;                       // Ḥafṣ↔Warsh variant glosses
    abuamr?: { ar: string; like?: "hafs" | "warsh" | "distinct"; gloss?: string; cite?: string };
    bazzi?: { ar: string; like?: "hafs" | "warsh" | "distinct"; gloss?: string; cite?: string };
    shared?: string;                                     // third-reading-only: the shared Ḥafṣ/Warsh reading (each fork carries its own cite)
    shared_by?: ("abuamr" | "bazzi")[];                  // third readings that also read the shared baseline here
  }>; // keyed by word index
  en: string;        // English translation (Pickthall, public domain) — Hafs reading
  wbw?: [string, string][]; // per-word [translation, transliteration] (quran.com), aligned to hafs tokens
};

export type SurahData = {
  surah: number;
  name_en: string;
  name_ar: string;
  verses: Verse[];
};

export type IndexEntry = {
  surah: number;
  name_en: string;
  name_ar: string;
  ayat: number;
  variant_verses: number;
  abuamr_verses: number;
  bazzi_verses: number;
};

// --- Hadith <-> Qur'an tensions ---
export type TensionVerse = { ref: string; ar: string; en: string };
export type TensionHadith = {
  collection: string; number: string; in_book: string;
  grade: string; narrator: string; ar: string; en: string; url: string;
};
export type TensionScripture = { ref: string; work: string; text: string };
export type TensionReading = { label: string; ar: string; meaning: string; highlight?: string };
export type TensionSection =
  | { kind: "quran"; heading: string; note: string; verses: TensionVerse[] }
  | { kind: "hadith"; heading: string; note: string; hadiths: TensionHadith[] }
  | { kind: "scripture"; heading: string; note: string; passages: TensionScripture[] }
  | { kind: "reading"; heading: string; note: string; ref: string; readings: TensionReading[] };
export type TensionType = "quran-bible" | "quran-hadith" | "quran-quran" | "quran-textual";
// Morals pillar reuses the Tension shape; its category enum is separate.
export type MoralType = "marriage" | "violence" | "slavery" | "women" | "punishment";
export type Tension = {
  id: string;
  type: TensionType | MoralType;
  pinned?: boolean;
  title: string;
  question: string;
  sections: TensionSection[];
  tension: string;
  reconciliations: string[];
  addressing?: {
    note: string;
    points: { verdict: string; text: string }[];
    bottom_line: string;
  };
  sources: string[];
};

// --- in-app navigation ---
export type NavTarget =
  | { view: "readings"; surah: number; aya: number }
  | { view: "tensions"; id: string }
  | { view: "morals"; id: string }
  | { view: "manuscripts"; id: string };

// --- Manuscripts / early codices ---
export type ManuscriptVariant = {
  ref: string; standard: string; manuscript: string; note: string;
};
export type ManuscriptLink = { label: string; url: string };
export type Manuscript = {
  id: string;
  flagship?: boolean;
  name: string;
  summary: string;
  meta: Record<string, string>;
  body: string[];
  variants: ManuscriptVariant[];
  links: ManuscriptLink[];
};
