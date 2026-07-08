import { useEffect, useState } from "react";
import type { NavTarget, Tension, Manuscript } from "../types";
import "./Search.css";

type VariantIdx = { ref: string; hafs: string; warsh: string };
type Res = { label: string; sub: string; target: NavTarget };

function tensionText(t: Tension): string {
  const parts: string[] = [t.title, t.question, t.tension, ...t.reconciliations, ...t.sources];
  if (t.addressing) {
    parts.push(t.addressing.note, t.addressing.bottom_line);
    for (const p of t.addressing.points) parts.push(p.verdict, p.text);
  }
  for (const s of t.sections) {
    parts.push(s.heading, s.note);
    if (s.kind === "quran") for (const v of s.verses) parts.push(v.en, v.ar, v.ref);
    else if (s.kind === "hadith") for (const h of s.hadiths) parts.push(h.en, h.ar, h.narrator, h.collection);
    else if (s.kind === "scripture") for (const p of s.passages) parts.push(p.text, p.ref, p.work);
    else for (const rd of s.readings) parts.push(rd.label, rd.ar, rd.meaning, s.ref);
  }
  return parts.join(" ").toLowerCase();
}

function msText(m: Manuscript): string {
  const parts: string[] = [m.name, m.summary, ...m.body, ...Object.values(m.meta)];
  for (const v of m.variants) parts.push(v.ref, v.standard, v.manuscript, v.note);
  return parts.join(" ").toLowerCase();
}

export default function Search({ go }: { go: (t: NavTarget) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [tensions, setTensions] = useState<Tension[]>([]);
  const [mss, setMss] = useState<Manuscript[]>([]);
  const [variants, setVariants] = useState<VariantIdx[]>([]);

  useEffect(() => {
    fetch("data/tensions.json").then((r) => r.json()).then(setTensions);
    fetch("data/manuscripts.json").then((r) => r.json()).then(setMss);
    fetch("data/variants-index.json").then((r) => r.json()).then(setVariants);
  }, []);

  const query = q.trim().toLowerCase();
  const words = query.split(/\s+/).filter(Boolean);
  const hit = (text: string) => words.length > 0 && words.every((w) => text.includes(w));

  const results: Res[] = [];
  if (query) {
    const m = query.match(/^(\d{1,3})\s*[:\s]\s*(\d{1,3})$/);
    if (m) results.push({
      label: `Qur'an ${m[1]}:${m[2]}`, sub: "open in Readings",
      target: { view: "readings", surah: +m[1], aya: +m[2] },
    });
    for (const t of tensions)
      if (hit(tensionText(t)))
        results.push({ label: t.title, sub: "Tension", target: { view: "tensions", id: t.id } });
    for (const v of variants)
      if (hit(`${v.hafs} ${v.warsh} ${v.ref}`.toLowerCase())) {
        const [s, a] = v.ref.split(":");
        results.push({
          label: `${v.ref} — ${v.hafs} / ${v.warsh}`, sub: "Reading variant",
          target: { view: "readings", surah: +s, aya: +a },
        });
      }
    for (const ms of mss)
      if (hit(msText(ms)))
        results.push({ label: ms.name, sub: "Manuscript", target: { view: "manuscripts", id: ms.id } });
  }

  return (
    <div className="search">
      <input
        className="search-in"
        placeholder="Search text, or jump to a verse (e.g. 2:132)…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 && (
        <ul className="search-res">
          {results.slice(0, 10).map((r, i) => (
            <li key={i}>
              <button onClick={() => { go(r.target); setQ(""); setOpen(false); }}>
                <span className="search-res-label">{r.label}</span>
                <span className="search-res-sub">{r.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
