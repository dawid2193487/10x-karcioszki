import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { HelpCircle } from "lucide-react";

interface KeyboardShortcutsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onDismissForever?: () => void;
  showDismissOption?: boolean;
}

interface ShortcutGroup {
  title: string;
  shortcuts: KeyboardShortcut[];
}

interface KeyboardShortcut {
  key: string;
  description: string;
  condition?: string;
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    title: "Podstawowe",
    shortcuts: [
      {
        key: "Spacja",
        description: "Pokaż odpowiedź",
        condition: "gdy odpowiedź ukryta",
      },
      {
        key: "?",
        description: "Pokaż pomoc",
      },
    ],
  },
  {
    title: "Ocena fiszki",
    shortcuts: [
      {
        key: "1",
        description: "Again - nie pamiętam",
        condition: "gdy odpowiedź odkryta",
      },
      {
        key: "2",
        description: "Hard - trudne",
        condition: "gdy odpowiedź odkryta",
      },
      {
        key: "3",
        description: "Good - dobrze",
        condition: "gdy odpowiedź odkryta",
      },
      {
        key: "4",
        description: "Easy - łatwe",
        condition: "gdy odpowiedź odkryta",
      },
    ],
  },
];

export default function KeyboardShortcutsOverlay({
  isOpen,
  onClose,
  onDismissForever,
  showDismissOption = true,
}: KeyboardShortcutsOverlayProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain && onDismissForever) {
      onDismissForever();
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Skróty klawiszowe
          </DialogTitle>
          <DialogDescription>Użyj klawiatury, aby przyspieszyć naukę</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {SHORTCUTS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold mb-3 text-foreground">{group.title}</h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div key={shortcut.key} className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-foreground">{shortcut.description}</div>
                      {shortcut.condition && (
                        <div className="text-xs text-muted-foreground mt-0.5">{shortcut.condition}</div>
                      )}
                    </div>
                    <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-secondary border border-border rounded">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {showDismissOption && onDismissForever && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="dont-show-again"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="dont-show-again" className="text-sm text-muted-foreground cursor-pointer">
              Nie pokazuj ponownie
            </label>
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleClose}>Zamknij</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
