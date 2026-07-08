# Furqan

**Live:** [furqan-4q7.pages.dev](https://furqan-4q7.pages.dev)

A fully **offline** Qur'an study app focused on **textual variance and
source-critical analysis**. Not a plain reader — the core purpose is
**comparison and critique**, everything citation-backed and on-device.

## Pillars

- **Qira'āt / rasm variants** — compare readings across transmissions
  (Ḥafṣ ʿan ʿĀṣim vs Warsh ʿan Nāfiʿ) word-by-word, with the differing
  rasm/diacritics highlighted.
- **Hadith ↔ Qur'an tensions** — surface where hadith corpora assert claims the
  Qur'an appears to contradict, with citations to both sides and any mainstream
  reconciliation.
- **Manuscripts** — early-codex and palimpsest witnesses (Ṣanʿāʾ 1,
  Ibn Masʿūd / Ubayy reports) where sourced.
- **Morals** — morally-questioned passages, presented neutrally.
- **Word-by-word translation** — tap any word for transliteration + English.

## Data integrity

The truth speaks for itself — **straight, verifiable facts only, no bias.**
Every variant, tension, and claim carries a `source` row. Tensions are quoted
verbatim from both sides, cited, and left to the reader. Mainstream Islamic
reconciliations are included where they exist. This is a critical-edition
apparatus, not polemic.

## Tech stack

Vite + React + bundled SQLite (`@capacitor-community/sqlite`) + Capacitor,
targeting Android. Chromium WebView gives gold-standard Arabic shaping;
per-letter/diacritic highlighting is just a `<span>`. A proper Uthmanic Qur'an
font (KFGQPC) is bundled for rasm fidelity.

## Structure

```
QuranApp/
├── Furqan/             ← All app code (Vite + React + Capacitor)
│   ├── src/            ← React app source
│   ├── assets/         ← Icons, bundled quran.db, Uthmanic fonts
│   ├── scripts/        ← Data-processing / import scripts (Python)
│   └── data/           ← Source texts, variant tables, hadith cross-refs
└── DATA_SOURCING.md    ← Data acquisition notes & licensing
```

## Development

```bash
cd Furqan
npm install
npm run dev          # Vite dev server (browser)
npm run build        # Build web assets → dist/
npx cap sync android # Copy build + plugins into Android project
npx cap run android  # Build & launch on device/emulator
```

The bundled `quran.db` ships in `assets/` and is copied to app storage on first
launch.
