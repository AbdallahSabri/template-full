"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DEFAULT_PALETTE_ID,
  PALETTE_ATTRIBUTE,
  PALETTE_STORAGE_KEY,
  PALETTES,
  type PaletteId,
} from "./palette";

// The stored palette isn't known until this runs client-side, so the
// server and the first client render must agree — useSyncExternalStore's
// getServerSnapshot gives that shared "neutral" default, then a re-render
// picks up the real localStorage value right after hydration. Same-tab
// writes don't fire the native "storage" event, so selectPalette() below
// notifies `listeners` itself in addition to subscribing to it for
// cross-tab sync.
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): PaletteId {
  try {
    const stored = localStorage.getItem(PALETTE_STORAGE_KEY);
    return (PALETTES.find((p) => p.id === stored)?.id ??
      DEFAULT_PALETTE_ID) as PaletteId;
  } catch {
    return DEFAULT_PALETTE_ID;
  }
}

function getServerSnapshot(): PaletteId {
  return DEFAULT_PALETTE_ID;
}

export function PalettePicker() {
  const palette = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function selectPalette(id: PaletteId) {
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, id);
    } catch {
      // localStorage unavailable (private mode, disabled) — the palette
      // still applies for this session, just won't persist.
    }
    if (id === DEFAULT_PALETTE_ID) {
      document.documentElement.removeAttribute(PALETTE_ATTRIBUTE);
    } else {
      document.documentElement.setAttribute(PALETTE_ATTRIBUTE, id);
    }
    emitChange();
  }

  const activeOption =
    PALETTES.find((option) => option.id === palette) || PALETTES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Change color palette"
          />
        }
      >
        <span
          className="ring-border size-4 rounded-full ring-1"
          style={{ backgroundColor: activeOption.swatch }}
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {PALETTES.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => selectPalette(option.id)}
            className={cn(
              palette === option.id && "bg-accent text-accent-foreground",
            )}
          >
            <span
              className="ring-border size-3.5 rounded-full ring-1"
              style={{ backgroundColor: option.swatch }}
              aria-hidden="true"
            />
            {option.label}
            {palette === option.id && (
              <Check className="ml-auto size-4" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
