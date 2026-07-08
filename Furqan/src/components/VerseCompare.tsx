import { memo, useState } from "react";
import type { Verse } from "../types";
import { curated, genericReading, orthoExplanation } from "../data/explanations";
import "./VerseCompare.css";

type Tier = "reading" | "ortho";
type Sel = { idx: number; tier: Tier } | null;
type Font = "hafs" | "warsh" | "abuamr" | "bazzi";
type ThirdKey = "abuamr" | "bazzi";
type MeaningEntry = NonNullable<Verse["meaning"]>[string];

type VCProps = {
  surah: number;
  verse: Verse;
  showAbuAmr?: boolean;
  showBazzi?: boolean;
  tensions?: { id: string; title: string }[];
  onOpenTension?: (id: string) => void;
};

// A third reading's own sense for a Ḥafṣ↔Warsh reading variant word (it votes
// with one side, or has its own gloss) — shared by the tooltip and diff block.
const thirdSense = (m: MeaningEntry, k: ThirdKey): string =>
  m[k]?.like === "warsh" ? (m.warsh ?? "")
  : m[k]?.like === "hafs" ? (m.hafs ?? "")
  : (m[k]?.gloss ?? "a distinct reading");

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

function VerseCompare({ surah, verse, showAbuAmr, showBazzi, tensions, onOpenTension }: VCProps) {
  const [sel, setSel] = useState<Sel>(null);
  const [tip, setTip] = useState<{ i: number; font: Font } | null>(null); // word tapped for translation
  // Third-reading-only positions only count as variants when their column is shown.
  const abuamrOnly = new Set(showAbuAmr ? verse.abuamr_only : []);
  const bazziOnly = new Set(showBazzi ? verse.bazzi_only : []);
  const thirdOnly = (i: number) => abuamrOnly.has(i) || bazziOnly.has(i);
  const reading = new Set([...verse.reading, ...abuamrOnly, ...bazziOnly]);
  const ortho = new Set(verse.ortho);

  const tierOf = (i: number): Tier | null =>
    reading.has(i) ? "reading" : ortho.has(i) ? "ortho" : null;

  // meaning shown for word i in a given reading's card — a variant word shows THAT
  // reading's own sense (Warsh مَلِكِ = "King", not the Ḥafṣ word-by-word "Master");
  // ordinary words fall back to the quran.com word-by-word gloss.
  const wordGloss = (i: number, font: Font): { tr?: string; en: string } => {
    const m = verse.meaning?.[String(i)];
    if (m?.shared) // third-reading-only fork: Ḥafṣ≈Warsh share a sense
      return { en: font === "abuamr" || font === "bazzi" ? (m[font]?.gloss ?? m.shared) : m.shared };
    if (m?.hafs && m.warsh) { // Ḥafṣ↔Warsh reading variant
      if (font === "warsh") return { en: m.warsh };
      if (font === "abuamr" || font === "bazzi") return { en: thirdSense(m, font) };
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
        // panel only exists for Ḥafṣ↔Warsh variants (not third-reading-only forks)
        const panelTier = tier && !thirdOnly(i) ? tier : null;
        const g = wordGloss(i, font);
        const open = tip?.i === i && tip.font === font;
        return (
          <span
            key={i}
            className={`vc-w${tier ? " " + tier : ""}${sel?.idx === i ? " sel" : ""}${open ? " tapped" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (open) { setTip(null); if (panelTier) setSel(null); }
              else { setTip({ i, font }); setSel(panelTier ? { idx: i, tier: panelTier } : null); }
            }}
          >
            {w}{" "}
            {open && (
              <span className="vc-tip" onClick={(e) => e.stopPropagation()}>
                {g.tr && <span className="vc-tip-tr">{g.tr}</span>}
                <span className="vc-tip-en">{g.en}</span>
                {panelTier && (
                  <span className="vc-tip-more">
                    {panelTier === "reading" ? "reading variant ↓" : "minor difference ↓"}
                  </span>
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
        {showBazzi && (
          <div className="vc-card">
            <div className="vc-rlabel">Ibn Kathīr (Bazzī) · {surah}:{verse.bazzi_aya}</div>
            {words(verse.bazzi, "bazzi")}
          </div>
        )}
      </div>
      {verse.en && (
        <div className="vc-trans">
          <div className="vc-trans-en">{verse.en}</div>
          {[...new Set([...verse.reading,
                        ...(showAbuAmr ? verse.abuamr_only : []),
                        ...(showBazzi ? verse.bazzi_only : [])])].sort((a, b) => a - b).map((i) => {
            const m = verse.meaning?.[String(i)];
            if (!m) return null;
            // Third-reading-only variant: Ḥafṣ & Warsh agree, a third reading forks.
            if (m.shared) {
              // cite each shown fork's own mushaf, deduped (both share the al-Nashr line)
              const cites = [...new Set([
                showAbuAmr ? m.abuamr?.cite : undefined,
                showBazzi ? m.bazzi?.cite : undefined,
              ].filter(Boolean) as string[])];
              // name any shown third reading that reads the shared baseline here
              const sharedBy = ["Ḥafṣ", "Warsh"];
              if (showAbuAmr && m.shared_by?.includes("abuamr")) sharedBy.push("Abū ʿAmr");
              if (showBazzi && m.shared_by?.includes("bazzi")) sharedBy.push("Ibn Kathīr");
              const sharedBadge = sharedBy.length > 2
                ? sharedBy.slice(0, -1).join(", ") + " & " + sharedBy[sharedBy.length - 1]
                : sharedBy.join(" & ");
              return (
                <div className="vc-trans-diff" key={i}>
                  <DiffLine badge={sharedBadge} cls="hafs" text={m.shared} />
                  {showAbuAmr && m.abuamr && <DiffLine badge="Abū ʿAmr" cls="abuamr" text={m.abuamr.gloss ?? ""} ar={m.abuamr.ar} arFont="abuamr" />}
                  {showBazzi && m.bazzi && <DiffLine badge="Ibn Kathīr" cls="bazzi" text={m.bazzi.gloss ?? ""} ar={m.bazzi.ar} arFont="bazzi" />}
                  {cites.map((c) => <div className="vc-diff-cite" key={c}>{c}</div>)}
                </div>
              );
            }
            // Ḥafṣ↔Warsh variant; each shown third reading gives its own word + sense.
            return (
              <div className="vc-trans-diff" key={i}>
                <DiffLine badge="Ḥafṣ" cls="hafs" text={m.hafs ?? ""} ar={verse.hafs[i]} arFont="hafs" />
                <DiffLine badge="Warsh" cls="warsh" text={m.warsh ?? ""} ar={verse.warsh[i]} arFont="warsh" />
                {showAbuAmr && m.abuamr && <DiffLine badge="Abū ʿAmr" cls="abuamr" text={thirdSense(m, "abuamr")} ar={m.abuamr.ar} arFont="abuamr" />}
                {showBazzi && m.bazzi && <DiffLine badge="Ibn Kathīr" cls="bazzi" text={thirdSense(m, "bazzi")} ar={m.bazzi.ar} arFont="bazzi" />}
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
