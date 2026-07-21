import { cn } from '@/lib/cn';
import type { JobStatus, RequestPriority, RequestStatus, TechnicianStatus } from './types';

const REQUEST_STATUS: Record<RequestStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  quoted: 'bg-brand-500/15 text-brand-500',
  approved: 'bg-accent-500/15 text-accent-500',
  assigned: 'bg-warning/15 text-warning',
  in_progress: 'bg-warning/15 text-warning',
  completed: 'bg-success/15 text-success',
  cancelled: 'bg-danger/15 text-danger',
};

const PRIORITY: Record<RequestPriority, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-brand-500/15 text-brand-500',
  high: 'bg-warning/15 text-warning',
  critical: 'bg-danger/15 text-danger',
};

const TECH_STATUS: Record<TechnicianStatus, string> = {
  available: 'bg-success/15 text-success',
  busy: 'bg-warning/15 text-warning',
  off: 'bg-muted text-muted-foreground',
};

const JOB_STATUS: Record<JobStatus, string> = {
  scheduled: 'bg-brand-500/15 text-brand-500',
  en_route: 'bg-warning/15 text-warning',
  on_site: 'bg-accent-500/15 text-accent-500',
  completed: 'bg-success/15 text-success',
};

function Pill({ tone, children, testId }: { tone: string; children: string; testId?: string }) {
  return (
    <span data-testid={testId} className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize', tone)}>
      {children.replace(/_/g, ' ')}
    </span>
  );
}

export const RequestStatusBadge = ({ status }: { status: RequestStatus }) => <Pill tone={REQUEST_STATUS[status]}>{status}</Pill>;
export const PriorityBadge = ({ priority }: { priority: RequestPriority }) => <Pill tone={PRIORITY[priority]}>{priority}</Pill>;
export const TechStatusBadge = ({ status }: { status: TechnicianStatus }) => <Pill tone={TECH_STATUS[status]}>{status}</Pill>;
export const JobStatusBadge = ({ status }: { status: JobStatus }) => <Pill tone={JOB_STATUS[status]}>{status}</Pill>;
