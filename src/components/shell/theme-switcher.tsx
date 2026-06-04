import { useState, type CSSProperties } from "react";
import { Check, Palette } from "lucide-react";

import { Button } from "@/components/ui/button";
import { themeOptions, type ThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";

export function ThemeSwitcher({
  theme,
  setTheme,
}: {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="motion-theme fixed right-4 top-4 z-10">
      <Button
        aria-expanded={open}
        aria-label="Select theme"
        className="bg-background/85 backdrop-blur"
        onClick={() => setOpen((value) => !value)}
        size="icon"
        type="button"
        variant="outline"
      >
        <Palette className="motion-icon h-4 w-4" />
      </Button>

      {open ? (
        <div className="motion-popover mt-2 min-w-32 border border-border bg-background p-1 shadow-sm">
          {themeOptions.map((option, optionIndex) => (
            <button
              className={cn(
                "motion-menu-item flex w-full items-center justify-between gap-3 px-2 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground",
                theme === option.id && "text-primary",
              )}
              key={option.id}
              onClick={() => {
                setTheme(option.id);
                setOpen(false);
              }}
              style={{ "--item-index": optionIndex } as CSSProperties}
              type="button"
            >
              <span>{option.label}</span>
              {theme === option.id ? <Check className="h-3.5 w-3.5" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
