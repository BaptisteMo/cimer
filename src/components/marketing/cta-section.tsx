'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CtaSection() {
  return (
    <section
      className="bg-primary py-16 text-primary-foreground sm:py-20 md:py-24"
      aria-labelledby="cta-heading"
    >
      <div className="container mx-auto px-4 text-center">
        <h2
          id="cta-heading"
          className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl"
        >
          Prêt à digitaliser vos CMR ?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-base opacity-95 sm:text-lg md:mb-10">
          Rejoignez les transporteurs qui ont déjà simplifié leur gestion administrative.
          Commencez gratuitement, aucune carte bancaire requise.
        </p>
        <Button
          size="lg"
          variant="secondary"
          asChild
          className="gap-2 text-base shadow-lg"
        >
          <Link
            href="/signup"
            aria-label="Créer mon compte gratuit - Inscription rapide"
          >
            Créer mon compte gratuit
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
