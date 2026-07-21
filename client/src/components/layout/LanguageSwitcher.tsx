import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { LANGUAGES } from '@/i18n';
import { cn } from '@/lib/cn';

/** Language selector — persists to localStorage (via the detector) and flips
 *  document direction for RTL languages. Dependency-free dropdown. */
export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) ?? LANGUAGES[0];

  return (
    <div className="relative">
      <button
        data-testid="language-switcher"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground"
      >
        <Globe className="size-4" />
        <span className="hidden sm:inline">{current.label}</span>
      </button>
      {open && (
        <div
          data-testid="language-menu"
          className="absolute end-0 z-50 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-surface shadow-premium"
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              data-testid={`language-option-${l.code}`}
              onMouseDown={() => { i18n.changeLanguage(l.code); setOpen(false); }}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-surface-2',
                l.code === current.code ? 'text-brand-500' : 'text-foreground',
              )}
            >
              {l.label}
              {l.code === current.code && <Check className="size-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
