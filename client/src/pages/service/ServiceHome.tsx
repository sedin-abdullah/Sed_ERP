import { useState } from 'react';
import { Wrench } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/cn';
import { AdminConsole } from '@/features/service/admin/AdminConsole';

type SubTab = 'user' | 'admin';

export function ServiceHome() {
  const can = useAuthStore((s) => s.can);
  // The Admin sub-tab is available to admins and anyone granted the
  // "view all requests" permission (a manager-style role).
  const canAdmin = can('canViewAllRequests');
  const [tab, setTab] = useState<SubTab>(canAdmin ? 'admin' : 'user');

  const tabs: { key: SubTab; label: string; show: boolean }[] = [
    { key: 'user', label: 'User', show: true },
    { key: 'admin', label: 'Admin', show: canAdmin },
  ];

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-2">
        {tabs.filter((t) => t.show).map((t) => (
          <button
            key={t.key}
            data-testid={`service-tab-${t.key}`}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              tab === t.key ? 'bg-brand-500/15 text-brand-500' : 'text-muted-foreground hover:bg-surface-2',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'admin' && canAdmin ? (
        <AdminConsole />
      ) : (
        <Card>
          <CardBody className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
            <Wrench className="size-8 text-muted-foreground" />
            <p className="font-medium">SedService — User</p>
            <p className="max-w-md text-sm text-muted-foreground">
              The customer marketplace (landing, request/quote forms, My Requests) arrives in Phase 5.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
