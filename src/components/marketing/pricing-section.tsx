'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Gratuit',
    price: '0 €',
    period: 'mois',
    description: 'Parfait pour tester Cimer sur quelques tournées.',
    features: [
      'Jusqu\'à 10 CMR par mois',
      'Export PDF basique',
      'Signatures digitales',
      'Support par email',
      'Stockage 30 jours',
    ],
    cta: 'Commencer gratuitement',
    ctaLink: '/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '19 €',
    period: 'mois',
    description: 'Pour les petites flottes qui veulent professionnaliser leur gestion.',
    badge: 'Bientôt disponible',
    features: [
      'CMR illimités',
      'Historique complet',
      'Gestion des réserves et photos',
      'Export PDF avancé',
      'Stockage illimité et sécurisé',
      'Support prioritaire',
    ],
    cta: 'Bientôt disponible',
    ctaDisabled: true,
    highlighted: true,
  },
];

export function PricingSection() {
  return (
    <section
      className="py-16 sm:py-20 md:py-24"
      aria-labelledby="pricing-heading"
    >
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center md:mb-16">
          <h2
            id="pricing-heading"
            className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl"
          >
            Tarifs simples, sans surprise
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            Commencez gratuitement et passez au plan Pro quand vous êtes prêt.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 sm:gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.highlighted
                  ? 'border-primary shadow-lg'
                  : 'border-border'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="shadow-sm">{plan.badge}</Badge>
                </div>
              )}
              <CardHeader className="space-y-4 pb-8">
                <div>
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>
                <div>
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground"> / {plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3" role="list">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.ctaDisabled ? (
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? 'default' : 'outline'}
                    disabled
                    aria-disabled="true"
                  >
                    {plan.cta}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? 'default' : 'outline'}
                    asChild
                  >
                    <Link
                      href={plan.ctaLink!}
                      aria-label={`${plan.cta} - Plan ${plan.name}`}
                    >
                      {plan.cta}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
