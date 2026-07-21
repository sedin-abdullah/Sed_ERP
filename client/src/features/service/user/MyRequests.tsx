import { useEffect, useMemo, useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useServiceStore } from '../serviceStore';
import { fetchMyQuote, respondToQuote, setRequestStatus } from '../serviceApi';
import { PriorityBadge, RequestStatusBadge } from '../badges';

/** My Requests — the requester's own tickets with live status. Quoted requests
 *  surface the amount with Accept / Reject; open requests can be cancelled.
 *  Everything updates live via the shared store. */
export function MyRequests() {
  const userId = useAuthStore((s) => s.user?.id);
  const requests = useServiceStore((s) => s.requests);
  const quotes = useServiceStore((s) => s.quotes);
  const upsertRequest = useServiceStore((s) => s.upsertRequest);
  const upsertQuote = useServiceStore((s) => s.upsertQuote);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mine = useMemo(
    () => requests.filter((r) => !userId || r.requesterId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [requests, userId],
  );

  // Pull the quote details for any quoted request we don't have yet.
  useEffect(() => {
    mine
      .filter((r) => r.status === 'quoted' && r.quoteId && !quotes.some((q) => q.id === r.quoteId))
      .forEach((r) => { fetchMyQuote(r.id).then((q) => q && upsertQuote(q)).catch(() => undefined); });
  }, [mine, quotes, upsertQuote]);

  async function respond(id: string, action: 'accept' | 'reject') {
    setBusy(id);
    setError(null);
    try {
      const res = await respondToQuote(id, action);
      upsertRequest(res.request);
      if (res.quote) upsertQuote(res.quote);
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setBusy(null);
    }
  }

  async function cancel(id: string) {
    setBusy(id);
    setError(null);
    try {
      upsertRequest(await setRequestStatus(id, 'cancelled'));
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setBusy(null);
    }
  }

  if (mine.length === 0) {
    return (
      <Card data-testid="user-my-requests">
        <CardBody className="flex min-h-[30vh] items-center justify-center text-sm text-muted-foreground">
          You haven't raised any requests yet.
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-3" data-testid="user-my-requests">
      {error && <p className="text-sm text-danger">{error}</p>}
      {mine.map((r) => {
        const quote = quotes.find((q) => q.id === r.quoteId);
        return (
          <Card key={r.id} data-testid={`user-request-${r.code}`} data-status={r.status}>
            <CardBody className="space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{r.code}</span>
                    <RequestStatusBadge status={r.status} />
                    <PriorityBadge priority={r.priority} />
                  </div>
                  <div className="mt-1 font-medium">{r.title}</div>
                  <div className="text-xs capitalize text-muted-foreground">{r.category}{r.machineName ? ` · ${r.machineName}` : ''} · {r.location}</div>
                </div>
                {!['completed', 'cancelled'].includes(r.status) && (
                  <Button size="sm" variant="ghost" isLoading={busy === r.id} data-testid={`user-request-cancel-${r.code}`} onClick={() => cancel(r.id)}>
                    Cancel
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{r.description}</p>

              {r.status === 'quoted' && (
                <div className="rounded-xl border border-brand-500/40 bg-brand-500/5 p-3" data-testid={`user-quote-${r.code}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Quote received</div>
                      <div className="text-lg font-semibold">
                        {quote ? `$${quote.amount.toLocaleString()}` : 'Loading…'}
                      </div>
                      {quote?.notes && <div className="text-xs text-muted-foreground">{quote.notes}</div>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" isLoading={busy === r.id} data-testid={`user-quote-accept-${r.code}`} onClick={() => respond(r.id, 'accept')}>Accept</Button>
                      <Button size="sm" variant="outline" isLoading={busy === r.id} data-testid={`user-quote-reject-${r.code}`} onClick={() => respond(r.id, 'reject')}>Reject</Button>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
