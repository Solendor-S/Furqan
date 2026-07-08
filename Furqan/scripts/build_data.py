"""
Build per-surah comparison data for Furqan.

Inputs  (data/raw/, gitignored):
  hafs.json, warsh.json   — KFGQPC Arabic text, ayah-level (Kufan / Madinan counts)
  allvariants.xml         — Corpus Coranicum variant apparatus (reader-flagged)

Output  (public/data/):
  surah-{n}.json          — per Hafs verse: aligned Hafs/Warsh tokens + tiers
  index.json              — surah list

Per verse the two token arrays are equal length (Warsh aligned to Hafs word
positions; "" marks a word with no counterpart, e.g. the basmala). Tiers:
  reading = Hafs word positions Corpus Coranicum flags for Nafi'/Warsh (qiraa variant)
  ortho   = aligned pair whose raw text differs but is NOT a reading variant
"""
import json, re, pathlib, sys
from difflib import SequenceMatcher

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _skel import skel, norm  # shared consonantal-skeleton normalizer

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)

hafs = json.load(open(RAW / "hafs.json", encoding="utf-8"))
warsh = json.load(open(RAW / "warsh.json", encoding="utf-8"))
doori = json.load(open(RAW / "doori.json", encoding="utf-8"))  # Abū ʿAmr al-Baṣrī, al-Dūrī
bazzi = json.load(open(RAW / "bazzi.json", encoding="utf-8"))  # Ibn Kathīr al-Makkī, al-Bazzī

# Word-by-word English + transliteration (quran.com API, QPC segmentation).
# { "sura:aya": [[translation, translit], ...] } aligned to hafs tokens 1:1.
wbw = json.load(open(RAW / "wbw-en.json", encoding="utf-8"))

# English translation (Pickthall, public domain) — "chapter|verse|text" per line.
pickthall = {}
for line in open(RAW / "pickthall.txt", encoding="utf-8"):
    parts = line.rstrip("\n").split("|", 2)
    if len(parts) == 3 and parts[0].isdigit():
        pickthall[(int(parts[0]), int(parts[1]))] = parts[2]

def clean(t): return re.sub(r"[٠-٩0-9۞]", "", t)
def tok(t): return [w for w in clean(t).split() if w.strip()]

# skel(t, keep_dagger) / norm(t): consonantal-skeleton normalizer — see scripts/_skel.py

# --- curated farsh: (sura,aya) -> list of {idx, hafs, warsh} for the genuine
# MEANING variant, hand-placed. Only entries with an 'idx' are shown as reading
# variants; un-curated entries stay minor differences.
farsh = json.load(open(ROOT / "data" / "farsh-hafs-warsh.json", encoding="utf-8"))
farsh_by_verse = {}
for e in farsh["entries"]:
    if "idx" not in e:
        continue
    s_, a_ = re.match(r"(\d+):(\d+)", e["ref"]).groups()
    farsh_by_verse.setdefault((int(s_), int(a_)), []).append(
        {"idx": e["idx"], "hafs": e["hafs"], "warsh": e["warsh"]})

# --- genuine Abū ʿAmr farsh: (sura,aya) -> list of {idx, shared, abuamr}. These
# are positions where Ḥafṣ and Warsh agree but Abū ʿAmr reads differently, so
# they only surface a variant when the Abū ʿAmr column is shown.
abuamr_farsh = json.load(open(ROOT / "data" / "farsh-abuamr.json", encoding="utf-8"))
ABUAMR_CITE = abuamr_farsh["cite"]
abuamr_by_verse = {}
for e in abuamr_farsh["entries"]:
    s_, a_ = re.match(r"(\d+):(\d+)", e["ref"]).groups()
    abuamr_by_verse.setdefault((int(s_), int(a_)), []).append(e)

# --- genuine Ibn Kathīr (Bazzī) farsh: same shape/mechanism as Abū ʿAmr above.
bazzi_farsh = json.load(open(ROOT / "data" / "farsh-bazzi.json", encoding="utf-8"))
BAZZI_CITE = bazzi_farsh["cite"]
bazzi_by_verse = {}
for e in bazzi_farsh["entries"]:
    s_, a_ = re.match(r"(\d+):(\d+)", e["ref"]).groups()
    bazzi_by_verse.setdefault((int(s_), int(a_)), []).append(e)

# --- group tokens by surah, keeping (aya, token) and per-verse structure
def by_surah(rows, skey):
    d = {}
    for r in rows:
        d.setdefault(r[skey], []).append((r["aya_no"], r["aya_text"]))
    return d

