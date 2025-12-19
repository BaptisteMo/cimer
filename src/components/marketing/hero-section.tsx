'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section
      className="container mx-auto px-4 py-16 sm:py-20 md:py-32"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-sm font-medium">
          <span className="text-foreground">
            Pensé pour les petites flottes et les chauffeurs indépendants
          </span>
        </div>

        {/* Main Headline */}
        <h1
          id="hero-heading"
          className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
        >
          Gérez vos lettres de voiture CMR{' '}
          <span className="text-primary">sans paperasse</span>
        </h1>

        {/* Description */}
        <p className="mb-10 text-base text-muted-foreground sm:text-lg md:text-xl">
          Créez, signez et archivez vos documents CMR en moins de 2 minutes.
          Fini les papiers perdus, tout est digital et sécurisé.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-3">
          <Button size="lg" asChild className="gap-2 text-base">
            <Link href="/signup" aria-label="Créer un compte gratuit pour commencer">
              Créer un compte gratuit
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-base">
            <Link href="/login" aria-label="Se connecter à votre compte existant">
              Se connecter
            </Link>
          </Button>
        </div>

        {/* Social Proof */}
        <p className="mt-10 text-sm text-muted-foreground sm:text-base">
          Parfait pour les transporteurs routiers, commissionnaires et chauffeurs indépendants
        </p>
      </div>
    </section>
  );
}
