import { memo, useState } from "react";
import type { Verse } from "../types";
import { curated, genericReading, orthoExplanation } from "../data/explanations";
import "./VerseCompare.css";

type Tier = "reading" | "ortho";
type Sel = { idx: number; tier: Tier } | null;
type Font = "hafs" | "warsh" | "abuamr";
type MeaningEntry = NonNullable<Verse["meaning"]>[string];

type VCProps = {
  surah: number;
  verse: Verse;
  showAbuAmr?: boolean;
  tensions?: { id: string; title: string }[];
  onOpenTension?: (id: string) => void;
};

// Abū ʿAmr's own sense for a Ḥafṣ↔Warsh reading variant word (it votes with one
// side, or has its own gloss) — shared by the tooltip and the diff block.
const abuamrSense = (m: MeaningEntry): string =>
  m.abuamr?.like === "warsh" ? (m.warsh ?? "")
  : m.abuamr?.like === "hafs" ? (m.hafs ?? "")
  : (m.abuamr?.gloss ?? "a distinct reading");

// one "reading: meaning [arabic]" row in the translation-diff block
function DiffLine({ badge, cls, text, ar, arFont }: {
  badge: string; cls: string; text: string; ar?: string; arFont?: Font;
}) {
  return (
    <div className="vc-diff-line">
      <span className={`vc-badge ${cls}`}>{badge}</span> {text}
      {ar && <> <span className={`vc-verse ${arFont} vc-inline`}>{ar}</span></>}
    </div>
  );
}

