export type PaletteId =
  "neutral" | "violet" | "blue" | "emerald" | "amber" | "rose";

export const PALETTE_STORAGE_KEY = "template-full-palette";
export const PALETTE_ATTRIBUTE = "data-palette";
export const DEFAULT_PALETTE_ID: PaletteId = "neutral";

export type PaletteOption = {
  id: PaletteId;
  label: string;
  swatch: string;
};

export const PALETTES: PaletteOption[] = [
  { id: "neutral", label: "Neutral", swatch: "oklch(0.556 0 0)" },
  { id: "violet", label: "Violet", swatch: "oklch(0.541 0.281 293.009)" },
  { id: "blue", label: "Blue", swatch: "oklch(0.546 0.245 262.881)" },
  { id: "emerald", label: "Emerald", swatch: "oklch(0.596 0.145 163.225)" },
  { id: "amber", label: "Amber", swatch: "oklch(0.769 0.188 70.08)" },
  { id: "rose", label: "Rose", swatch: "oklch(0.586 0.253 17.585)" },
];

// Runs as a blocking inline <script> before paint, so it can't import
// anything — reference PALETTE_STORAGE_KEY/PALETTE_ATTRIBUTE/DEFAULT_PALETTE_ID
// by value here rather than drifting out of sync with a duplicated literal.
export function paletteInitScript(): string {
  return `(function(){try{var e=localStorage.getItem(${JSON.stringify(PALETTE_STORAGE_KEY)});if(e&&e!==${JSON.stringify(DEFAULT_PALETTE_ID)}){document.documentElement.setAttribute(${JSON.stringify(PALETTE_ATTRIBUTE)},e)}}catch(t){}})();`;
}
