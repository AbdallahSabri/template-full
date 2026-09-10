# src/components/app-shell — theming conventions

Light/dark/system mode is owned entirely by `next-themes` (`ThemeProvider`
in `src/app/layout.tsx`); `theme-toggle.tsx` is its only UI. Don't touch
that mechanism or add mode values to it.

Palette (accent color) is a second, independent axis, deliberately NOT
folded into next-themes' `themes` list (root CLAUDE.md convention #8: one
theme mechanism per concern, kept simple). It's its own small mechanism:

- `palette.ts` — the registry (`PALETTES`, `PaletteId`), the storage key
  (`localStorage["template-full-palette"]`), the attribute name
  (`data-palette` on `<html>`), and `paletteInitScript()`, the anti-FOUC
  script string inlined as a raw `<script>` in `layout.tsx`, placed inside
  `<body>` right before `<ThemeProvider>` (mirrors next-themes' own
  script-placement technique — it's not in `<head>`, it just has to run
  before anything below it paints).
- `palette-picker.tsx` — the dropdown UI. Reads/writes localStorage through
  `useSyncExternalStore` (server snapshot always `"neutral"`, so SSR and the
  first client render agree — no separate mount gate needed, unlike
  `theme-toggle.tsx`'s `useMounted()`). Same-tab writes don't fire the
  native `storage` event, so `selectPalette()` calls a module-level
  `emitChange()` in addition to subscribing to `storage` for cross-tab sync.
- `"neutral"` is the default and is represented by the **absence** of
  `data-palette`, not `data-palette="neutral"` — don't add a
  `[data-palette="neutral"]` CSS block; the bare `:root`/`.dark` rules in
  `globals.css` already are neutral.
- No `PaletteProvider`/context exists — exactly one consumer
  (`palette-picker.tsx`) reads/writes the state directly. If a second
  consumer needs the palette value later, promote to a small context
  then; don't add one speculatively.

To add a new palette: add one entry to `PALETTES` in `palette.ts`, then add
its `[data-palette="X"]` (light) and `.dark[data-palette="X"]` (dark)
blocks to `src/app/globals.css`, setting only `--primary`,
`--primary-foreground`, `--ring`, `--sidebar-primary`,
`--sidebar-primary-foreground`, `--sidebar-ring`, and `--chart-1..5` —
every other token must stay the shared neutral value across all palettes.
