import type { Pair } from "../domain/tables";
import { buildPicker, type PickerHandles } from "./CalcsPickerDom";

export interface CalcsPickerOptions {
  initial: readonly Pair[];
}

const NO_SELECTION_MSG = "Sélectionne au moins un calcul.";

const readSelection = (boxes: readonly HTMLInputElement[]): Pair[] =>
  boxes
    .filter((cb) => cb.checked)
    .map((cb) => ({
      a: Number(cb.dataset.a),
      b: Number(cb.dataset.b),
    }));

const updateCloseAvailability = (h: PickerHandles): void => {
  const count = h.checkboxes.filter((cb) => cb.checked).length;
  const allowed = count >= 1;
  h.backBtn.disabled = !allowed;
  h.closeBtn.disabled = !allowed;
  h.warn.textContent = allowed ? "" : NO_SELECTION_MSG;
};

const installCheckboxListeners = (h: PickerHandles): void => {
  for (const cb of h.checkboxes) {
    cb.addEventListener("change", () => updateCloseAvailability(h));
  }
};

const cleanup = (h: PickerHandles): void => {
  if (h.root.parentNode) h.root.parentNode.removeChild(h.root);
};

const installCloseHandlers = (
  h: PickerHandles,
  resolve: (pairs: Pair[]) => void,
): void => {
  const finish = (): void => {
    if (h.backBtn.disabled) return;
    const out = readSelection(h.checkboxes);
    cleanup(h);
    resolve(out);
  };
  h.backBtn.addEventListener("click", finish);
  h.closeBtn.addEventListener("click", finish);
};

export function openCalcsPicker(opts: CalcsPickerOptions): Promise<Pair[]> {
  return new Promise<Pair[]>((resolve) => {
    const initial = [...opts.initial];
    const handles = buildPicker(initial);
    document.body.appendChild(handles.root);
    installCheckboxListeners(handles);
    updateCloseAvailability(handles);
    installCloseHandlers(handles, (pairs) => {
      resolve(pairs.length >= 1 ? pairs : initial);
    });
  });
}
