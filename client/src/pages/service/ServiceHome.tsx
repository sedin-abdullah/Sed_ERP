import { useState } from 'react';
import { Wrench } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/cn';

type SubTab = 'user' | 'admin';

export function ServiceHome() {
  const role = useAuthStore((s) => s.user?.role);
  const [tab, setTab] = useState<SubTab>('user');

  // Admin sub-tab is only meaningful for admins.
  const tabs: { key: SubTab; label: string; show: boolean }[] = [
    { key: 'user', label: 'User', show: true },
    { key: 'admin', label: 'Admin', show: role === 'admin' },
  ];

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-2">
        {tabs.filter((t) => t.show).map((t) => (
          <button
            key={t.key}
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

      <Card>
        <CardBody className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
          <Wrench className="size-8 text-muted-foreground" />
          <p className="font-medium">SedService — {tab === 'user' ? 'User' : 'Admin'}</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {tab === 'user'
              ? 'The customer marketplace (landing, request/quote forms, My Requests) arrives in a later phase.'
              : 'Admin console (users & permissions, technicians, requests, jobs Kanban, coverage) arrives in a later phase.'}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
