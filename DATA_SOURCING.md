# Furqan — Data Sourcing Plan

Status: **research complete, no importers built yet**. Last verified 2026-07-06.

This is the acquisition plan for the offline datastore. Read alongside the
"Data Sourcing" and "Data Integrity Rules" sections of `CLAUDE.md`.

---

> ⚠️ **SPIKE UPDATE (2026-07-06): read "Spike results" at the bottom first.**
> Inspecting the actual TEI data changed the plan. Corpus Coranicum's variant
> readings are **transliteration-only (no Arabic rasm)** and carry **no
> per-variant source**. It is the scholarly *apparatus + Ḥafṣ Arabic baseline*,
> but the Arabic Ḥafṣ-vs-Warsh side-by-side needs a full Arabic Warsh mushaf
> (King Fahd). The sections below predate that finding.

## Verdict: Corpus Coranicum is the primary spine

The big finding: **Corpus Coranicum** (Berlin-Brandenburg Academy) publishes a
full TEI/XML critical edition that maps 1:1 onto our schema, under a license we
can bundle. It collapses what CLAUDE.md feared was the biggest labor sink
(word-level Ḥafṣ↔Warsh alignment) into an ingest job, because the alignment is
already done and keyed.

- Repo: `github.com/telota/corpus-coranicum-tei`
- Site: `corpuscoranicum.org`
- **License: CC BY-SA 4.0** — bundleable offline *with attribution + share-alike*
  (see License Obligations below).

### What the repo gives us (all verified in the raw XML)

| File | Contents | Feeds table |
|------|----------|-------------|
| `data/cairo_quran/*` | 1924 Cairo/Bulaq edition (Ḥafṣ) text, unique IDs for **surah, verse, and word** | `ayah` + the canonical tokenization |
| `data/quran_variants/allvariants.xml` | Variant readings, each keyed `n="SSS:AAA:WWW"`, with reader + source refs | `variant` |
| `data/quran_variants/reader.xml` | Authority file: reader ID → reader name | `transmission` |
| `data/quran_variants/sources.xml` | Authority file: source ID → citation | `source` |
| `data/quran_manuscripts/*` | 2,500+ manuscripts, TEI msDesc (Sanaa etc.) | manuscript notes |
| `data/quran_commentary/*` | Per-surah commentary, translations, cross-references | `cross_ref` (Qur'an↔Qur'an) |
| `data/quran_concordance/*` | Grammatically parsed words | word-by-word morphology (optional) |
| `data/quran_intertexts/*` | Pre-Qur'anic texts | context (optional) |

### The verified variant record (the linchpin)

```xml
<item xml:id="variant_28">
  <persName key="variantreader_12">Ṭalḥa b. Muṣarrif</persName>   <!-- → transmission -->
  <title key="variantsource_"/>                                   <!-- → source -->
  <ab>
    <w n="020:002:001">mā</w>                                     <!-- surah:ayah:word -->
    <w n="020:002:002">nuzzila</w>
  </ab>
</item>
```

`n="020:002:001"` = surah 20, verse 2, word 1 — exactly our `variant` join key,
and it ties to the `cairo_quran` word IDs. Confirmed working.

---

## Secondary / enhancement sources (optional, not core)

| Source | Use | Format | Catch |
|--------|-----|--------|-------|
| **Tanzil** (tanzil.net) | Nicer Uthmani rendering of Ḥafṣ than the 1924 plain text, if wanted | UTF-8, multiple scripts | License forbids *altering* the text; must attribute. Not needed if `cairo_quran` suffices. |
| **QUL** (qul.tarteel.ai) | Translations, tafsir, word-by-word audio timestamps | SQLite + JSON | **Ḥafṣ-only** — no qira'āt. Enhancement layer only. |
| **King Fahd Complex** (qurancomplex.gov.sa) | **Full Warsh/Qālūn āyah text** for side-by-side display | SQL, Excel | Restrictive redistribution — verify terms before bundling. (Server blocks datacenter IPs; fetch from a normal browser.) |
| **sunnah.com** (official) | Hadith for `cross_ref` / `source` | API (key-gated) + offline dump | Has proper references + grading. This is the one to use. |

### Rejected

- **AhmedBaset/hadith-json** and other scraped hadith JSON — **no license, and no
  grading/isnad/citation fields**, only text + IDs. Fails the `source` table's
  entire purpose. Do not use. Convenience is not worth an unsourced corpus in an
  app whose credibility *is* citations.

