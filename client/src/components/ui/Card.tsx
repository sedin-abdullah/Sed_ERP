import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: ReactNode;
}

/** Glassmorphic surface — the SedECom <Card /> look. */
export function Card({ interactive, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] shadow-elevated backdrop-blur-xl',
        interactive && 'cursor-pointer transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-premium',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}
