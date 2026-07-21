import { useState } from 'react';
import { ArrowRight, Factory } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { INDUSTRIES } from './catalog';

/** Industries directory — the industry verticals SedIoT serves. Selecting a
 *  card reveals its applications in a detail panel. Reference content only. */
export function Industries() {
  const [selected, setSelected] = useState(INDUSTRIES[0].slug);
  const active = INDUSTRIES.find((i) => i.slug === selected) ?? INDUSTRIES[0];

  return (
    <div className="space-y-6" data-testid="iot-industries">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INDUSTRIES.map((ind) => (
          <Card
            key={ind.slug}
            interactive
            data-testid={`iot-industry-${ind.slug}`}
            data-selected={ind.slug === selected}
            onClick={() => setSelected(ind.slug)}
            className={cn(ind.slug === selected && 'ring-2 ring-brand-500')}
          >
            <CardBody className="space-y-2">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-500">
                <Factory className="size-5" />
              </span>
              <div className="font-semibold">{ind.name}</div>
              <div className="text-xs text-muted-foreground">{ind.tagline}</div>
              <div className="pt-1 text-xs">
                <span className="font-semibold text-brand-500">{ind.metric.value}</span>{' '}
                <span className="text-muted-foreground">{ind.metric.label}</span>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card data-testid="iot-industry-detail">
        <CardBody className="space-y-3">
          <h3 className="text-lg font-semibold">{active.name}</h3>
          <p className="text-sm text-muted-foreground">{active.description}</p>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Applications</div>
            <div className="flex flex-wrap gap-2">
              {active.applications.map((a) => (
                <span key={a} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs">
                  <ArrowRight className="size-3 text-brand-500" /> {a}
                </span>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
