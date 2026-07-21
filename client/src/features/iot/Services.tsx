import { useNavigate } from 'react-router-dom';
import { Check, Wrench } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SERVICE_OFFERINGS } from './catalog';

/** Services directory — the service catalog. Each offering links into
 *  SedService to raise a request (the SedIoT → SedService integration hook;
 *  the request flow itself lands in Phase 5). */
export function Services() {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="iot-services">
      {SERVICE_OFFERINGS.map((svc) => (
        <Card key={svc.slug} data-testid={`iot-service-${svc.slug}`}>
          <CardBody className="flex h-full flex-col space-y-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-500">
              <Wrench className="size-5" />
            </span>
            <div>
              <div className="font-semibold">{svc.name}</div>
              <p className="mt-1 text-xs text-muted-foreground">{svc.summary}</p>
            </div>
            <ul className="flex-1 space-y-1">
              {svc.includes.map((i) => (
                <li key={i} className="flex items-center gap-2 text-xs">
                  <Check className="size-3.5 shrink-0 text-success" /> {i}
                </li>
              ))}
            </ul>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              data-testid={`iot-service-request-${svc.slug}`}
              onClick={() => navigate('/service', { state: { requestCategory: svc.requestCategory, from: 'sediot' } })}
            >
              Request via SedService
            </Button>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
