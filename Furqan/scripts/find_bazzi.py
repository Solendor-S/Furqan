"""
Scan for genuine Ibn Kathīr (Bazzī)-only farsh candidates: Ḥafṣ word positions
where Ḥafṣ and Warsh share a consonantal skeleton but Ibn Kathīr's differs.

Skeleton comparison (scripts/_skel.py, keep_dagger=True) strips uṣūl/notation
noise (madd, hamz, ṣila marks) so what survives is a real consonantal fork, not
a spelling convention. These are curation CANDIDATES only — each still needs a
sourced gloss (al-Nashr) before it goes into farsh-bazzi.json.
"""
import json, pathlib, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _skel import skel

OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "data"

hits = []
for s in range(1, 115):
    d = json.load(open(OUT / f"surah-{s}.json", encoding="utf-8"))
    for v in d["verses"]:
        a = v["hafs_aya"]
        for i, (h, w, b) in enumerate(zip(v["hafs"], v["warsh"], v["bazzi"])):
            if not (h and w and b):
                continue
            sh, sw, sb = (skel(h, keep_dagger=True), skel(w, keep_dagger=True),
                          skel(b, keep_dagger=True))
            if sh == sw and sb != sh:
                hits.append((f"{s}:{a}", i, h, w, b))

for ref, i, h, w, b in hits:
    print(f"{ref:>8} idx {i:2d}  H={h}  W={w}  B={b}")
print(f"\n{len(hits)} skeleton-level Ibn Kathīr-only fork candidates")
