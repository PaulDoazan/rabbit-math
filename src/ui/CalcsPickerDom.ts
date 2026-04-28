import type { Pair } from "../domain/tables";
import { CALCS_PICKER_CSS } from "./CalcsPickerStyle";

export interface PickerHandles {
  root: HTMLDivElement;
  body: HTMLDivElement;
  closeBtn: HTMLButtonElement;
  backBtn: HTMLButtonElement;
  warn: HTMLDivElement;
  checkboxes: HTMLInputElement[];
}

const TABLES = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const MULTIPLIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const pairKey = (a: number, b: number): string => `${a}x${b}`;

const initialKeys = (initial: readonly Pair[]): Set<string> =>
  new Set(initial.map((p) => pairKey(p.a, p.b)));

const buildStyle = (): HTMLStyleElement => {
  const style = document.createElement("style");
  style.textContent = CALCS_PICKER_CSS;
  return style;
};

const buildHeader = (): { wrap: HTMLDivElement; close: HTMLButtonElement } => {
  const wrap = document.createElement("div");
  wrap.className = "cp-header";
  const title = document.createElement("h2");
  title.className = "cp-title";
  title.textContent = "Choisis tes calculs";
  const close = document.createElement("button");
  close.className = "cp-close";
  close.textContent = "✕";
  close.setAttribute("aria-label", "Fermer");
  wrap.append(title, close);
  return { wrap, close };
};

const buildRow = (
  a: number,
  b: number,
  checked: boolean,
): { row: HTMLLabelElement; cb: HTMLInputElement } => {
  const row = document.createElement("label");
  row.className = "cp-row";
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = checked;
  cb.dataset.a = String(a);
  cb.dataset.b = String(b);
  const text = document.createElement("span");
  text.textContent = `${a} × ${b} = ${a * b}`;
  row.append(cb, text);
  return { row, cb };
};

const buildSectionHeader = (
  a: number,
): { header: HTMLLabelElement; cb: HTMLInputElement } => {
  const header = document.createElement("label");
  header.className = "cp-section-header";
  const cb = document.createElement("input");
  cb.type = "checkbox";
  const text = document.createElement("span");
  text.textContent = `Table de ${a}`;
  header.append(cb, text);
  return { header, cb };
};

const buildSectionRows = (
  a: number,
  section: HTMLDivElement,
  has: Set<string>,
  out: HTMLInputElement[],
): HTMLInputElement[] => {
  const rows: HTMLInputElement[] = [];
  for (const b of MULTIPLIERS) {
    const { row, cb } = buildRow(a, b, has.has(pairKey(a, b)));
    section.appendChild(row);
    rows.push(cb);
    out.push(cb);
  }
  return rows;
};

const buildSection = (
  a: number,
  has: Set<string>,
  checkboxes: HTMLInputElement[],
): HTMLDivElement => {
  const section = document.createElement("div");
  section.className = "cp-section";
  const { header, cb: headerCb } = buildSectionHeader(a);
  section.appendChild(header);
  const rows = buildSectionRows(a, section, has, checkboxes);
  wireSectionToggle(headerCb, rows);
  return section;
};

const syncHeaderFromRows = (
  headerCb: HTMLInputElement,
  rows: readonly HTMLInputElement[],
): void => {
  const checkedCount = rows.filter((r) => r.checked).length;
  headerCb.checked = checkedCount === rows.length;
  headerCb.indeterminate = checkedCount > 0 && checkedCount < rows.length;
};

const wireSectionToggle = (
  headerCb: HTMLInputElement,
  rows: readonly HTMLInputElement[],
): void => {
  syncHeaderFromRows(headerCb, rows);
  headerCb.addEventListener("change", () => {
    const target = headerCb.checked;
    for (const r of rows) {
      r.checked = target;
      r.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  for (const r of rows) {
    r.addEventListener("change", () => syncHeaderFromRows(headerCb, rows));
  }
};

const buildBody = (
  initial: readonly Pair[],
  checkboxes: HTMLInputElement[],
): HTMLDivElement => {
  const body = document.createElement("div");
  body.className = "cp-body";
  const has = initialKeys(initial);
  for (const a of TABLES) body.appendChild(buildSection(a, has, checkboxes));
  return body;
};

const buildFooter = (): {
  wrap: HTMLDivElement;
  warn: HTMLDivElement;
  back: HTMLButtonElement;
} => {
  const wrap = document.createElement("div");
  wrap.className = "cp-footer";
  const warn = document.createElement("div");
  warn.className = "cp-warn";
  warn.textContent = "";
  const back = document.createElement("button");
  back.className = "cp-back";
  back.textContent = "Retour";
  wrap.append(warn, back);
  return { wrap, warn, back };
};

export const buildPicker = (initial: readonly Pair[]): PickerHandles => {
  const root = document.createElement("div");
  root.className = "cp-overlay";
  root.appendChild(buildStyle());
  const card = document.createElement("div");
  card.className = "cp-card";
  const { wrap: header, close: closeBtn } = buildHeader();
  const checkboxes: HTMLInputElement[] = [];
  const body = buildBody(initial, checkboxes);
  const { wrap: footer, warn, back: backBtn } = buildFooter();
  card.append(header, body, footer);
  root.appendChild(card);
  return { root, body, closeBtn, backBtn, warn, checkboxes };
};
