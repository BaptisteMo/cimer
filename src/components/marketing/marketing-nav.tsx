'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Truck } from 'lucide-react';

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
      <nav
        className="container mx-auto flex h-16 items-center justify-between px-4"
        aria-label="Navigation principale"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold transition-opacity hover:opacity-80"
          aria-label="Accueil CMR Digital"
        >
          <Truck className="h-6 w-6" aria-hidden="true" />
          <span className="hidden sm:inline">CMR Digital</span>
          <span className="sm:hidden">CMR</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" asChild className="text-sm sm:text-base">
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button size="sm" asChild className="text-sm sm:text-base">
            <Link href="/signup">
              <span className="hidden sm:inline">Créer un compte</span>
              <span className="sm:hidden">Inscription</span>
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