---

## Caveats found in the data (must handle at ingest)

1. **Empty source keys exist.** The sample `variant_28` had
   `<title key="variantsource_"/>` — blank. Some variants carry no source.
   This directly violates our "no orphan claims" rule.
   → **Ingest policy:** a variant with an empty `variantsource` is either
   dropped or flagged `unsourced` and never rendered as a claim. Decide, then
   enforce at import time, not in the UI.

2. **Readers are a broad scholarly set, not just canonical riwāyāt.** The
   apparatus includes early/companion readers (e.g. Ṭalḥa b. Muṣarrif), not only
   Ḥafṣ / Warsh. Good for source-critical depth; means the UI must *select*
   which readers to surface. Locate Ḥafṣ and Warsh IDs in `reader.xml` first.

3. **The apparatus gives variant words only, not the full āyah per reader.** To
   show a *whole* Warsh āyah beside a whole Ḥafṣ āyah, we need either the full
   Warsh mushaf (King Fahd) or to reconstruct by applying variants onto the
   Ḥafṣ baseline (fragile — avoid). The *highlighting* of the differing word,
   though, comes straight from Corpus Coranicum.

4. **King Fahd terms unverified** (server refused the fetch). Confirm
   redistribution is allowed before bundling Warsh full text. If not, the
   full-āyah Warsh layer is blocked and we fall back to CC variants only.

---

## License obligations — FUTURE IMPLEMENTATION NEEDS

These bind because the app **bundles** data offline (redistribution).

- [ ] **`data/LICENSES.md`** — one entry per dataset: name, URL, license, exact
      attribution string, any no-alter/share-alike clause. Nothing ships without
      a row here.
- [ ] **Corpus Coranicum = CC BY-SA 4.0 → share-alike.** The portions of
      `quran.db` derived from CC data (and arguably the DB as a whole) must be
      released **CC BY-SA 4.0** with attribution to Corpus Coranicum e.V. /
      Berlin-Brandenburg Academy. This is a constraint on the *shipped data
      license*, independent of the app code's license. Decide how to state it
      (an in-app "Sources & Licenses" screen + a LICENSE-DATA file).
- [ ] **Tanzil** (if used) — verify no-alter + attribution wording from
      tanzil.net/download and record it.
- [ ] **King Fahd** (if used) — verify redistribution permitted; record terms.
- [ ] **sunnah.com** — record API terms + attribution for bundled hadith.

## Pipeline (planned, not built)

```
data/raw/  (gitignored, large)
  corpus-coranicum-tei/  ← git clone or release download  [PRIMARY]
  kingfahd-warsh.sql     ← optional, full Warsh text
  sunnah-dump/           ← optional, hadith
        │
        ▼  scripts/  (Python)
  parse TEI → normalize to cairo_quran word IDs (SSS:AAA:WWW)
  every row emits a `source` row; empty-source variants filtered per policy
        │
        ▼
  build assets/quran.db  (SQLite + FTS5)
  ayah / variant / transmission / cross_ref / source
        │
        ▼
  bundled → copied to app storage on first launch (DB_SCHEMA_VERSION gates)
```

## Recommended build order

1. Write `data/LICENSES.md` with the Corpus Coranicum CC BY-SA row first.
2. Clone the TEI repo; inspect `reader.xml` / `sources.xml` to map reader+source
   IDs to names, and locate Ḥafṣ + Warsh.
3. **One-passage spike** (per CLAUDE.md) against Corpus Coranicum: pick one
   contested āyah, pull its `allvariants` rows + reader + source, build the
   `variant`/`transmission`/`source` rows, prove the side-by-side highlight
   end-to-end. Decide the empty-source policy here on real data.
4. Only then generalize the importer.

## Decisions (resolved 2026-07-06)

- **v1 transmission scope** → **ingest the whole apparatus** (all readers), but
  **render only Ḥafṣ + Warsh** by default. DB holds everything; a reader-picker
  is a later UI-only change. Empty-source filter still applies to all readers.
