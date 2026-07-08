import "./About.css";

type Source = {
  name: string;
  provides: string;
  license: string;
  url: string;
  note?: string;
};

const SOURCES: Source[] = [
  {
    name: "Corpus Coranicum (Berlin-Brandenburg Academy of Sciences)",
    provides: "Ḥafṣ baseline text with word IDs, and the variant-readings apparatus.",
    license: "CC BY-SA 4.0 — attribution + share-alike.",
    url: "https://corpuscoranicum.org",
    note: "Because this is share-alike, the portions of Furqan's data derived from it are released under the same licence (see below).",
  },
  {
    name: "King Fahd Glorious Qur'an Printing Complex (KFGQPC)",
    provides: "Arabic Qur'an text (Ḥafṣ & Warsh) and the Uthmanic fonts, bundled verbatim.",
    license: "Free to use and distribute unmodified, with attribution to KFGQPC; no modification of the text or fonts.",
    url: "https://qurancomplex.gov.sa",
  },
  {
    name: "Marmaduke Pickthall — The Meaning of the Glorious Qur'an",
    provides: "English translation of the Qur'an.",
    license: "Public domain (author d. 1936).",
    url: "https://en.wikipedia.org/wiki/Marmaduke_Pickthall",
  },
  {
    name: "World English Bible (WEB)",
    provides: "English Bible passages (in the Tensions section).",
    license: "Public domain.",
    url: "https://worldenglish.bible",
  },
  {
    name: "sunnah.com",
    provides: "Hadith text (Arabic & English), references and gradings.",
    license: "Used with attribution; only Ṣaḥīḥ-graded reports are cited.",
    url: "https://sunnah.com",
  },
];

export default function About() {
  return (
    <main className="ab">
      <section className="ab-block">
        <h2 className="ab-h">About Furqan</h2>
        <p>
          Furqan is a fully offline, source-critical Qur'an study tool. It compares the Ḥafṣ
          and Warsh readings word by word; surfaces points where the Qur'an appears in tension
          with the earlier scriptures, with sahih hadith, or with itself; and documents early
          manuscripts. Everything is citation-backed.
        </p>
        <p>
          Tensions are shown neutrally: both sides are quoted verbatim and cited, the mainstream
          reconciliation is always included, and a textual assessment follows — the aim is to let
          the reader judge from accurate primary material, not to editorialise.
        </p>
        <p className="ab-caveat">
          English glosses and some exact citations are marked “to verify” pending a scholarly
          pass. Corrections are welcome.
        </p>
      </section>

      <section className="ab-block">
        <h2 className="ab-h">Sources &amp; licences</h2>
        {SOURCES.map((s) => (
          <div className="ab-src" key={s.name}>
            <div className="ab-src-name">{s.name}</div>
            <div className="ab-src-row"><b>Provides:</b> {s.provides}</div>
            <div className="ab-src-row"><b>Licence:</b> {s.license}</div>
            {s.note && <div className="ab-src-note">{s.note}</div>}
            <a href={s.url} target="_blank" rel="noreferrer">{s.url} ↗</a>
          </div>
        ))}
      </section>

      <section className="ab-block">
        <h2 className="ab-h">This app's data</h2>
        <p>
          Portions of the bundled data derived from Corpus Coranicum are released under
          <b> CC BY-SA 4.0</b> (attribution + share-alike). The KFGQPC text and fonts are bundled
          unmodified under their terms. Furqan is an independent study project and is not
          affiliated with any of the sources above.
        </p>
      </section>

      <section className="ab-block">
        <h2 className="ab-h">Contact</h2>
        <p>
          Corrections, questions, and source suggestions are welcome:{" "}
          <a href="mailto:solendor.queries@gmail.com">solendor.queries@gmail.com</a>
        </p>
      </section>
    </main>
  );
}
