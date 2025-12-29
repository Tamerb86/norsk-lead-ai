import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Search,
  Users,
  Mail,
  FileText,
  Zap,
  BarChart3,
  Calendar,
  Plus,
  Settings,
  HelpCircle,
  Keyboard,
  Navigation,
  MousePointer,
  Command as CommandIcon,
} from "lucide-react";

interface KeyboardShortcutsProps {
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

// Shortcut badge component
function ShortcutBadge({ shortcut }: { shortcut: string }) {
  const keys = shortcut.split(" + ");
  return (
    <div className="flex items-center gap-1">
      {keys.map((key, index) => (
        <kbd
          key={index}
          className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded shadow-sm"
        >
          {key}
        </kbd>
      ))}
    </div>
  );
}

// Shortcuts help dialog
export function ShortcutsHelpDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const navigationShortcuts = [
    { keys: "Ctrl + D", description: "Gå til Dashboard", icon: LayoutDashboard },
    { keys: "Ctrl + Shift + S", description: "Gå til Søk", icon: Search },
    { keys: "Ctrl + L", description: "Gå til Leads", icon: Users },
    { keys: "Ctrl + K", description: "Gå til Kampanjer", icon: Mail },
    { keys: "Ctrl + M", description: "Gå til Maler", icon: FileText },
    { keys: "Ctrl + E", description: "Gå til Sekvenser", icon: Zap },
    { keys: "Ctrl + Shift + A", description: "Gå til Analyse", icon: BarChart3 },
    { keys: "Ctrl + Shift + C", description: "Gå til Kalender", icon: Calendar },
  ];

  const actionShortcuts = [
    { keys: "Ctrl + N", description: "Ny kampanje", icon: Plus },
    { keys: "Ctrl + T", description: "Ny mal", icon: FileText },
  ];

  const uiShortcuts = [
    { keys: "/", description: "Åpne hurtigsøk", icon: Search },
    { keys: "Shift + ?", description: "Vis hurtigtaster", icon: HelpCircle },
    { keys: "Escape", description: "Lukk dialog", icon: MousePointer },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Hurtigtaster
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Navigation */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="h-4 w-4 text-blue-500" />
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Navigasjon
              </h3>
            </div>
            <div className="grid gap-2">
              {navigationShortcuts.map((shortcut) => (
                <div
                  key={shortcut.keys}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <shortcut.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{shortcut.description}</span>
                  </div>
                  <ShortcutBadge shortcut={shortcut.keys} />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-green-500" />
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Handlinger
              </h3>
            </div>
            <div className="grid gap-2">
              {actionShortcuts.map((shortcut) => (
                <div
                  key={shortcut.keys}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <shortcut.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{shortcut.description}</span>
                  </div>
                  <ShortcutBadge shortcut={shortcut.keys} />
                </div>
              ))}
            </div>
          </div>

          {/* UI */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CommandIcon className="h-4 w-4 text-purple-500" />
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Grensesnitt
              </h3>
            </div>
            <div className="grid gap-2">
              {uiShortcuts.map((shortcut) => (
                <div
                  key={shortcut.keys}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <shortcut.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{shortcut.description}</span>
                  </div>
                  <ShortcutBadge shortcut={shortcut.keys} />
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Tips:</strong> Trykk <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">/</kbd> for å åpne hurtigsøk fra hvor som helst i appen.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick search command palette
export function QuickSearchDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [, setLocation] = useLocation();

  const handleSelect = (path: string) => {
    setLocation(path);
    onClose();
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput placeholder="Søk etter sider, handlinger..." />
      <CommandList>
        <CommandEmpty>Ingen resultater funnet.</CommandEmpty>

        <CommandGroup heading="Sider">
          <CommandItem onSelect={() => handleSelect("/dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/search")}>
            <Search className="mr-2 h-4 w-4" />
            <span>Søk bedrifter</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/leads")}>
            <Users className="mr-2 h-4 w-4" />
            <span>Leads</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/campaigns")}>
            <Mail className="mr-2 h-4 w-4" />
            <span>Kampanjer</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/templates")}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Maler</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/sequences")}>
            <Zap className="mr-2 h-4 w-4" />
            <span>Sekvenser</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/analytics")}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Analyse</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/calendar")}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Kalender</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Handlinger">
          <CommandItem onSelect={() => handleSelect("/campaigns/new")}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Opprett ny kampanje</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/templates/new")}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Opprett ny mal</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/sequences/new")}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Opprett ny sekvens</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Innstillinger">
          <CommandItem onSelect={() => handleSelect("/account")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Min konto</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// Main keyboard shortcuts provider component
export function KeyboardShortcutsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Escape always works
      if (event.key === "Escape") {
        setIsHelpOpen(false);
        setIsSearchOpen(false);
        return;
      }

      // Don't process other shortcuts in input fields
      if (isInputField) return;

      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;

      // Quick search: /
      if (event.key === "/" && !ctrl && !shift) {
        event.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      // Help: Shift + ?
      if (event.key === "?" && shift) {
        event.preventDefault();
        setIsHelpOpen(true);
        return;
      }

      // Navigation shortcuts
      if (ctrl) {
        switch (event.key.toLowerCase()) {
          case "d":
            if (!shift) {
              event.preventDefault();
              setLocation("/dashboard");
            }
            break;
          case "s":
            if (shift) {
              event.preventDefault();
              setLocation("/search");
            }
            break;
          case "l":
            if (!shift) {
              event.preventDefault();
              setLocation("/leads");
            }
            break;
          case "k":
            if (!shift) {
              event.preventDefault();
              setLocation("/campaigns");
            }
            break;
          case "m":
            if (!shift) {
              event.preventDefault();
              setLocation("/templates");
            }
            break;
          case "e":
            if (!shift) {
              event.preventDefault();
              setLocation("/sequences");
            }
            break;
          case "a":
            if (shift) {
              event.preventDefault();
              setLocation("/analytics");
            }
            break;
          case "c":
            if (shift) {
              event.preventDefault();
              setLocation("/calendar");
            }
            break;
          case "n":
            if (!shift) {
              event.preventDefault();
              setLocation("/campaigns/new");
            }
            break;
          case "t":
            if (!shift) {
              event.preventDefault();
              setLocation("/templates/new");
            }
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setLocation]);

  return (
    <>
      {children}
      <ShortcutsHelpDialog isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <QuickSearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
