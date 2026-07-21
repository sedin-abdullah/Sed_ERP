import { useState } from 'react';
import { ClipboardList, LayoutGrid, PlusCircle } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';
import { SERVICE_OFFERINGS } from '@/features/iot/catalog';
import { useServiceStream } from '../useServiceStream';
import { NewRequestForm } from './NewRequestForm';
import { MyRequests } from './MyRequests';

type Tab = 'catalog' | 'new' | 'mine';

/** SedService User portal — the customer marketplace. `initialCategory` is
 *  passed when the user arrives from a SedIoT Services CTA, opening the new
 *  request form pre-scoped to that service category. */
export function UserPortal({ initialCategory }: { initialCategory?: string }) {
  const can = useAuthStore((s) => s.can);
  const canRequest = can('canRequestService');
  // Only user-owned data needed here — skip jobs/technicians/users fetches.
  useServiceStream({ loadJobs: false, loadTechnicians: false });

  const [tab, setTab] = useState<Tab>(initialCategory && canRequest ? 'new' : 'catalog');
  const [prefill, setPrefill] = useState<string | undefined>(initialCategory);

  const startRequest = (category?: string) => {
    setPrefill(category);
    setTab('new');
  };

  const tabs: { key: Tab; label: string; icon: typeof LayoutGrid; show: boolean }[] = [
    { key: 'catalog', label: 'Browse services', icon: LayoutGrid, show: true },
    { key: 'new', label: 'New request', icon: PlusCircle, show: canRequest },
    { key: 'mine', label: 'My requests', icon: ClipboardList, show: true },
  ];

  return (
    <div className="space-y-5" data-testid="service-user-portal">
      <div className="flex flex-wrap gap-2">
        {tabs.filter((t) => t.show).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            data-testid={`user-nav-${key}`}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              tab === key ? 'bg-brand-500/15 text-brand-500' : 'text-muted-foreground hover:bg-surface-2',
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'catalog' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="user-catalog">
          {SERVICE_OFFERINGS.map((svc) => (
            <Card key={svc.slug} data-testid={`user-catalog-${svc.slug}`}>
              <CardBody className="flex h-full flex-col space-y-2">
                <div className="font-semibold">{svc.name}</div>
                <p className="flex-1 text-xs text-muted-foreground">{svc.summary}</p>
                {canRequest && (
                  <Button size="sm" variant="outline" className="w-full" data-testid={`user-catalog-request-${svc.slug}`} onClick={() => startRequest(svc.requestCategory)}>
                    Request this
                  </Button>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {tab === 'new' && canRequest && <NewRequestForm prefillCategory={prefill} onCreated={() => setTab('mine')} />}

      {tab === 'mine' && <MyRequests />}
    </div>
  );
}
