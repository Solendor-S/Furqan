import { useCallback, useEffect, useMemo, useState } from "react";
import type { IndexEntry, NavTarget, SurahData, Tension } from "../types";
import VerseCompare from "./VerseCompare";
import Dropdown from "./Dropdown";

type Props = {
  go: (t: NavTarget) => void;
  target: { view: "readings"; surah: number; aya: number } | null;
  clearTarget: () => void;
};

export default function Readings({ go, target, clearTarget }: Props) {
  const [index, setIndex] = useState<IndexEntry[]>([]);
  const [surah, setSurah] = useState(2);
  const [data, setData] = useState<SurahData | null>(null);
  const [variantsOnly, setVariantsOnly] = useState(true);
  const [tensions, setTensions] = useState<Tension[]>([]);
  const [scrollTo, setScrollTo] = useState<number | null>(null);
  const [ayaSel, setAyaSel] = useState<number | "">("");
  const [showAbuAmr, setShowAbuAmr] = useState(() => localStorage.getItem("showAbuAmr") === "1");
  const [showBazzi, setShowBazzi] = useState(() => localStorage.getItem("showBazzi") === "1");

  useEffect(() => {
    localStorage.setItem("showAbuAmr", showAbuAmr ? "1" : "0");
  }, [showAbuAmr]);
  useEffect(() => {
    localStorage.setItem("showBazzi", showBazzi ? "1" : "0");
  }, [showBazzi]);

  // stable identity so memoized VerseCompare isn't re-rendered on every Readings render
  const openTension = useCallback((id: string) => go({ view: "tensions", id }), [go]);

  useEffect(() => {
    fetch("data/index.json").then((r) => r.json()).then(setIndex);
    fetch("data/tensions.json").then((r) => r.json()).then(setTensions);
  }, []);

  // verse ref "surah:aya" -> tensions that cite it
  const verseTensions = useMemo(() => {
    const map: Record<string, { id: string; title: string }[]> = {};
    for (const t of tensions)
      for (const s of t.sections)
        if (s.kind === "quran")
          for (const v of s.verses) {
            const m = v.ref.match(/^(\d+):(\d+)/);
            if (!m) continue;
            const key = `${+m[1]}:${+m[2]}`;
            (map[key] ??= []).push({ id: t.id, title: t.title });
          }
    return map;
  }, [tensions]);

  // incoming jump target: show the whole surah and scroll to the verse
  useEffect(() => {
    if (!target) return;
    setVariantsOnly(false);
    setSurah(target.surah);
    setScrollTo(target.aya);
    clearTarget();
  }, [target, clearTarget]);

  const hasVariants = (s: IndexEntry) =>
    s.variant_verses > 0 || (showAbuAmr && s.abuamr_verses > 0) || (showBazzi && s.bazzi_verses > 0);

  // keep the selected surah to one that has variants (only while filtering)
  useEffect(() => {
    if (!variantsOnly || index.length === 0) return;
    const cur = index.find((s) => s.surah === surah);
    if (cur && !hasVariants(cur)) {
      const first = index.find(hasVariants);
      if (first) setSurah(first.surah);
    }
  }, [variantsOnly, index, surah, showAbuAmr, showBazzi]);

  useEffect(() => {
    setData(null);
    setAyaSel("");
    fetch(`data/surah-${surah}.json`).then((r) => r.json()).then(setData);
  }, [surah]);

  const jumpToAya = (n: number) => {
    setAyaSel(n);
    setScrollTo(n);
  };

  // once the target surah is loaded, scroll to + flash the verse
  useEffect(() => {
    if (scrollTo == null || !data) return;
    const el = document.getElementById(`v-${scrollTo}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("vc-jump");
      setTimeout(() => el.classList.remove("vc-jump"), 2200);
    }
    setScrollTo(null);
  }, [scrollTo, data]);

  const surahOptions = index.filter((s) => !variantsOnly || hasVariants(s));
  const verses = data?.verses.filter(
    (v) => !variantsOnly || v.reading.length > 0
      || (showAbuAmr && v.abuamr_only.length > 0) || (showBazzi && v.bazzi_only.length > 0)
  ) ?? [];

  return (
    <>
      <div className="app-controls">
        <div className="rd-selects">
          <Dropdown className="rd-surah" ariaLabel="Surah" value={String(surah)}
            onChange={(v) => setSurah(Number(v))}
            options={surahOptions.map((s) => {
              const n = s.variant_verses + (showAbuAmr ? s.abuamr_verses : 0) + (showBazzi ? s.bazzi_verses : 0);
              return {
                value: String(s.surah),
                label: `${s.surah}. ${s.name_en} (${n} variant${n === 1 ? "" : "s"})`,
              };
            })} />
          <Dropdown className="rd-aya" ariaLabel="Ayah" placeholder="Ayah…"
            value={ayaSel === "" ? "" : String(ayaSel)}
            onChange={(v) => v && jumpToAya(Number(v))}
            options={verses.map((v) => ({ value: String(v.hafs_aya), label: `Ayah ${v.hafs_aya}` }))} />
        </div>
        <label className="app-toggle">
          <input type="checkbox" checked={variantsOnly}
            onChange={(e) => setVariantsOnly(e.target.checked)} />
          variants only
        </label>
        <label className="app-toggle">
          <input type="checkbox" checked={showAbuAmr}
            onChange={(e) => setShowAbuAmr(e.target.checked)} />
          + Abū ʿAmr
        </label>
        <label className="app-toggle">
          <input type="checkbox" checked={showBazzi}
            onChange={(e) => setShowBazzi(e.target.checked)} />
          + Ibn Kathīr
        </label>
      </div>
      <div className="app-legend">
        <span><i className="vc-sw r" /> meaning variant (different reading)</span>
        <span><i className="vc-sw o" /> minor difference (same word &amp; meaning)</span>
      </div>

      {!data ? (
        <p className="app-msg">Loading…</p>
      ) : verses.length === 0 ? (
        <p className="app-msg">No Ḥafṣ↔Warsh reading variants in this surah. Untick “variants only” to read it in full.</p>
      ) : (
        <main className="app-verses">
          {verses.map((v) => (
            <VerseCompare key={v.hafs_aya} surah={surah} verse={v} showAbuAmr={showAbuAmr} showBazzi={showBazzi}
              tensions={verseTensions[`${surah}:${v.hafs_aya}`]}
              onOpenTension={openTension} />
          ))}
        </main>
      )}
    </>
  );
}