function VerseCompare({ surah, verse, showAbuAmr, tensions, onOpenTension }: VCProps) {
  const [sel, setSel] = useState<Sel>(null);
  const [tip, setTip] = useState<{ i: number; font: Font } | null>(null); // word tapped for translation
  // Abū ʿAmr-only positions only count as variants when the third column is shown.
  const abuamrOnly = new Set(showAbuAmr ? verse.abuamr_only : []);
  const reading = new Set([...verse.reading, ...abuamrOnly]);
  const ortho = new Set(verse.ortho);

  const tierOf = (i: number): Tier | null =>
    reading.has(i) ? "reading" : ortho.has(i) ? "ortho" : null;

  const pick = (idx: number, tier: Tier) =>
    setSel((cur) => (cur?.idx === idx ? null : { idx, tier }));

  // meaning shown for word i in a given reading's card — a variant word shows THAT
  // reading's own sense (Warsh مَلِكِ = "King", not the Ḥafṣ word-by-word "Master");
  // ordinary words fall back to the quran.com word-by-word gloss.
  const wordGloss = (i: number, font: Font): { tr?: string; en: string } => {
    const m = verse.meaning?.[String(i)];
    if (m?.shared) // Abū ʿAmr-only fork: Ḥafṣ≈Warsh share a sense
      return { en: font === "abuamr" ? (m.abuamr?.gloss ?? m.shared) : m.shared };
    if (m?.hafs && m.warsh) { // Ḥafṣ↔Warsh reading variant
      if (font === "warsh") return { en: m.warsh };
      if (font === "abuamr") return { en: abuamrSense(m) };
      return { en: m.hafs };
    }
    const w = verse.wbw?.[i];
    return w ? { tr: w[1], en: w[0] } : { en: "—" };
  };

  const words = (tokens: string[], font: Font) => (
    <div className={`vc-verse ${font}`}>
      {tokens.map((w, i) => {
        if (!w) return null; // gap (e.g. basmala absent in Warsh)
        const tier = tierOf(i);
        // panel only exists for Ḥafṣ↔Warsh variants (not Abū ʿAmr-only forks)
        const panelTier = tier && !abuamrOnly.has(i) ? tier : null;
        const g = wordGloss(i, font);
        const open = tip?.i === i && tip.font === font;
        return (
          <span
            key={i}
            className={`vc-w${tier ? " " + tier : ""}${sel?.idx === i ? " sel" : ""}${open ? " tapped" : ""}`}
            onClick={(e) => { e.stopPropagation(); setTip(open ? null : { i, font }); }}
          >
            {w}{" "}
            {open && (
              <span className="vc-tip" onClick={(e) => e.stopPropagation()}>
                {g.tr && <span className="vc-tip-tr">{g.tr}</span>}
                <span className="vc-tip-en">{g.en}</span>
                {panelTier && (
                  <button className="vc-tip-more"
                    onClick={(e) => { e.stopPropagation(); pick(i, panelTier); setTip(null); }}>
                    {panelTier === "reading" ? "reading variant ›" : "minor difference ›"}
                  </button>
                )}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );

  return (
    <div className="vc-verse-block" id={`v-${verse.hafs_aya}`} onClick={() => setTip(null)}>
      {tensions && tensions.length > 0 && onOpenTension && (
        <div className="vc-xref">
          <span className="vc-xref-label">Discussed in</span>
          {tensions.map((t) => (
            <button key={t.id} className="vc-xref-link" onClick={() => onOpenTension(t.id)}>
              {t.title} ↗
            </button>
          ))}
        </div>
      )}
      <div className="vc-grid">
        <div className="vc-card">
          <div className="vc-rlabel">Ḥafṣ · {surah}:{verse.hafs_aya}</div>
          {words(verse.hafs, "hafs")}
        </div>
        <div className="vc-card">
          <div className="vc-rlabel">Warsh · {surah}:{verse.warsh_aya}</div>
          {words(verse.warsh, "warsh")}
        </div>
        {showAbuAmr && (
          <div className="vc-card">
            <div className="vc-rlabel">Abū ʿAmr (Dūrī) · {surah}:{verse.abuamr_aya}</div>
            {words(verse.abuamr, "abuamr")}
          </div>
        )}
      </div>
      {verse.en && (
        <div className="vc-trans">
          <div className="vc-trans-en">{verse.en}</div>
          {[...verse.reading, ...(showAbuAmr ? verse.abuamr_only : [])].sort((a, b) => a - b).map((i) => {
            const m = verse.meaning?.[String(i)];
            if (!m) return null;
            // Abū ʿAmr-only variant: Ḥafṣ & Warsh agree, Abū ʿAmr forks.
            if (m.shared) {
              return (
                <div className="vc-trans-diff" key={i}>
                  <DiffLine badge="Ḥafṣ & Warsh" cls="hafs" text={m.shared} />
                  {m.abuamr && <DiffLine badge="Abū ʿAmr" cls="abuamr" text={m.abuamr.gloss ?? ""} ar={m.abuamr.ar} arFont="abuamr" />}
                  {m.cite && <div className="vc-diff-cite">{m.cite}</div>}
                </div>
              );
            }
            // Ḥafṣ↔Warsh variant; Abū ʿAmr always shows its own word + sense.
            return (
              <div className="vc-trans-diff" key={i}>
                <DiffLine badge="Ḥafṣ" cls="hafs" text={m.hafs ?? ""} ar={verse.hafs[i]} arFont="hafs" />
                <DiffLine badge="Warsh" cls="warsh" text={m.warsh ?? ""} ar={verse.warsh[i]} arFont="warsh" />
                {showAbuAmr && m.abuamr && <DiffLine badge="Abū ʿAmr" cls="abuamr" text={abuamrSense(m)} ar={m.abuamr.ar} arFont="abuamr" />}
              </div>
            );
          })}
        </div>
      )}

      {sel && <Panel surah={surah} verse={verse} sel={sel} />}
    </div>
  );
}

function Panel({ surah, verse, sel }: { surah: number; verse: Verse; sel: NonNullable<Sel> }) {
  const hafs = verse.hafs[sel.idx];
  const warsh = verse.warsh[sel.idx];

  if (sel.tier === "reading") {
    const m = verse.meaning?.[String(sel.idx)];
    const gloss = m?.hafs && m.warsh ? { hafs: m.hafs, warsh: m.warsh } : undefined;
    const e =
      curated[`${surah}:${verse.hafs_aya}:${sel.idx}`] ??
      genericReading(hafs, warsh, gloss);
    return (
      <div className="vc-panel">
        <span className="vc-tag reading">reading variant · qirāʾa</span>
        <h2>{e.headline}</h2>
        <div className="vc-row"><div className="ar hafs">{hafs}</div>
          <div className="meta"><b>{e.hafs.label}</b><span>{e.hafs.gloss}</span></div></div>
        <div className="vc-row"><div className="ar warsh">{warsh}</div>
          <div className="meta"><b>{e.warsh.label}</b><span>{e.warsh.gloss}</span></div></div>
        <div className="vc-note">{e.note}</div>
        {e.detail && (
          <details className="vc-more">
            <summary>More detail (for students)</summary>
            <p>{e.detail}</p>
          </details>
        )}
        <div className="vc-cite">{e.cite}</div>
      </div>
    );
  }

  return (
    <div className="vc-panel">
      <span className="vc-tag ortho">minor difference · same word &amp; meaning</span>
      <h2>{orthoExplanation.headline}</h2>
      <div className="vc-row"><div className="ar hafs">{hafs}</div>
        <div className="meta"><b>Ḥafṣ</b><span>how this word appears in the Ḥafṣ tradition</span></div></div>
      <div className="vc-row"><div className="ar warsh">{warsh}</div>
        <div className="meta"><b>Warsh</b><span>the Warsh form of the same word</span></div></div>
      <div className="vc-note">{orthoExplanation.note}</div>
    </div>
  );
}

// memoized: unrelated Readings state (ayah-jump, scroll) shouldn't re-render every verse
export default memo(VerseCompare);