- **Hadith** → **official sunnah.com only.** Scraped sets are unsourced, rejected.
- **Full Warsh āyah display** → **defer to v2.** v1 ships **word-level variant
  highlighting only**: show the Ḥafṣ āyah, highlight varying words, tap → variant
  reading + reader + source. Needs only Corpus Coranicum; no King Fahd license
  risk, no cross-tokenization alignment.
  - **Reconstruction (apply variants onto Ḥafṣ) is rejected** — it synthesizes
    scripture text from a diff, which is "manufactured variance" per the Data
    Integrity Rules.
  - Full parallel-mushaf view (King Fahd Warsh text as its own `ayah` rows) is a
    v2 enhancement, gated on verifying King Fahd's redistribution license and
    building a King-Fahd↔Corpus-Coranicum word-ID alignment map.

---

## Spike results (2026-07-06) — inspected the actual TEI data

Cloned `telota/corpus-coranicum-tei` (sparse: `quran_variants` + `cairo_quran`)
and read the raw XML. What the join chain actually looks like:

### ✅ What works

- **Word-position key**: variants use `n="020:009:001"` (surah:ayah:word). Solid.
- **Variant → reader**: `<persName key="variantreader_12">` resolves to
  `reader.xml`'s `<person xml:id="variantsreader_12">`. Ḥafṣ = reader **129**,
  **Warsh = reader 54** (358 variants), Nāfiʿ = 41. 18,000 variant items, 870
  readers total.
- **Reader metadata is rich**: display name, `residence`, `death`, sigle, and a
  classical bibliographic `<note>` — e.g. Warsh cites *Ġāyat an-Nihāya* I no.2090
  + *Maʿrifat al-qurrāʾ* (aḏ-Ḏahabī). 331/870 readers carry such a ref; all the
  canonical readers do.
- **Ḥafṣ Arabic baseline**: `cairoquran.xml` has fully diacritized Arabic keyed
  `xml:id="w-020-009-001"` (e.g. `وَهَلۡ`, `أَتَىٰكَ`). Isomorphic to the variant
  key — join is a one-line format swap (`w-SSS-AAA-WWW` ↔ `SSS:AAA:WWW`).

### ❌ Two hard gaps (both material to the core feature)

1. **Variant readings are transliteration-only — NO Arabic rasm.** Every
   variant word is Latin scholarly translit (`wa-hal_`, `atāka`); the Arabic
   sub-element `<w xml:lang="ara"/>` is **empty in all 34,172 cases** (3 Arabic
   characters in the entire 8.6 MB file). So Corpus Coranicum tells you *where* a
   variant is, *who* reads it, and its *transliteration* — but **not the Arabic
   letters of the variant reading.** The headline "Arabic Ḥafṣ-vs-Warsh rasm,
   per-letter highlight" **cannot be built from CC alone.**

2. **No per-variant source.** `<title key="variantsource_"/>` is **empty in all
   18,000 items** — zero populated. `sources.xml` exists (edited by M. Marx et
   al.) but is not wired to individual variants in this dump. Provenance is only
   available at **reader level** (the `reader.xml` bibliographic note).

### Ingest gotchas found

- Key-prefix inconsistency: allvariants `variantreader_N` vs reader.xml
  `variantsreader_N` (extra `s`); the numbers align, the string doesn't.
- Baseline word-id format differs from variant key (dash vs colon, `w-` prefix).
- Junk reader entries exist (e.g. `variantsreader_268` = "leer (ex-Warš …)").

### Revised architecture — two tracks, not one spine

The single-spine idea is wrong. Split by feature:

- **Track A — Arabic side-by-side (headline).** Needs two *full Arabic mushafs*:
  Ḥafṣ (CC `cairoquran` ✅, or Tanzil Uthmani) **+ Warsh Arabic**. Word-align,
  diff, highlight. **Warsh Arabic exists only at King Fahd** — Tanzil and QUL are
  both Ḥafṣ-only (verified). → **King Fahd Warsh is now a REQUIRED, v1 dependency,
  and its restrictive/unverified license is the project's #1 risk.**
- **Track B — critical apparatus (depth).** CC `allvariants` → the who-reads-
  what map across 870 readers (incl. non-canonical / companion codices),
  transliterated, reader-sourced, + manuscripts + commentary. Layers on top of
  Track A. This is CC's real strength and it works today.

### Citation model (revised)

Every rendered variant is sourced at **reader-attribution level**: "reader X
reads this; X is a documented canonical reader per *Ġāya* / *Maʿrifat al-qurrāʾ*
(vol/no. from `reader.xml`)." This satisfies "no orphan claims" and matches how
qirāʾāt are actually cited — but be **transparent in-app** that the source
attests the *reader*, not the specific word-instance. Per-word primary sourcing
is not recoverable from this dump (maybe from corpuscoranicum.org's site/API —
unverified).

