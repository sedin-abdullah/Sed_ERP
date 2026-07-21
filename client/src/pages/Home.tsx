import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, ArrowRight, Wrench } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';

const PRODUCTS = [
  { to: '/iot', icon: Activity, name: 'SedIoT', descKey: 'home.iotDesc' },
  { to: '/service', icon: Wrench, name: 'SedService', descKey: 'home.serviceDesc' },
];

export function Home() {
  const { t } = useTranslation();
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('home.badge')}
        </span>
        <h1 className="mt-5 text-4xl font-bold sm:text-5xl">{t('home.title')}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{t('home.subtitle')}</p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
        {PRODUCTS.map((p) => (
          <Link key={p.to} to={p.to} data-testid={`home-product-${p.to.replace('/', '')}`}>
            <Card interactive className="h-full">
              <CardBody className="flex h-full flex-col">
                <span className="flex size-12 items-center justify-center rounded-xl bg-brand-500/15 text-brand-500">
                  <p.icon className="size-6" />
                </span>
                <h2 className="mt-4 text-2xl">{p.name}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{t(p.descKey)}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-500">
                  {t('home.open')} {p.name} <ArrowRight className="size-4" />
                </span>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
