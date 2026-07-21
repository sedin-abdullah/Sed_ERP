import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  testId?: string;
  className?: string;
}

/** Centered dialog over a dimmed backdrop. Clicking the backdrop or the ✕
 *  closes it. Kept dependency-free (no portal lib) to honor the free stack. */
export function Modal({ open, onClose, title, children, testId, className }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      data-testid={testId ? `${testId}-backdrop` : undefined}
    >
      <div
        role="dialog"
        aria-label={title}
        data-testid={testId}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-lg rounded-2xl border border-[color:var(--glass-border)] bg-surface shadow-premium',
          'max-h-[85vh] overflow-y-auto',
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} data-testid={testId ? `${testId}-close` : undefined} className="text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
