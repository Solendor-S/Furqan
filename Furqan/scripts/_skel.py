"""
Arabic consonantal-skeleton normalization, shared by build_data.py and
find_abuamr.py so the two never drift.

CAUTION: the MARKS char class holds combining-mark ranges next to '-' that
editors can silently reorder, corrupting it (this project hit that alignment
bug). The literal below is verified byte-identical to the original; its ranges
are U+0610–U+061A, U+064B–U+065F, U+0670, U+06D6–U+06ED, U+0640 (tatweel).
Do not hand-edit it — if it must change, edit here only and re-verify.
"""
import re, unicodedata

MARKS = re.compile("[ؐ-ًؚ-ٰٟۖ-ۭـ]")
DAGGER_ALEF = "ٰ"  # superscript alef — consonantal long-ā in Uthmani script

def skel(t, keep_dagger=False):
    t = unicodedata.normalize("NFC", t)
    # Strip the dagger alef for loose alignment, but keep it (as full alef) for
    # the reading vote: it distinguishes yukhādiʿ (form III) from yakhdaʿ (form I).
    if keep_dagger:
        t = t.replace(DAGGER_ALEF, "ا")  # -> full alef
    t = MARKS.sub("", t)
    t = re.sub("[إأآٱا]", "ا", t)  # alef/wasla variants -> bare alef
    t = (t.replace("ى", "ي")   # alef maqsura -> ya
           .replace("ؤ", "و")  # waw+hamza -> waw
           .replace("ئ", "ي")  # ya+hamza -> ya
           .replace("ء", "")        # drop hamza
           .replace("ة", "ه")) # ta marbuta -> ha
    return t

def norm(t):
    return skel(t, keep_dagger=False)
