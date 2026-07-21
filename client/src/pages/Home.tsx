import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Wrench } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';

const PRODUCTS = [
  {
    to: '/iot',
    icon: Activity,
    name: 'SedIoT',
    tagline: 'Digital plant monitoring & services',
    desc: 'Connect industrial machines to the cloud, stream live sensor data, surface KPIs, and browse value-added services.',
  },
  {
    to: '/service',
    icon: Wrench,
    name: 'SedService',
    tagline: 'On-demand field-service marketplace',
    desc: 'Match equipment operators with a vetted network of local technicians for maintenance, installs, inspections and repairs.',
  },
];

export function Home() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Industrial Operations Platform
        </span>
        <h1 className="mt-5 text-4xl font-bold sm:text-5xl">
          One platform for your <span className="bg-brand-gradient bg-clip-text text-transparent">connected plant</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          SedERP unifies real-time equipment monitoring and on-demand field service across every industrial vertical.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
        {PRODUCTS.map((p) => (
          <Link key={p.to} to={p.to}>
            <Card interactive className="h-full">
              <CardBody className="flex h-full flex-col">
                <span className="flex size-12 items-center justify-center rounded-xl bg-brand-500/15 text-brand-500">
                  <p.icon className="size-6" />
                </span>
                <h2 className="mt-4 text-2xl">{p.name}</h2>
                <p className="text-sm font-medium text-accent-500">{p.tagline}</p>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-500">
                  Open {p.name} <ArrowRight className="size-4" />
                </span>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