### The decision this forces

How to render a variant in **Arabic**?

- **Option 1 (true feature):** bundle King Fahd Warsh Arabic. Blocked on
  license verification + a King-Fahd↔CC word alignment. Restores real Arabic
  side-by-side.
- **Option 2 (CC-only v1):** show Ḥafṣ āyah in Arabic, highlight the varying
  word, and display the variant as **transliteration + reader + provenance** on
  tap. Ships today, fully sourced, but the variant itself is not in Arabic —
  a weaker version of the core promise.
- **Rejected:** transliteration→Arabic back-conversion (manufactures rasm →
  violates Data Integrity Rules).

**Recommended:** verify the King Fahd license *first* (it gates the headline
feature), and in parallel build Track B from CC (works now). Don't commit the
DB schema until the King Fahd question is answered.

### Warsh Arabic source located (2026-07-06)

`github.com/thetruetruth/quran-data-kfgqpc` — a GitHub **mirror of KFGQPC data**
(credits King Fahd Complex, links `qurancomplex.gov.sa/en/techquran/dev/`).
Contains **9 narrations in Arabic Uthmanic script** incl. Warsh + Qaloon, as
JSON/SQL/XML/CSV/XLSX. **This clears the technical blocker on Track A** — the
Arabic Warsh text is fetchable here (no datacenter-IP block, unlike King Fahd's
own server).

Caveats:
- **Ayah-level only, no per-word IDs.** For word highlighting, tokenize each āyah
  (whitespace split) and align Ḥafṣ↔Warsh word indices per verse. Scope is one
  verse at a time; CC's Ḥafṣ word tokenization is the alignment reference.
- **License NOT cleared by this repo.** The mirror's "you may use … download or
  CDN" is the repo owner's line; the owner isn't the rightsholder. Authoritative
  terms are **KFGQPC's own**, at `qurancomplex.gov.sa/en/techquran/dev/`. That
  portal is King Fahd's *"Holy Quran Software Developers Platform"* (published
  for developers → permissive intent), but the formal redistribution/offline-
  bundling clause is unread (their server blocks automated fetches).
  → **ACTION (human, browser): read King Fahd's dev-portal terms and record them
  in `data/LICENSES.md`.** Until then, treat Track A's Warsh text as
  *technically available, license-pending.*

### License resolution (2026-07-06)

King Fahd's own site (`qurancomplex.gov.sa` → `66.9.131.70`; also `.org` →
`192.129.223.122`) is **unreachable** from outside SA — both hosts time out /
refuse for the user (AU) and for automated fetch. The URL is correct; the server
is down or geo-blocked. The **KFGQPC license** was recovered via search (Open Hub):

> "Permission is granted, free of cost, to any person… the rights to **Use,
> Copy, and Distribute**, subject to: the Font Software cannot be **Sold,
> Modified, Altered, Translated, Reverse Engineered**…"

