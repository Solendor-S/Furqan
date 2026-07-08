import { useEffect, useState } from "react";
import type { Manuscript } from "../types";
import "./Manuscripts.css";

type Props = {
  target: { view: "manuscripts"; id: string } | null;
  clearTarget: () => void;
};

export default function Manuscripts({ target, clearTarget }: Props) {
  const [items, setItems] = useState<Manuscript[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("data/manuscripts.json").then((r) => r.json()).then(setItems);
  }, []);

  useEffect(() => {
    if (target) { setSelectedId(target.id); clearTarget(); }
  }, [target, clearTarget]);

  if (!items) return <p className="app-msg">Loading…</p>;

  const selected = items.find((m) => m.id === selectedId);
  if (selected) {
    return (
      <main className="ms-list">
        <button className="tn-back" onClick={() => setSelectedId(null)}>← All manuscripts</button>
        <Detail m={selected} />
      </main>
    );
  }

  const ordered = [...items].sort((a, b) => Number(!!b.flagship) - Number(!!a.flagship));
  return (
    <main className="ms-picker">
      <p className="tn-picker-intro">
        Early Qur'an manuscripts and codices — what the physical witnesses show about the text.
        Most confirm the standard text at a very early date; Ṣanʿāʾ 1 is the notable exception.
        Each entry links out to credible scholarship. Pick one:
      </p>
      {ordered.map((m) => (
        <button className="tn-pick" key={m.id} onClick={() => setSelectedId(m.id)}>
          <div className="tn-pick-text">
            <span className={`tn-cat ${m.flagship ? "quran-bible" : "quran-quran"}`}>
              {m.flagship ? "Non-ʿUthmānic witness" : "Early witness"}
            </span>
            <div className="tn-pick-title">{m.name}</div>
            <div className="tn-pick-q">{m.summary}</div>
          </div>
          <span className="tn-pick-chev">›</span>
        </button>
      ))}
    </main>
  );
}

function Detail({ m }: { m: Manuscript }) {
  return (
    <article className="tn-case">
      <h2 className="tn-title">{m.name}</h2>

      <table className="ms-meta">
        <tbody>
          {Object.entries(m.meta).map(([k, v]) => (
            <tr key={k}><th>{k}</th><td>{v}</td></tr>
          ))}
        </tbody>
      </table>

      {m.body.map((p, i) => <p className="ms-para" key={i}>{p}</p>)}

      {m.variants.length > 0 && (
        <div className="tn-block">
          <div className="tn-label">Notable differences from the standard text</div>
          {m.variants.map((v, i) => (
            <div className="ms-variant" key={i}>
              <div className="ms-variant-ref">{v.ref}</div>
              <div className="ms-variant-row"><span className="ms-vtag std">Standard</span> {v.standard}</div>
              <div className="ms-variant-row"><span className="ms-vtag ms">This manuscript</span> {v.manuscript}</div>
              <div className="ms-variant-note">{v.note}</div>
            </div>
          ))}
        </div>
      )}

      <div className="tn-block ms-links">
        <div className="tn-label">Learn more (credible sources)</div>
        <ul>
          {m.links.map((l, i) => (
            <li key={i}>
              <a href={l.url} target="_blank" rel="noreferrer">{l.label} ↗</a>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
