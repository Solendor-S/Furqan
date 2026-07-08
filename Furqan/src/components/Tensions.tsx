import type { NavTarget, TensionType } from "../types";
import Casebook from "./Casebook";

const TYPE_LABEL: Record<TensionType, string> = {
  "quran-bible": "Qur'an ↔ Bible",
  "quran-hadith": "Qur'an ↔ Hadith",
  "quran-quran": "Qur'an ↔ Qur'an",
};

type Props = {
  go: (t: NavTarget) => void;
  target: { view: "tensions"; id: string } | null;
  clearTarget: () => void;
};

export default function Tensions({ go, target, clearTarget }: Props) {
  return (
    <Casebook
      dataUrl="data/tensions.json"
      typeLabels={TYPE_LABEL}
      concernLabel="The tension"
      backLabel="← All tensions"
      intro="Points where the Qur'an appears in tension with the earlier scriptures, with sahih hadith, or with itself. Each is shown neutrally: both sides quoted and cited, the mainstream reconciliations, then a textual assessment. Pick one:"
      go={go}
      target={target ? { id: target.id } : null}
      clearTarget={clearTarget}
    />
  );
}
