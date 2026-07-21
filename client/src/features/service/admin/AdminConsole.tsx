import { useState } from 'react';
import { ClipboardList, HardHat, KanbanSquare, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Loading, ErrorState } from '@/components/ui/States';
import { useServiceStream } from '../useServiceStream';
import { useServiceStore } from '../serviceStore';
import { RequestsAdmin } from './RequestsAdmin';
import { TechniciansAdmin } from './TechniciansAdmin';
import { JobsKanban } from './JobsKanban';
import { UsersAdmin } from './UsersAdmin';

type Panel = 'requests' | 'technicians' | 'jobs' | 'users';

const NAV: { key: Panel; label: string; icon: typeof Users }[] = [
  { key: 'requests', label: 'Requests', icon: ClipboardList },
  { key: 'technicians', label: 'Technicians', icon: HardHat },
  { key: 'jobs', label: 'Jobs', icon: KanbanSquare },
  { key: 'users', label: 'Users', icon: Users },
];

/** SedService Admin console — loads the marketplace dataset, keeps it live, and
 *  routes between the four management panels. */
export function AdminConsole() {
  const [panel, setPanel] = useState<Panel>('requests');
  const { status, retry } = useServiceStream({ loadUsers: true });

  const requests = useServiceStore((s) => s.requests);
  const technicians = useServiceStore((s) => s.technicians);
  const jobs = useServiceStore((s) => s.jobs);

  const loaded = useServiceStore((s) => s.loaded);
  const openRequests = requests.filter((r) => !['completed', 'cancelled'].includes(r.status)).length;
  const availableTechs = technicians.filter((t) => t.active && t.status === 'available').length;
  const activeJobs = jobs.filter((j) => j.status !== 'completed').length;

  // First load only — on tab switches the store already has data, so skip the
  // spinner and keep the console responsive.
  if (!loaded && status === 'loading') return <Loading hint="Loading the service console… (the free-tier server may be waking up)" testId="admin-loading" />;
  if (!loaded && status === 'error') return <ErrorState message="Couldn't reach the server." onRetry={retry} testId="admin-error" />;

  return (
    <div className="space-y-5" data-testid="service-admin-console">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Open requests" value={openRequests} testId="admin-stat-requests" />
        <Stat label="Techs available" value={availableTechs} testId="admin-stat-techs" />
        <Stat label="Active jobs" value={activeJobs} testId="admin-stat-jobs" />
      </div>

      <div className="flex flex-wrap gap-2">
        {NAV.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            data-testid={`admin-nav-${key}`}
            onClick={() => setPanel(key)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              panel === key ? 'bg-brand-500/15 text-brand-500' : 'text-muted-foreground hover:bg-surface-2',
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      {panel === 'requests' && <RequestsAdmin />}
      {panel === 'technicians' && <TechniciansAdmin />}
      {panel === 'jobs' && <JobsKanban />}
      {panel === 'users' && <UsersAdmin />}
    </div>
  );
}

function Stat({ label, value, testId }: { label: string; value: number; testId: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2/50 px-4 py-3" data-testid={testId}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
