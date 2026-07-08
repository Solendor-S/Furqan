import { useEffect, useRef, useState } from "react";
import type { NavTarget } from "./types";
import Readings from "./components/Readings";
import Tensions from "./components/Tensions";
import Morals from "./components/Morals";
import Manuscripts from "./components/Manuscripts";
import About from "./components/About";
import Search from "./components/Search";
import Dropdown from "./components/Dropdown";
import "./App.css";

type Theme = "auto" | "light" | "dark" | "contrast";
type View = "readings" | "tensions" | "morals" | "manuscripts" | "about";

function ScrollTop() {
  const [show, setShow] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setShow(y < lastY.current && y > 300); // scrolling up, past 300px
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button className={`scrolltop${show ? " on" : ""}`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      ↑ Top
    </button>
  );
}

export default function App() {
  const [view, setView] = useState<View>("readings");
  const [target, setTarget] = useState<NavTarget | null>(null);
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || "auto",
  );
  const [arScale, setArScale] = useState(() => +(localStorage.getItem("arScale") || 1));
  const [enScale, setEnScale] = useState(() => +(localStorage.getItem("enScale") || 1));

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty("--ar-scale", String(arScale));
    localStorage.setItem("arScale", String(arScale));
  }, [arScale]);
  useEffect(() => {
    document.documentElement.style.setProperty("--en-scale", String(enScale));
    localStorage.setItem("enScale", String(enScale));
  }, [enScale]);
  const step = (set: typeof setArScale, d: number) =>
    set((v) => Math.min(1.4, Math.max(0.7, Math.round((v + d) * 10) / 10)));

  function go(t: NavTarget) {
    setView(t.view);
    setTarget(t);
  }
  const clearTarget = () => setTarget(null);

  return (
    <div className="app">
      <ScrollTop />
      <header className="app-header">
        <div className="app-title">Furqan</div>
        <div className="app-tagline">Source-critical Qur'an study</div>

        <Search go={go} />

        <nav className="app-tabs">
          <button className={view === "readings" ? "on" : ""} onClick={() => setView("readings")}>Readings</button>
          <button className={view === "tensions" ? "on" : ""} onClick={() => setView("tensions")}>Tensions</button>
          <button className={view === "morals" ? "on" : ""} onClick={() => setView("morals")}>Morals</button>
          <button className={view === "manuscripts" ? "on" : ""} onClick={() => setView("manuscripts")}>Manuscripts</button>
          <Dropdown className="app-theme" ariaLabel="Theme" value={theme}
            onChange={(v) => setTheme(v as Theme)}
            options={[
              { value: "auto", label: "Theme: Auto" },
              { value: "light", label: "Theme: Light" },
              { value: "dark", label: "Theme: Dark" },
              { value: "contrast", label: "Theme: High contrast" },
            ]} />
        </nav>

        <div className="app-fontsize">
          <span className="fs-label">Arabic</span>
          <button onClick={() => step(setArScale, -0.1)} aria-label="Smaller Arabic">A−</button>
          <span className="fs-val">{Math.round(arScale * 100)}%</span>
          <button onClick={() => step(setArScale, 0.1)} aria-label="Larger Arabic">A+</button>
          <span className="fs-sep">·</span>
          <span className="fs-label">English</span>
          <button onClick={() => step(setEnScale, -0.1)} aria-label="Smaller English">A−</button>
          <span className="fs-val">{Math.round(enScale * 100)}%</span>
          <button onClick={() => step(setEnScale, 0.1)} aria-label="Larger English">A+</button>
        </div>
      </header>

      {view === "readings" && (
        <Readings go={go} clearTarget={clearTarget}
          target={target?.view === "readings" ? target : null} />
      )}
      {view === "tensions" && (
        <Tensions go={go} clearTarget={clearTarget}
          target={target?.view === "tensions" ? target : null} />
      )}
      {view === "morals" && (
        <Morals go={go} clearTarget={clearTarget}
          target={target?.view === "morals" ? target : null} />
      )}
      {view === "manuscripts" && (
        <Manuscripts clearTarget={clearTarget}
          target={target?.view === "manuscripts" ? target : null} />
      )}
      {view === "about" && <About />}

      <footer className="app-foot">
        <button className="app-foot-link" onClick={() => setView("about")}>
          About · Sources &amp; licences
        </button>
        <div className="app-foot-data">
          Corpus Coranicum · King Fahd Complex · Pickthall &amp; WEB (public domain) · sunnah.com
        </div>
      </footer>
    </div>
  );
}
