"""
Locate genuine Abū ʿAmr (Dūrī) farsh variants for curation.

Given a list of (surah, hafs_aya, hafs_word_skeleton), find the Ḥafṣ word index
and report the Ḥafṣ / Warsh / Abū ʿAmr forms + whether Abū ʿAmr genuinely
differs (consonantal skeleton), so uṣūl/orthographic (hamzat-waṣl notation)
noise is stripped. Uses the shared skel() (scripts/_skel.py) with keep_dagger=True,
so its skeletons match build_data.py exactly (no drift).
"""
import json, pathlib, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _skel import skel  # shared consonantal-skeleton normalizer

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data"

# (surah, hafs_aya, skeleton-of-Hafs-word-to-find)
targets = [
    (12, 12, "يرتع"),          # yartaʿ
    (12, 12, "ويلعب"),         # wa-yalʿab
    (2, 283, "فرهان"),         # fa-rihān
    (20, 63, "هاذان"),         # hādhāni (two dagger alefs)
    (20, 102, "ينفخ"),         # yunfakh
    (22, 38, "يدافع"),    # yudāfiʿ
    (22, 51, "معاجزين"),  # muʿājizīn
    (2, 48, "يقبل"),           # yuqbal
    (2, 48, "شفاعه"),     # shafāʿa (fem, drives the verb gender)
    (2, 149, "تعملون"),  # taʿmalūn
    (11, 123, "تعملون"),
    (17, 68, "يخسف"),          # yakhsif
    (17, 68, "يرسل"),          # yursil
]

for s, aya, sk in targets:
    d = json.load(open(OUT / f"surah-{s}.json", encoding="utf-8"))
    v = next((x for x in d["verses"] if x["hafs_aya"] == aya), None)
    if not v:
        print(f"{s}:{aya}  <verse not found>"); continue
    hits = [i for i, w in enumerate(v["hafs"]) if skel(w, keep_dagger=True) == sk]
    if not hits:
        print(f"{s}:{aya}  <no Hafs word matching {sk!r}>"); continue
    for i in hits:
        h, w, a = v["hafs"][i], v["warsh"][i], v["abuamr"][i]
        genuine = bool(a) and skel(a, keep_dagger=True) != skel(h, keep_dagger=True)
        print(f"{s}:{aya} idx {i:2d}  {'GENUINE' if genuine else 'same   '}  "
              f"H={h!r} W={w!r} A={a!r}")
