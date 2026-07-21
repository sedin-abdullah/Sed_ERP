import { useState } from 'react';
import { Plus, Star } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select } from '@/components/ui/form';
import { getApiError } from '@/lib/api';
import { useServiceStore } from '../serviceStore';
import { createTechnician, deactivateTechnician, updateTechnician } from '../serviceApi';
import { TechStatusBadge } from '../badges';
import type { Technician, TechnicianStatus } from '../types';

export function TechniciansAdmin() {
  const technicians = useServiceStore((s) => s.technicians);
  const upsertTechnician = useServiceStore((s) => s.upsertTechnician);
  const [editing, setEditing] = useState<Technician | 'new' | null>(null);

  return (
    <div className="space-y-4" data-testid="admin-technicians">
      <div className="flex justify-end">
        <Button size="sm" data-testid="admin-technician-add" onClick={() => setEditing('new')}>
          <Plus className="size-4" /> Add technician
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {technicians.map((t) => (
          <Card key={t.id} data-testid={`admin-technician-${t.id}`} className={t.active ? '' : 'opacity-50'}>
            <CardBody className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.email}</div>
                </div>
                <TechStatusBadge status={t.status} />
              </div>
              <div className="flex flex-wrap gap-1">
                {t.skills.map((s) => (
                  <span key={s} className="rounded-full border border-border px-2 py-0.5 text-[10px]">{s}</span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                <span>{t.region}</span>
                <span className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5"><Star className="size-3 fill-warning text-warning" /> {t.rating.toFixed(1)}</span>
                  <span>{t.completedJobs} jobs</span>
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" className="flex-1" data-testid={`admin-technician-edit-${t.id}`} onClick={() => setEditing(t)}>Edit</Button>
                {t.active && (
                  <Button size="sm" variant="ghost" data-testid={`admin-technician-deactivate-${t.id}`}
                    onClick={async () => upsertTechnician(await deactivateTechnician(t.id))}>Deactivate</Button>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
        {technicians.length === 0 && <p className="text-sm text-muted-foreground">No technicians yet.</p>}
      </div>

      {editing && (
        <TechnicianModal
          technician={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onDone={(t) => { upsertTechnician(t); setEditing(null); }}
        />
      )}
    </div>
  );
}

function TechnicianModal({ technician, onClose, onDone }: { technician: Technician | null; onClose: () => void; onDone: (t: Technician) => void }) {
  const [name, setName] = useState(technician?.name ?? '');
  const [email, setEmail] = useState(technician?.email ?? '');
  const [phone, setPhone] = useState(technician?.phone ?? '');
  const [region, setRegion] = useState(technician?.region ?? '');
  const [skills, setSkills] = useState((technician?.skills ?? []).join(', '));
  const [status, setStatus] = useState<TechnicianStatus>(technician?.status ?? 'available');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim() || !email.trim() || !region.trim()) { setError('Name, email and region are required'); return; }
    setLoading(true);
    setError(null);
    const body = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      region: region.trim(),
      skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      status,
    };
    try {
      const saved = technician ? await updateTechnician(technician.id, body) : await createTechnician(body);
      onDone(saved);
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={technician ? `Edit — ${technician.name}` : 'Add technician'} testId="admin-technician-modal">
      <div className="space-y-3">
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} data-testid="admin-technician-name" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="admin-technician-email" /></Field>
          <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="admin-technician-phone" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Region"><Input value={region} onChange={(e) => setRegion(e.target.value)} data-testid="admin-technician-region" /></Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as TechnicianStatus)} data-testid="admin-technician-status">
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="off">Off</option>
            </Select>
          </Field>
        </div>
        <Field label="Skills (comma-separated)">
          <Input value={skills} onChange={(e) => setSkills(e.target.value)} data-testid="admin-technician-skills" placeholder="milling, electrical" />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button className="w-full" isLoading={loading} onClick={submit} data-testid="admin-technician-submit">
          {technician ? 'Save changes' : 'Create technician'}
        </Button>
      </div>
    </Modal>
  );
}
