import { Check, Minus, ShieldCheck } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';

/** All grantable permissions with human labels — mirrors the server's
 *  ALL_PERMISSIONS. Admins implicitly hold every one (see authStore.can). */
const PERMISSION_LABELS: Record<string, string> = {
  canRequestService: 'Request service',
  canRequestQuote: 'Request quote',
  canViewAllRequests: 'View all requests',
  canCancelRequest: 'Cancel request',
  canRateTechnician: 'Rate technician',
  canAccessReports: 'Access reports',
  canManageTechnicians: 'Manage technicians',
  canManageUsers: 'Manage users',
  canControlMachines: 'Control machines',
  canSendMachineAlerts: 'Send machine alerts',
  canPowerCycleMachines: 'Power-cycle machines',
  canBroadcastAlerts: 'Broadcast alerts',
};

const ROLE_STYLE: Record<string, string> = {
  admin: 'bg-brand-500/15 text-brand-500',
  user: 'bg-success/15 text-success',
  technician: 'bg-warning/15 text-warning',
};

/** Portal — the signed-in user's identity and effective permissions. Reads
 *  the persisted auth store; admins show every permission as granted. */
export function Portal() {
  const user = useAuthStore((s) => s.user);
  const can = useAuthStore((s) => s.can);

  if (!user) return null;

  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="space-y-6" data-testid="iot-portal">
      <Card>
        <CardBody className="flex flex-wrap items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-gradient text-xl font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0">
            <div className="text-lg font-semibold" data-testid="iot-portal-name">{user.name}</div>
            <div className="text-sm text-muted-foreground" data-testid="iot-portal-email">{user.email}</div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', ROLE_STYLE[user.role] ?? 'bg-muted text-muted-foreground')}
                data-testid="iot-portal-role"
              >
                {user.role}
              </span>
              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs uppercase text-muted-foreground">
                {user.language}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4 text-brand-500" /> Permissions
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
              const granted = can(key);
              return (
                <div
                  key={key}
                  data-testid={`iot-portal-permission-${key}`}
                  data-granted={granted}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm',
                    granted ? 'border-success/40 bg-success/10' : 'border-border text-muted-foreground',
                  )}
                >
                  {granted ? <Check className="size-4 text-success" /> : <Minus className="size-4" />}
                  {label}
                </div>
              );
            })}
          </div>
          {user.role === 'admin' && (
            <p className="mt-3 text-xs text-muted-foreground">Admins implicitly hold every permission.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
