import { Check, Cpu } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { PROCESS_TECHS } from './catalog';

/** Process Technologies directory — the process capabilities behind the
 *  monitored lines. Reference content, grouped visually by category chip. */
export function ProcessTechnologies() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="iot-processes">
      {PROCESS_TECHS.map((tech) => (
        <Card key={tech.slug} data-testid={`iot-process-${tech.slug}`}>
          <CardBody className="space-y-3">
            <div className="flex items-start justify-between">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-500">
                <Cpu className="size-5" />
              </span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                {tech.category}
              </span>
            </div>
            <div>
              <div className="font-semibold">{tech.name}</div>
              <p className="mt-1 text-xs text-muted-foreground">{tech.description}</p>
            </div>
            <ul className="space-y-1">
              {tech.benefits.map((b) => (
                <li key={b} className="flex items-center gap-2 text-xs">
                  <Check className="size-3.5 shrink-0 text-success" /> {b}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
