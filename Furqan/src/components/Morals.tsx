import type { MoralType, NavTarget } from "../types";
import Casebook from "./Casebook";

const TYPE_LABEL: Record<MoralType, string> = {
  marriage: "Marriage & consent",
  violence: "Violence & warfare",
  slavery: "Slavery",
  women: "Women",
  punishment: "Crime & punishment",
};

type Props = {
  go: (t: NavTarget) => void;
  target: { view: "morals"; id: string } | null;
  clearTarget: () => void;
};

export default function Morals({ go, target, clearTarget }: Props) {
  return (
    <Casebook
      dataUrl="data/morals.json"
      typeLabels={TYPE_LABEL}
      concernLabel="The moral concern"
      backLabel="← All cases"
      intro="Passages in the Qur'an and sahih hadith whose moral content is widely questioned by modern standards. Each is shown in context and cited verbatim, with the mainstream reconciliations and an honest assessment — the reader is left to weigh it. Pick one:"
      go={go}
      target={target ? { id: target.id } : null}
      clearTarget={clearTarget}
    />
  );
}
