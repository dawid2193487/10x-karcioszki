import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Check if user is not typing in an input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA" && !target.isContentEditable) {
          e.preventDefault();
          setIsOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const shortcuts = [
    {
      category: "Nawigacja",
      items: [
        { key: "?", description: "Pokaż skróty klawiszowe" },
        { key: "Esc", description: "Zamknij modal/Anuluj edycję" },
      ],
    },
    {
      category: "Akcje",
      items: [
        { key: "n", description: "Nowa talia" },
        { key: "g", description: "Generuj z AI" },
      ],
    },
    {
      category: "Edycja",
      items: [
        { key: "Enter", description: "Zapisz zmiany" },
        { key: "Esc", description: "Anuluj edycję" },
      ],
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        title="Skróty klawiszowe (?)"
        aria-label="Pokaż skróty klawiszowe"
      >
        <span className="text-sm font-semibold">?</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Skróty klawiszowe</DialogTitle>
            <DialogDescription>Przyspiesz swoją pracę używając poniższych skrótów</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {shortcuts.map((section) => (
              <div key={section.category}>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{section.category}</h3>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{item.description}</span>
                      <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
