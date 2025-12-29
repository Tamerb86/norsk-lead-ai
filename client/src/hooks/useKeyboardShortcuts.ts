import { useEffect, useCallback, useState } from "react";
import { useLocation } from "wouter";

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  category: "navigation" | "actions" | "ui";
  action: () => void;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
}

// Format shortcut key for display
export function formatShortcut(shortcut: Omit<Shortcut, "action" | "description" | "category">): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push("Ctrl");
  if (shortcut.alt) parts.push("Alt");
  if (shortcut.shift) parts.push("Shift");
  parts.push(shortcut.key.toUpperCase());
  return parts.join(" + ");
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true } = options;
  const [, setLocation] = useLocation();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Define shortcuts
  const shortcuts: Shortcut[] = [
    // Navigation shortcuts
    {
      key: "d",
      ctrl: true,
      description: "Gå til Dashboard",
      category: "navigation",
      action: () => setLocation("/dashboard"),
    },
    {
      key: "s",
      ctrl: true,
      shift: true,
      description: "Gå til Søk",
      category: "navigation",
      action: () => setLocation("/search"),
    },
    {
      key: "l",
      ctrl: true,
      description: "Gå til Leads",
      category: "navigation",
      action: () => setLocation("/leads"),
    },
    {
      key: "k",
      ctrl: true,
      description: "Gå til Kampanjer",
      category: "navigation",
      action: () => setLocation("/campaigns"),
    },
    {
      key: "m",
      ctrl: true,
      description: "Gå til Maler",
      category: "navigation",
      action: () => setLocation("/templates"),
    },
    {
      key: "e",
      ctrl: true,
      description: "Gå til Sekvenser",
      category: "navigation",
      action: () => setLocation("/sequences"),
    },
    {
      key: "a",
      ctrl: true,
      shift: true,
      description: "Gå til Analyse",
      category: "navigation",
      action: () => setLocation("/analytics"),
    },
    {
      key: "c",
      ctrl: true,
      shift: true,
      description: "Gå til Kalender",
      category: "navigation",
      action: () => setLocation("/calendar"),
    },

    // Action shortcuts
    {
      key: "n",
      ctrl: true,
      description: "Ny kampanje",
      category: "actions",
      action: () => setLocation("/campaigns/new"),
    },
    {
      key: "t",
      ctrl: true,
      description: "Ny mal",
      category: "actions",
      action: () => setLocation("/templates/new"),
    },

    // UI shortcuts
    {
      key: "/",
      description: "Åpne hurtigsøk",
      category: "ui",
      action: () => setIsSearchOpen(true),
    },
    {
      key: "?",
      shift: true,
      description: "Vis hurtigtaster",
      category: "ui",
      action: () => setIsHelpOpen(true),
    },
    {
      key: "Escape",
      description: "Lukk dialog",
      category: "ui",
      action: () => {
        setIsHelpOpen(false);
        setIsSearchOpen(false);
      },
    },
  ];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Only allow Escape in input fields
        if (event.key !== "Escape") return;
      }

      // Find matching shortcut
      const matchingShortcut = shortcuts.find((shortcut) => {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
          (shortcut.key === "?" && event.key === "?" && event.shiftKey);
        const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatch = !!shortcut.shift === event.shiftKey;
        const altMatch = !!shortcut.alt === event.altKey;

        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    },
    [enabled, shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts,
    isHelpOpen,
    setIsHelpOpen,
    isSearchOpen,
    setIsSearchOpen,
  };
}

// Get shortcuts grouped by category
export function getShortcutsByCategory(shortcuts: Shortcut[]) {
  return {
    navigation: shortcuts.filter((s) => s.category === "navigation"),
    actions: shortcuts.filter((s) => s.category === "actions"),
    ui: shortcuts.filter((s) => s.category === "ui"),
  };
}
