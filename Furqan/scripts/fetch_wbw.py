"""
Fetch word-by-word English translation + transliteration from the quran.com API
(the same data quran.com shows on word tap). Aligned to QPC word segmentation,
which matches our KFGQPC hafs.json tokenisation 1:1.

Output: data/raw/wbw-en.json  -> { "sura:aya": [[translation, translit], ...] }
Only char_type_name == "word" tokens are kept (the trailing ayah-number "end"
token is dropped).
"""
import json, time, urllib.request, pathlib

RAW = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw"
API = ("https://api.quran.com/api/v4/verses/by_chapter/{ch}"
       "?words=true&word_fields=transliteration&per_page=300&page={pg}")

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Furqan build)"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.load(r)
        except Exception as e:
            if attempt == 3:
                raise
            time.sleep(2 * (attempt + 1))

out = {}
for ch in range(1, 115):
    pg = 1
    while True:
        d = get(API.format(ch=ch, pg=pg))
        for v in d["verses"]:
            words = [w for w in v["words"] if w.get("char_type_name") == "word"]
            out[v["verse_key"]] = [
                [(w.get("translation") or {}).get("text", ""),
                 (w.get("transliteration") or {}).get("text", "")]
                for w in words
            ]
        pag = d.get("pagination") or {}
        if not pag.get("next_page"):
            break
        pg = pag["next_page"]
    print(f"ch {ch:3d} done ({sum(len(x) for k,x in out.items() if k.startswith(f'{ch}:'))} words)")
    time.sleep(0.2)

json.dump(out, open(RAW / "wbw-en.json", "w", encoding="utf-8"), ensure_ascii=False)
print(f"wrote {len(out)} verses, {sum(len(x) for x in out.values())} words -> {RAW/'wbw-en.json'}")
