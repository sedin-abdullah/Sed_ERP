import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getApiError } from '@/lib/api';
import { useServiceStore } from '../serviceStore';
import { setJobStatus } from '../serviceApi';
import { JOB_STATUSES, type JobStatus } from '../types';

const COLUMN_LABEL: Record<JobStatus, string> = {
  scheduled: 'Scheduled',
  en_route: 'En route',
  on_site: 'On site',
  completed: 'Completed',
};

/** Jobs Kanban — one column per status. "Advance" moves a job to the next
 *  stage; the server keeps the linked request + technician in sync and
 *  broadcasts, so the card jumps columns live for every admin. */
export function JobsKanban() {
  const jobs = useServiceStore((s) => s.jobs);
  const upsertJob = useServiceStore((s) => s.upsertJob);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function advance(id: string, current: JobStatus) {
    const next = JOB_STATUSES[JOB_STATUSES.indexOf(current) + 1];
    if (!next) return;
    setBusy(id);
    setError(null);
    try {
      upsertJob(await setJobStatus(id, next));
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3" data-testid="admin-jobs">
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {JOB_STATUSES.map((status) => {
          const column = jobs.filter((j) => j.status === status);
          return (
            <div key={status} data-testid={`admin-jobs-col-${status}`} className="rounded-2xl border border-border bg-surface-2/40 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold">{COLUMN_LABEL[status]}</h3>
                <span className="rounded-full bg-surface px-2 text-xs text-muted-foreground">{column.length}</span>
              </div>
              <div className="space-y-2">
                {column.map((j) => (
                  <Card key={j.id} data-testid={`admin-job-${j.code}`}>
                    <CardBody className="space-y-2 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-muted-foreground">{j.code}</span>
                      </div>
                      <div className="text-sm font-medium leading-tight">{j.requestTitle}</div>
                      <div className="text-xs text-muted-foreground">👷 {j.technicianName}</div>
                      {status !== 'completed' && (
                        <Button size="sm" variant="outline" className="w-full" isLoading={busy === j.id}
                          data-testid={`admin-job-advance-${j.code}`} onClick={() => advance(j.id, j.status)}>
                          {COLUMN_LABEL[JOB_STATUSES[JOB_STATUSES.indexOf(j.status) + 1]]} <ArrowRight className="size-3.5" />
                        </Button>
                      )}
                    </CardBody>
                  </Card>
                ))}
                {column.length === 0 && <p className="px-1 py-4 text-center text-xs text-muted-foreground">Empty</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