Hs = by_surah(hafs, "sora")
Ws = by_surah(warsh, "sura_no")
Ds = by_surah(doori, "sura_no")
Bs = by_surah(bazzi, "sura_no")
names = {r["sora"]: (r["sora_name_en"], r["sora_name_ar"].strip()) for r in hafs}

def align(hflat, xflat):
    """hafs global word idx -> other-reading global word idx (content alignment)."""
    sm = SequenceMatcher(a=[norm(w) for *_, w in hflat],
                         b=[norm(w) for *_, w in xflat], autojunk=False)
    h2x = {}
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag in ("equal", "replace"):
            for k in range(max(i2 - i1, j2 - j1)):
                if i1 + k < i2 and j1 + k < j2:
                    h2x[i1 + k] = j1 + k
    return h2x

index = []
wbw_skipped = []
for s in range(1, 115):
    hverses = Hs[s]                      # [(aya, text)]
    # flat token streams (aya, word-idx, token) for each reading
    hflat = [(a, i, w) for (a, txt) in hverses for i, w in enumerate(tok(txt))]
    wflat = [(a, i, w) for (a, txt) in Ws[s] for i, w in enumerate(tok(txt))]
    dflat = [(a, i, w) for (a, txt) in Ds[s] for i, w in enumerate(tok(txt))]
    bflat = [(a, i, w) for (a, txt) in Bs[s] for i, w in enumerate(tok(txt))]
    h2w = align(hflat, wflat)   # Hafs idx -> Warsh idx
    h2d = align(hflat, dflat)   # Hafs idx -> Abū ʿAmr (Dūrī) idx
    h2b = align(hflat, bflat)   # Hafs idx -> Ibn Kathīr (Bazzī) idx

    # assemble per Hafs verse
    verses = []
    gi = 0
    for (a, txt) in hverses:
        htoks = tok(txt)
        hafs_arr = list(htoks)
        # Align each other reading to Hafs word positions ("" = no counterpart).
        # Add a transmission by extending this list — the rest of the loop is generic.
        aligned = {}  # name -> (word_arr, ayas)
        for name, h2x, xflat in (("warsh", h2w, wflat), ("abuamr", h2d, dflat), ("bazzi", h2b, bflat)):
            arr, ayas = [], []
            for i in range(len(htoks)):
                xj = h2x.get(gi + i)
                arr.append(xflat[xj][2] if xj is not None else "")
                if xj is not None:
                    ayas.append(xflat[xj][0])
            aligned[name] = (arr, ayas)
        gi += len(htoks)
        warsh_arr, warsh_ayas = aligned["warsh"]
        abuamr_arr, abuamr_ayas = aligned["abuamr"]
        bazzi_arr, bazzi_ayas = aligned["bazzi"]

        # how a third reading renders a Ḥafṣ↔Warsh variant word: its own Arabic +
        # whether it votes with Ḥafṣ, with Warsh, or reads distinctly (skeleton match).
        def third_at(i, arr):
            aw = arr[i]
            if not aw:
                return None
            na = skel(aw, keep_dagger=True)
            like = ("hafs" if na == skel(hafs_arr[i], keep_dagger=True)
                    else "warsh" if na == skel(warsh_arr[i], keep_dagger=True)
                    else "distinct")
            return {"ar": aw, "like": like}
        # Only classify words that ACTUALLY differ in the two texts. A CC flag on
        # a word that is identical in the Warsh mushaf is a Nafi'-sub-transmitter /
        # vocalization nuance we cannot show honestly -> not a variant here.
        differ = [i for i in range(len(htoks)) if warsh_arr[i] and warsh_arr[i] != hafs_arr[i]]
        # reading tier = curated MEANING variant, placed by exact word index.
        # Everything else that differs is a minor (spelling/pronunciation) difference.
        meaning = {}
        rd = []
        for e in farsh_by_verse.get((s, a), []):
            i = e["idx"]
            if 0 <= i < len(htoks) and warsh_arr[i] and warsh_arr[i] != hafs_arr[i]:
                rd.append(i)
                m = {"hafs": e["hafs"], "warsh": e["warsh"]}
                ab = third_at(i, abuamr_arr)
                bz = third_at(i, bazzi_arr)
                if ab: m["abuamr"] = ab
                if bz: m["bazzi"] = bz
                meaning[str(i)] = m
        rd = sorted(rd)
        ortho = [i for i in differ if i not in rd]
        # Abū ʿAmr-only variants: Ḥafṣ ≈ Warsh here, Abū ʿAmr forks. Placed by
        # explicit Ḥafṣ word index; sanity-checked that Abū ʿAmr actually differs.
        # Third-reading-only variants: Ḥafṣ ≈ Warsh here, this reading forks. Placed
        # by explicit Ḥafṣ word index; sanity-checked that the reading actually differs.
        def third_only(by_verse, arr, name, label, cite):
            only = []
            for e in by_verse.get((s, a), []):
                i = e["idx"]
                if not (0 <= i < len(htoks)) or not arr[i] or i in rd:
                    continue
                if skel(arr[i], keep_dagger=True) == skel(hafs_arr[i], keep_dagger=True):
                    print(f"  WARN {s}:{a} idx {i}: {label} does not differ from Ḥafṣ "
                          f"({arr[i]!r}) — check farsh-{name}.json")
                    continue
                only.append(i)
                # merge, so a position both readings fork at keeps both entries;
                # cite lives on each fork so an Ibn-Kathīr-only view cites its own mushaf
                m = meaning.setdefault(str(i), {"shared": e["shared"]})
                m[name] = {"ar": arr[i], "gloss": e["abuamr" if name == "abuamr" else "bazzi"], "cite": cite}
            return sorted(only)

        abuamr_only = third_only(abuamr_by_verse, abuamr_arr, "abuamr", "Abū ʿAmr", ABUAMR_CITE)
        bazzi_only = third_only(bazzi_by_verse, bazzi_arr, "bazzi", "Ibn Kathīr", BAZZI_CITE)
        # At a fork, a third reading that does NOT fork here reads the Ḥafṣ/Warsh baseline;
        # record it so the UI names it in the "Ḥafṣ & Warsh" line instead of leaving its
        # (highlighted) word with no gloss row.
        for i_str, mm in meaning.items():
            if "shared" not in mm:
                continue
            i = int(i_str)
            sb = [k for k, arr in (("abuamr", abuamr_arr), ("bazzi", bazzi_arr))
                  if k not in mm and arr[i]
                  and skel(arr[i], keep_dagger=True) == skel(hafs_arr[i], keep_dagger=True)]
            if sb:
                mm["shared_by"] = sb
        v = {
            "hafs_aya": a,
            "warsh_aya": warsh_ayas[0] if warsh_ayas else a,
            "abuamr_aya": abuamr_ayas[0] if abuamr_ayas else a,
            "bazzi_aya": bazzi_ayas[0] if bazzi_ayas else a,
            "hafs": hafs_arr, "warsh": warsh_arr, "abuamr": abuamr_arr, "bazzi": bazzi_arr,
            "reading": rd, "ortho": ortho,
            "abuamr_only": abuamr_only, "bazzi_only": bazzi_only,
            "en": pickthall.get((s, a), ""),
        }
        # word-by-word gloss+translit, aligned to hafs tokens (only if counts match)
        ww = wbw.get(f"{s}:{a}")
        if ww is not None and len(ww) == len(htoks):
            v["wbw"] = ww
        else:
            wbw_skipped.append(f"{s}:{a}")
        if meaning:
            v["meaning"] = meaning
        verses.append(v)

    name_en, name_ar = names[s]
    json.dump({"surah": s, "name_en": name_en, "name_ar": name_ar, "verses": verses},
              open(OUT / f"surah-{s}.json", "w", encoding="utf-8"), ensure_ascii=False)
    index.append({"surah": s, "name_en": name_en, "name_ar": name_ar,
                  "ayat": len(verses),
                  "variant_verses": sum(1 for v in verses if v["reading"]),
                  "abuamr_verses": sum(1 for v in verses if v["abuamr_only"]),
                  "bazzi_verses": sum(1 for v in verses if v["bazzi_only"])})

json.dump(index, open(OUT / "index.json", "w", encoding="utf-8"), ensure_ascii=False)
print(f"wrote {len(index)} surah files + index.json to {OUT}")
tot = sum(x["variant_verses"] for x in index)
tota = sum(x["abuamr_verses"] for x in index)
totb = sum(x["bazzi_verses"] for x in index)
print(f"verses with a Ḥafṣ↔Warsh reading variant: {tot}")
print(f"verses with an Abū ʿAmr-only variant: {tota}")
print(f"verses with an Ibn Kathīr-only variant: {totb}")
print(f"verses without word-by-word (count mismatch): {len(wbw_skipped)} {wbw_skipped}")
