import { useEffect, useRef, useState } from "react";
import "./Dropdown.css";

export type Opt = { value: string; label: string };

export default function Dropdown({
  value, options, onChange, placeholder, className, ariaLabel,
}: {
  value: string;
  options: Opt[];
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  // keep the selected option scrolled into view when opening
  const menuRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (open) menuRef.current?.querySelector(".dd-opt.on")?.scrollIntoView({ block: "center" });
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className={`dd ${className ?? ""}`} ref={ref}>
      <button type="button" className="dd-trigger" aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}>
        <span className="dd-value">{selected ? selected.label : (placeholder ?? "")}</span>
        <span className={`dd-chev${open ? " open" : ""}`}>▾</span>
      </button>
      {open && (
        <ul className="dd-menu" ref={menuRef}>
          {options.map((o) => (
            <li key={o.value}>
              <button type="button" className={`dd-opt${o.value === value ? " on" : ""}`}
                onClick={() => { onChange(o.value); setOpen(false); }}>
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
