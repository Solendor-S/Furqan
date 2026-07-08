import { useEffect, useState } from "react";
import type { NavTarget, Tension, TensionSection } from "../types";
import "./Tensions.css";

// Shared picker + case renderer for the Tensions and Morals pillars — same data
// shape (Tension), differing only in copy: category labels, intro, concern label.
type Props = {
  dataUrl: string;
  intro: string;
  typeLabels: Record<string, string>;
  concernLabel: string; // "The tension" / "The moral concern"
  backLabel: string;    // "← All tensions" / "← All cases"
  go: (t: NavTarget) => void;
  target: { id: string } | null;
  clearTarget: () => void;
};

export default function Casebook({ dataUrl, intro, typeLabels, concernLabel, backLabel, go, target, clearTarget }: Props) {
  const [cases, setCases] = useState<Tension[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(dataUrl).then((r) => r.json()).then(setCases);
  }, [dataUrl]);

  useEffect(() => {
    if (target) { setSelectedId(target.id); clearTarget(); }
  }, [target, clearTarget]);

  if (!cases) return <p className="app-msg">Loading…</p>;

  const label = (t: string) => typeLabels[t] ?? t;
  const selected = cases.find((c) => c.id === selectedId);
  if (selected) {
    return (
      <main className="tn-list">
        <button className="tn-back" onClick={() => setSelectedId(null)}>{backLabel}</button>
        <Case c={selected} go={go} label={label} concernLabel={concernLabel} />
      </main>
    );
  }

  const ordered = [...cases].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  return (
    <main className="tn-picker">
      <p className="tn-picker-intro">{intro}</p>
      {ordered.map((c) => (
        <button className="tn-pick" key={c.id} onClick={() => setSelectedId(c.id)}>
          <div className="tn-pick-text">
            <span className={`tn-cat ${c.type}`}>{label(c.type)}</span>
            <div className="tn-pick-title">{c.title}</div>
            <div className="tn-pick-q">{c.question}</div>
          </div>
          <span className="tn-pick-chev">›</span>
        </button>
      ))}
    </main>
  );
}

function Case({ c, go, label, concernLabel }: {
  c: Tension; go: (t: NavTarget) => void; label: (t: string) => string; concernLabel: string;
}) {
  return (
    <article className="tn-case">
      <span className={`tn-cat ${c.type}`}>{label(c.type)}</span>
      <h2 className="tn-title">{c.title}</h2>
      <p className="tn-question">{c.question}</p>

      {c.sections.map((s, i) => <Section key={i} s={s} go={go} />)}

      <div className="tn-block tn-tension">
        <div className="tn-label">{concernLabel}</div>
        <p>{c.tension}</p>
      </div>

      <div className="tn-block tn-recon">
        <div className="tn-label">Reconciliation (mainstream views)</div>
        <ol>{c.reconciliations.map((r, i) => <li key={i}>{r}</li>)}</ol>
      </div>

      {c.addressing && (
        <div className="tn-block tn-address">
          <div className="tn-label">Addressing the reconciliations</div>
          <p className="tn-note">{c.addressing.note}</p>
          {c.addressing.points.map((p, i) => (
            <div className="tn-point" key={i}>
              <div className="tn-verdict"><span>{i + 1}</span> {p.verdict}</div>
              <p>{p.text}</p>
            </div>
          ))}
          <p className="tn-bottom">{c.addressing.bottom_line}</p>
        </div>
      )}

      <div className="tn-sources">
        <div className="tn-label">Sources</div>
        <ul>{c.sources.map((s, i) => <li key={i}>{s}</li>)}</ul>
      </div>
    </article>
  );
}

function Section({ s, go }: { s: TensionSection; go: (t: NavTarget) => void }) {
  return (
    <section className="tn-block">
      <div className={`tn-heading ${s.kind}`}>{s.heading}</div>
      {s.note && <p className="tn-note">{s.note}</p>}

      {s.kind === "quran" && s.verses.map((v) => {
        const m = v.ref.match(/^(\d+):(\d+)/);
        return (
          <div className="tn-quote quran" key={v.ref}>
            <div className="tn-ar">{v.ar}</div>
            <div className="tn-en">{v.en}</div>
            {m ? (
              <button className="tn-ref tn-ref-link"
                onClick={() => go({ view: "readings", surah: +m[1], aya: +m[2] })}>
                Qur'an {v.ref} · read in context ↗
              </button>
            ) : (
              <div className="tn-ref">Qur'an {v.ref}</div>
            )}
          </div>
        );
      })}

      {s.kind === "hadith" && s.hadiths.map((h) => (
        <div className="tn-quote hadith" key={h.number}>
          <div className="tn-ar">{h.ar}</div>
          <div className="tn-en">{h.en}</div>
          <div className="tn-ref">
            {h.collection} {h.number} · {h.in_book} · <b>{h.grade}</b> · narr. {h.narrator}{" "}
            <a href={h.url} target="_blank" rel="noreferrer">sunnah.com ↗</a>
          </div>
        </div>
      ))}

      {s.kind === "scripture" && s.passages.map((p) => (
        <div className="tn-quote scripture" key={p.ref}>
          <div className="tn-en scripture-text">“{p.text}”</div>
          <div className="tn-ref">{p.ref} · {p.work} (World English Bible)</div>
        </div>
      ))}

      {s.kind === "reading" && (
        <>
          {s.readings.map((rd, i) => {
            const j = rd.highlight ? rd.ar.indexOf(rd.highlight) : -1;
            return (
              <div className="tn-reading" key={i}>
                <div className="tn-reading-label">{rd.label}</div>
                <div className="tn-ar tn-reading-ar">
                  {j < 0 ? rd.ar : (
                    <>
                      {rd.ar.slice(0, j)}
                      <span className="tn-hl">{rd.highlight}</span>
                      {rd.ar.slice(j + rd.highlight!.length)}
                    </>
                  )}
                </div>
                <div className="tn-reading-meaning">{rd.meaning}</div>
              </div>
            );
          })}
          <button className="tn-ref tn-ref-link"
            onClick={() => go({ view: "readings", surah: +s.ref.split(":")[0], aya: +s.ref.split(":")[1] })}>
            Qur'an {s.ref} · read in context ↗
          </button>
        </>
      )}
    </section>
  );
}
