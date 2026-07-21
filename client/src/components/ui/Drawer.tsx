import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  testId?: string;
}

/** Right-side slide-over panel. Backdrop click or ✕ closes. Dependency-free. */
export function Drawer({ open, onClose, title, subtitle, children, testId }: DrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose} data-testid={testId ? `${testId}-backdrop` : undefined}>
      <div
        role="dialog"
        aria-label={title}
        data-testid={testId}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col border-s border-border bg-surface shadow-premium"
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button onClick={onClose} data-testid={testId ? `${testId}-close` : undefined} className="text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
