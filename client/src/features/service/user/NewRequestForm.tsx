import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { getApiError } from '@/lib/api';
import { useServiceStore } from '../serviceStore';
import { createRequest } from '../serviceApi';
import { REQUEST_CATEGORIES } from '../types';

/** New service request form. `prefillCategory` is set when the user arrives
 *  from a SedIoT Services "Request via SedService" button. On success it hands
 *  the created request up so the portal can jump to My Requests. */
export function NewRequestForm({ prefillCategory, onCreated }: { prefillCategory?: string; onCreated: () => void }) {
  const upsertRequest = useServiceStore((s) => s.upsertRequest);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(prefillCategory && REQUEST_CATEGORIES.includes(prefillCategory as never) ? prefillCategory : 'maintenance');
  const [priority, setPriority] = useState('medium');
  const [machineName, setMachineName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !description.trim()) {
      setError('Title, location and description are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const created = await createRequest({
        title: title.trim(),
        category,
        priority,
        machineName: machineName.trim() || undefined,
        location: location.trim(),
        description: description.trim(),
      });
      upsertRequest(created);
      onCreated();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card data-testid="user-new-request">
      <CardBody>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} data-testid="user-request-title" placeholder="e.g. Roaster 2 temperature drift" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value)} data-testid="user-request-category">
                {REQUEST_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={priority} onChange={(e) => setPriority(e.target.value)} data-testid="user-request-priority">
                {['low', 'medium', 'high', 'critical'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Machine (optional)">
              <Input value={machineName} onChange={(e) => setMachineName(e.target.value)} data-testid="user-request-machine" placeholder="Mill Line A" />
            </Field>
            <Field label="Location">
              <Input value={location} onChange={(e) => setLocation(e.target.value)} data-testid="user-request-location" placeholder="Plant A · Line 1" />
            </Field>
          </div>
          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} data-testid="user-request-description" placeholder="Describe the issue or the work needed…" />
          </Field>
          {error && <p className="text-sm text-danger" data-testid="user-request-error">{error}</p>}
          <Button type="submit" isLoading={loading} data-testid="user-request-submit">Submit request</Button>
        </form>
      </CardBody>
    </Card>
  );
}
