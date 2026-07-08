"""
Merge the agent-curated + human-skimmed farsh entries into farsh-abuamr.json /
farsh-bazzi.json. Applies my correction patches (form/agreement/translit fixes the
Haiku passes got wrong) and drops tokenization-artifact positions, then concatenates
with the existing hand-curated entries and sorts by (surah, ayah, idx).
"""
import json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEMP = ROOT / "temp"

# ref:idx -> corrected {shared, gloss}. Fixes wrong form numbers, fabricated roots,
# wrong agreement notes, and transliteration typos found in my skim.
PATCH = {
    "abuamr": {
        "19:90:2": ("almost burst apart (yatafaṭṭarna — form V, from faṭara)", "burst apart (yanfaṭirna — form VII, from faṭara)"),
        "42:5:2":  ("almost burst apart (yatafaṭṭarna — form V, from faṭara)", "burst apart (yanfaṭirna — form VII, from faṭara)"),
        "24:35:16": ("is kindled (yūqadu — form IV passive)", "blazes up (tawaqqada — form V)"),
        "33:52:1": ("it is lawful (yaḥillu — masculine)", "it is lawful (taḥillu — feminine, agreeing with an-nisāʾ, ‘women’)"),
        "16:48:8": ("incline/turn (yatafayyaʾu — masculine)", "incline/turn (tatafayyaʾu — feminine, agreeing with ẓilāl, ‘shadows’)"),
        "88:11:1": ("you hear (tasmaʿu — 2nd person active)", "is heard (yusmaʿu — passive)"),
        "3:187:7": ("you will surely make it clear (la-tubayyinunnahu — 2nd person)", "he will surely make it clear (la-yubayyinunnahu — 3rd person)"),
        "18:47:1": ("We set them in motion (nusayyiru — 1st person plural)", "it is set in motion (tusayyaru — passive)"),
    },
    "bazzi": {
        "24:35:16": ("is kindled (yūqadu — form IV passive)", "blazes up (tawaqqada — form V)"),
        "33:30:7": ("will be doubled (yuḍāʿaf — form III passive)", "We will double (nuḍaʿʿif — form II, 1st person plural)"),
        "3:187:7": ("you will surely make it clear (la-tubayyinunnahu — 2nd person)", "he will surely make it clear (la-yubayyinunnahu — 3rd person)"),
        "20:133:7": ("comes to them (taʾtihim — feminine)", "comes to them (yaʾtihim — masculine)"),
        "27:80:5": ("you make [them] hear (tusmiʿu — 2nd person)", "[they] hear (yasmaʿu — 3rd person)"),
        "30:52:5": ("you make [them] hear (tusmiʿu — 2nd person)", "[they] hear (yasmaʿu — 3rd person)"),
    },
}
# tokenization / alignment artifacts — the reading spans a different word boundary,
# so a per-word highlight would misalign. Drop until tokenization is reconciled.
DROP = {"abuamr": {"73:20:20"}, "bazzi": {"7:98:0", "75:1:0"}}

def merge(name):
    farsh_path = ROOT / "data" / f"farsh-{name}.json"
    farsh = json.load(open(farsh_path, encoding="utf-8"))
    existing = {(e["ref"], e["idx"]) for e in farsh["entries"]}
    verified = json.load(open(TEMP / f"{name}-verified.json", encoding="utf-8"))["entries"]
    added = 0
    for e in verified:
        key = f"{e['ref']}:{e['idx']}"
        if key in DROP[name] or (e["ref"], e["idx"]) in existing:
            continue
        shared, gloss = PATCH[name].get(key, (e["shared"], e[name]))
        farsh["entries"].append({"ref": e["ref"], "idx": e["idx"], "shared": shared, name: gloss})
        added += 1
    farsh["entries"].sort(key=lambda e: (int(e["ref"].split(":")[0]), int(e["ref"].split(":")[1]), e["idx"]))
    json.dump(farsh, open(farsh_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"{name}: +{added} entries -> {len(farsh['entries'])} total")

merge("abuamr")
merge("bazzi")
