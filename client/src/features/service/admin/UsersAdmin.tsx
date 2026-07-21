import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import { getApiError } from '@/lib/api';
import { useServiceStore } from '../serviceStore';
import { updateUser } from '../serviceApi';
import type { AdminUser } from '../types';

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
const ALL_KEYS = Object.keys(PERMISSION_LABELS);

/** Users & permissions — toggle account access and edit the granular
 *  permission set. A permission change broadcasts permission:changed, which
 *  live-updates that user's own abilities if they're signed in elsewhere. */
export function UsersAdmin() {
  const users = useServiceStore((s) => s.users);
  const upsertUser = useServiceStore((s) => s.upsertUser);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggleActive(u: AdminUser) {
    setBusy(u.id);
    try {
      upsertUser(await updateUser(u.id, { active: !u.active }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4" data-testid="admin-users">
      <Card>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Permissions</th>
                <th className="p-3">Active</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} data-testid={`admin-user-row-${u.email}`} className="border-b border-border/60">
                  <td className="p-3">
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="p-3 capitalize">{u.role}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {u.role === 'admin' ? 'All (admin)' : `${u.permissions.length} granted`}
                  </td>
                  <td className="p-3">
                    <button
                      data-testid={`admin-user-active-${u.email}`}
                      data-active={u.active}
                      disabled={busy === u.id}
                      onClick={() => toggleActive(u)}
                      className={cn('rounded-full px-2 py-0.5 text-xs font-medium', u.active ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger')}
                    >
                      {u.active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="outline" disabled={u.role === 'admin'} data-testid={`admin-user-edit-${u.email}`} onClick={() => setEditing(u)}>
                      Permissions
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">No users loaded.</td></tr>}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {editing && (
        <PermissionsModal user={editing} onClose={() => setEditing(null)} onDone={(u) => { upsertUser(u); setEditing(null); }} />
      )}
    </div>
  );
}

function PermissionsModal({ user, onClose, onDone }: { user: AdminUser; onClose: () => void; onDone: (u: AdminUser) => void }) {
  const [selected, setSelected] = useState<string[]>(user.permissions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      onDone(await updateUser(user.id, { permissions: selected }));
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Permissions — ${user.name}`} testId="admin-permissions-modal">
      <div className="space-y-3">
        <div className="grid gap-2">
          {ALL_KEYS.map((key) => {
            const on = selected.includes(key);
            return (
              <button
                key={key}
                type="button"
                data-testid={`admin-permission-${key}`}
                data-granted={on}
                onClick={() => toggle(key)}
                className={cn(
                  'flex items-center justify-between rounded-xl border px-3 py-2 text-sm',
                  on ? 'border-brand-500 bg-brand-500/10 text-brand-500' : 'border-border text-muted-foreground',
                )}
              >
                {PERMISSION_LABELS[key]}
                <span className="text-xs">{on ? 'Granted' : 'Off'}</span>
              </button>
            );
          })}
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button className="w-full" isLoading={loading} onClick={submit} data-testid="admin-permissions-submit">Save permissions</Button>
      </div>
    </Modal>
  );
}
