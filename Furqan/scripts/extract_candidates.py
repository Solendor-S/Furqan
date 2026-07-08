"""
Extract uncurated genuine farsh-fork candidates for Abū ʿAmr and Ibn Kathīr, for
gloss curation. A candidate = a Ḥafṣ word position where Ḥafṣ≈Warsh (same skeleton)
but the third reading forks (different skeleton), excluding notational noise
(Ibrāhīm spelling, hamza facilitation, madd, Ibn Kathīr's ṣilat mīm). Already-curated
positions (in farsh-*.json) are dropped.

Output: temp/abuamr-candidates.json, temp/bazzi-candidates.json
  [{ ref, idx, hafs, warsh, abuamr, bazzi }]  — Arabic forms are authoritative (KFGQPC).
"""
import json, pathlib, sys, re
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _skel import skel

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data"
TEMP = ROOT / "temp"; TEMP.mkdir(exist_ok=True)

# alef / hamza / madd / ṣila notation marks — stripping these leaves the consonant core
NOTE = "".join(chr(c) for c in [
    0x0621, 0x0622, 0x0623, 0x0624, 0x0625, 0x0626, 0x0627, 0x0671,  # hamza + alef seats
    0x0670, 0x06E4, 0x06E5, 0x06E6, 0x0653, 0x0654, 0x0655,          # dagger alef, madda, ṣila
    0x06EB, 0x06EC, 0x06DF, 0x06E0, 0x0674,                          # small high marks
])
IBRAHIM = "".join(chr(c) for c in [0x0628, 0x0631, 0x0627, 0x0647])  # ب ر ا ه

def sk(t): return skel(t, keep_dagger=True)

def noise_only(a, b):
    """True if a,b differ only by notation, not a real consonantal/morph fork."""
    na, nb = sk(a), sk(b)
    if IBRAHIM[:3] in na or IBRAHIM[:3] in nb:      # Ibrāhīm superscript vs full yā (ب ر ا)
        pass  # (kept for readability; real check below)
    strip = lambda s: re.sub(f"[{re.escape(NOTE)}]", "", s)
    if strip(na) == strip(nb):                       # hamza/madd/ṣila/alef-notation only
        return True
    return False

def curated_set(fname):
    d = json.load(open(ROOT / "data" / fname, encoding="utf-8"))
    return {(e["ref"], e["idx"]) for e in d["entries"]}

def collect(reading, already):
    hits = []
    for s in range(1, 115):
        d = json.load(open(OUT / f"surah-{s}.json", encoding="utf-8"))
        for v in d["verses"]:
            a = v["hafs_aya"]
            for i, (h, w, x) in enumerate(zip(v["hafs"], v["warsh"], v[reading])):
                if not (h and w and x):
                    continue
                if sk(h) != sk(w):        # not a Ḥafṣ≈Warsh position → belongs to reading tier
                    continue
                if sk(x) == sk(h):        # this reading agrees with Ḥafṣ → no fork
                    continue
                if (f"{s}:{a}", i) in already or noise_only(h, x):
                    continue
                hits.append({"ref": f"{s}:{a}", "idx": i,
                             "hafs": v["hafs"][i], "warsh": v["warsh"][i],
                             "abuamr": v["abuamr"][i], "bazzi": v["bazzi"][i]})
    return hits

ab = collect("abuamr", curated_set("farsh-abuamr.json"))
bz = collect("bazzi", curated_set("farsh-bazzi.json"))
json.dump(ab, open(TEMP / "abuamr-candidates.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(bz, open(TEMP / "bazzi-candidates.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"abuamr candidates: {len(ab)} -> temp/abuamr-candidates.json")
print(f"bazzi  candidates: {len(bz)} -> temp/bazzi-candidates.json")