- ✅ **Bundling offline is permitted** (free, distribution granted).
- ❌ **No modification** — ship verbatim (matches our "store rasm exactly as
  sourced" rule — no conflict).
- ⚠️ Written for the **Font Software** → clears the Uthmanic font we bundle
  anyway; dataset-vs-font coverage not explicit. **Risk downgraded** #1 → low
  residual. Proceed; confirm when King Fahd's page is reachable.

### Track A spike results (2026-07-06) — ran a real Ḥafṣ↔Warsh diff

Pulled `hafsData_v18.json` + `warshData_v10.json` from the KFGQPC mirror and
diffed al-Baqara. Script: `scratchpad/spike_track_a.py`. Three findings:

1. **Verses do NOT align by number.** Ḥafṣ = 6236 ayat (Kufan count), Warsh =
   6214 (Madinan count); **50/114 suras have different verse counts.** A naive
   `(sura, aya_no)` join compares *unrelated verses* — e.g. Ḥafṣ **2:132**
   ("wa-waṣṣā…") vs Warsh **2:132** ("am kuntum…", = Ḥafṣ 2:133). The matching
   verse is Warsh **2:131**. → Track A needs a **Kufan↔Madinan verse map**
   (documented ʿadd al-āy, finite, build once) or content-based verse alignment.

2. **Raw string diff MANUFACTURES variants.** After correct alignment
   (Ḥafṣ 2:132 ↔ Warsh 2:131), a positional diff flags **8 of 16 words as
   differing** — but only **one** is a genuine reading variant (وَوَصَّىٰ *waṣṣā*
   vs وَأَوْص۪ىٰ *awṣā*). The other 7 are **orthographic-convention noise**: Warsh's
   mushaf writes hamza/wasla, long vowels, and pause marks differently
   (ٱللَّهَ vs اَ۬للَّهَ, إِبۡرَٰهِـۧمُ vs إِبْرَٰهِيمُ, بَنِيهِ vs بَنِيهِۖ — same words). Diffing raw
   text = fabricated variance = **violates the Data Integrity Rules.**

3. **⇒ Track A REQUIRES Track B.** Neither source works alone:
   - Corpus Coranicum knows *which* words are genuine variants + reader + source,
     but has no Arabic rasm.
   - KFGQPC has the Arabic rasm, but a text diff can't tell a real variant from
     spelling-convention noise, and its verses don't align by number.
   - **Synthesis:** CC apparatus = ground truth for *where* a genuine variant is;
     KFGQPC = the Arabic glyphs to *render*. Highlight only CC-flagged words. This
     makes the headline feature both possible **and** honest (no manufactured
     variance).

Schema gotchas: hafs key `sora` vs warsh key `sura_no`; `aya_text` carries a
trailing verse-number glyph + the ۞ ruku ornament (strip before tokenizing).

**Revised architecture:** the two "tracks" are not parallel — they're one
pipeline. CC provides Ḥafṣ baseline + variant/reader/source ground truth;
KFGQPC provides the per-riwāya Arabic text keyed through a verse-alignment map;
the UI highlights exactly the CC-flagged variant words in the KFGQPC Arabic.

### Join spike results (2026-07-06) — PIPELINE PROVEN. Script: `scratchpad/spike_join.py`

The last unknown (CC word-id ↔ KFGQPC token) is resolved. **Green light.**

- **Join A — word alignment: ✅ 99.9%.** CC (`cairoquran`, 77,432 words) vs KFGQPC
  Ḥafṣ tokens match across all 6236 verses with only **4 word-count mismatches**
  (15:7, 27:20, 36:22, 73:20 — off-by-one word-boundary cases; enumerable,
  hand-fixable). Word text matches (modulo cosmetic tatweel/notation). So a CC
  variant word-id lands on the correct KFGQPC token.
- **Join B — variant landing: ✅.** CC's flagged word-position hits the word that
  actually differs:
  - 2:132 → word 1 (وَوَصَّىٰ) flagged for **Nāfiʿ** (Warsh's qāriʾ), Ibn ʿĀmir,
    Ḫalaf, Abū Jaʿfar … the waṣṣā/awṣā word. Also word 3 (Ibrāhīm) + Ibn Masʿūd
    whole-verse codex variant.
  - 37:12 → word 2 (عَجِبۡتَ) flagged for **Ḥamza**, the Prophet, Ibn Masʿūd —
    matches the nquran.com oracle exactly.

**Confirmed limitations (honest, acceptable):**
- CC flags at **qāriʾ level** (Nāfiʿ), not sub-transmitter → map Warsh → Nāfiʿ.
- KFGQPC mirror has **8 riwāyāt**; variants whose reader is outside those 8
  (Ibn Masʿūd codex, Ḥamza-only, etc.) can be **flagged + cited** from CC but not
  **rendered in Arabic** → fall back to transliteration for those.

### Pipeline (proven, ready to build)

```
CC cairoquran   → ayah (Ḥafṣ baseline, Arabic, word-tokenized, Kufan)
CC allvariants  → variant  (word-position + reader), reader.xml → transmission + source
KFGQPC hafs/warsh/… → per-riwāya Arabic text, verse-aligned (Kufan↔Madinan map),
                      word-position aligned to CC (99.9%, +4 exceptions)
UI: highlight CC-flagged word(s); render each riwāya's Arabic from KFGQPC;
    show reader + provenance on tap; translit fallback when no KFGQPC text.
```

Remaining pre-build tasks (small): (1) Kufan↔Madinan verse map for the 50
diverging suras; (2) reconcile the 4 word-boundary mismatches; (3) Warsh→Nāfiʿ
(and other riwāya→qāriʾ) reader map. None are blockers — all enumerable.
