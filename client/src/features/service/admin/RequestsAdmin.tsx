import { useMemo, useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { getApiError } from '@/lib/api';
import { useServiceStore } from '../serviceStore';
import { approveRequest, assignRequest, quoteRequest, setRequestStatus } from '../serviceApi';
import { PriorityBadge, RequestStatusBadge } from '../badges';
import type { ServiceRequest } from '../types';

/** Requests admin — the request queue with the full lifecycle actions
 *  (quote → approve → assign → cancel). Reads the live store, so a peer
 *  admin's action appears here without a refresh. */
export function RequestsAdmin() {
  const requests = useServiceStore((s) => s.requests);
  const technicians = useServiceStore((s) => s.technicians);
  const upsertRequest = useServiceStore((s) => s.upsertRequest);

  const [quoteFor, setQuoteFor] = useState<ServiceRequest | null>(null);
  const [assignFor, setAssignFor] = useState<ServiceRequest | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shown = useMemo(
    () => (filter === 'all' ? requests : requests.filter((r) => r.status === filter)),
    [requests, filter],
  );

  async function run(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4" data-testid="admin-requests">
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'pending', 'quoted', 'approved', 'assigned', 'in_progress', 'completed', 'cancelled'].map((f) => (
          <button
            key={f}
            data-testid={`admin-requests-filter-${f}`}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs capitalize ${
              filter === f ? 'border-brand-500 bg-brand-500/10 text-brand-500' : 'border-border text-muted-foreground'
            }`}
          >
            {f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-danger" data-testid="admin-requests-error">{error}</p>}

      <Card>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Request</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Requester</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} data-testid={`admin-request-row-${r.code}`} data-status={r.status} className="border-b border-border/60 align-top">
                  <td className="p-3 font-mono text-xs">{r.code}</td>
                  <td className="p-3">
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs capitalize text-muted-foreground">{r.category}{r.machineName ? ` · ${r.machineName}` : ''} · {r.location}</div>
                  </td>
                  <td className="p-3"><PriorityBadge priority={r.priority} /></td>
                  <td className="p-3 text-xs">{r.requesterName}</td>
                  <td className="p-3"><RequestStatusBadge status={r.status} /></td>
                  <td className="p-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {r.status === 'pending' && (
                        <Button size="sm" variant="outline" data-testid={`admin-request-quote-${r.code}`} onClick={() => setQuoteFor(r)}>Quote</Button>
                      )}
                      {r.status === 'quoted' && (
                        <Button size="sm" variant="outline" isLoading={busy === r.id} data-testid={`admin-request-approve-${r.code}`}
                          onClick={() => run(r.id, async () => upsertRequest(await approveRequest(r.id)))}>Approve</Button>
                      )}
                      {(r.status === 'approved' || r.status === 'quoted') && (
                        <Button size="sm" data-testid={`admin-request-assign-${r.code}`} onClick={() => setAssignFor(r)}>Assign</Button>
                      )}
                      {!['completed', 'cancelled'].includes(r.status) && (
                        <Button size="sm" variant="ghost" isLoading={busy === r.id} data-testid={`admin-request-cancel-${r.code}`}
                          onClick={() => run(r.id, async () => upsertRequest(await setRequestStatus(r.id, 'cancelled')))}>Cancel</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">No requests in this view.</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {quoteFor && (
        <QuoteModal request={quoteFor} onClose={() => setQuoteFor(null)} onDone={(r) => { upsertRequest(r); setQuoteFor(null); }} />
      )}
      {assignFor && (
        <AssignModal
          request={assignFor}
          technicians={technicians.filter((t) => t.active)}
          onClose={() => setAssignFor(null)}
          onDone={(r) => { upsertRequest(r); setAssignFor(null); }}
        />
      )}
    </div>
  );
}

function QuoteModal({ request, onClose, onDone }: { request: ServiceRequest; onClose: () => void; onDone: (r: ServiceRequest) => void }) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) { setError('Enter a valid amount'); return; }
    setLoading(true);
    try {
      const res = await quoteRequest(request.id, { amount: value, notes: notes || undefined, validUntil: validUntil || undefined });
      onDone(res.request);
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Quote — ${request.code}`} testId="admin-quote-modal">
      <div className="space-y-3">
        <Field label="Amount (USD)">
          <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="admin-quote-amount" placeholder="1500" />
        </Field>
        <Field label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="admin-quote-notes" /></Field>
        <Field label="Valid until"><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} data-testid="admin-quote-valid" /></Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button className="w-full" isLoading={loading} onClick={submit} data-testid="admin-quote-submit">Send quote</Button>
      </div>
    </Modal>
  );
}

function AssignModal({ request, technicians, onClose, onDone }: {
  request: ServiceRequest;
  technicians: { id: string; name: string; region: string; status: string }[];
  onClose: () => void;
  onDone: (r: ServiceRequest) => void;
}) {
  const [technicianId, setTechnicianId] = useState(technicians[0]?.id ?? '');
  const [scheduledFor, setScheduledFor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!technicianId) { setError('Select a technician'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await assignRequest(request.id, technicianId, scheduledFor || undefined);
      onDone(res.request);
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Assign — ${request.code}`} testId="admin-assign-modal">
      <div className="space-y-3">
        <Field label="Technician">
          <Select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} data-testid="admin-assign-technician">
            {technicians.length === 0 && <option value="">No active technicians</option>}
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>{t.name} · {t.region} ({t.status})</option>
            ))}
          </Select>
        </Field>
        <Field label="Scheduled for"><Input type="date" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} data-testid="admin-assign-date" /></Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button className="w-full" isLoading={loading} onClick={submit} data-testid="admin-assign-submit" disabled={!technicianId}>Create job</Button>
      </div>
    </Modal>
  );
}
