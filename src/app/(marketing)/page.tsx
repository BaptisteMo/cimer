import type { Metadata } from 'next';
import { HeroSection } from '@/components/marketing/hero-section';
import { FeaturesBento } from '@/components/marketing/features-bento';
import { PricingSection } from '@/components/marketing/pricing-section';
import { CtaSection } from '@/components/marketing/cta-section';

export const metadata: Metadata = {
  title: 'CMR Digital | Lettres de voiture digitales pour transporteurs',
  description: 'Créez, signez et archivez vos documents CMR en moins de 2 minutes. Solution pensée pour les petites flottes et chauffeurs indépendants.',
};

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesBento />
      <PricingSection />
      <CtaSection />
    </>
  );
}
