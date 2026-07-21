import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/cn';
import { AdminConsole } from '@/features/service/admin/AdminConsole';
import { UserPortal } from '@/features/service/user/UserPortal';

type SubTab = 'user' | 'admin';

export function ServiceHome() {
  const { t } = useTranslation();
  const can = useAuthStore((s) => s.can);
  // The Admin sub-tab is available to admins and anyone granted the
  // "view all requests" permission (a manager-style role).
  const canAdmin = can('canViewAllRequests');

  // A SedIoT Services CTA navigates here with a requestCategory — jump the
  // user straight to the request form scoped to that category.
  const location = useLocation();
  const navState = location.state as { requestCategory?: string; from?: string } | null;
  const initialCategory = navState?.from === 'sediot' ? navState.requestCategory : undefined;

  const [tab, setTab] = useState<SubTab>(initialCategory ? 'user' : canAdmin ? 'admin' : 'user');

  const tabs: { key: SubTab; label: string; show: boolean }[] = [
    { key: 'user', label: t('service.user'), show: true },
    { key: 'admin', label: t('service.admin'), show: canAdmin },
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

      {tab === 'admin' && canAdmin ? <AdminConsole /> : <UserPortal initialCategory={initialCategory} />}
    </div>
  );
}
