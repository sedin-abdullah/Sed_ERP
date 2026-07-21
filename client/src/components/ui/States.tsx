import { AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardBody } from './Card';
import { Button } from './Button';

/** Centered spinner for first-load waits (Render free tier can cold-start
 *  ~50s, so the hint reassures the user it isn't stuck). */
export function Loading({ hint, testId = 'loading' }: { hint?: string; testId?: string }) {
  return (
    <Card data-testid={testId}>
      <CardBody className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="size-7 animate-spin text-brand-500" />
        <p className="text-sm text-muted-foreground">{hint ?? 'Loading…'}</p>
      </CardBody>
    </Card>
  );
}

/** Load-failure card with a retry action. */
export function ErrorState({ message, onRetry, testId = 'error-state' }: { message?: string; onRetry?: () => void; testId?: string }) {
  return (
    <Card data-testid={testId}>
      <CardBody className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="size-7 text-danger" />
        <p className="text-sm text-muted-foreground">{message ?? "Couldn't load data."}</p>
        {onRetry && <Button size="sm" variant="outline" onClick={onRetry} data-testid={`${testId}-retry`}>Retry</Button>}
      </CardBody>
    </Card>
  );
}
