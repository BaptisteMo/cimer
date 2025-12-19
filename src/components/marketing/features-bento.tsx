import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileText, History, PenTool, Smartphone } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Création de CMR en quelques clics',
    description: 'Remplissez les informations essentielles et générez votre lettre de voiture en moins de 2 minutes.',
    className: 'md:col-span-2',
  },
  {
    icon: PenTool,
    title: 'Signatures digitales',
    description: 'Expéditeurs et destinataires signent directement sur mobile ou tablette.',
    className: 'md:col-span-1',
  },
  {
    icon: History,
    title: 'Historique complet',
    description: 'Retrouvez tous vos CMR passés en un clin d\'œil, avec recherche et filtres.',
    className: 'md:col-span-1',
  },
  {
    icon: Smartphone,
    title: 'Conçu pour les chauffeurs',
    description: 'Interface mobile optimisée pour saisir les réserves, prendre des photos et collecter les signatures sur la route.',
    className: 'md:col-span-2',
  },
];

export function FeaturesBento() {
  return (
    <section
      className="bg-gray-50 py-16 sm:py-20 md:py-24"
      aria-labelledby="features-heading"
    >
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center md:mb-16">
          <h2
            id="features-heading"
            className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl"
          >
            Ce que Cimer fait pour vous
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            Une solution complète pour digitaliser vos lettres de voiture CMR et gagner du temps au quotidien.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-4 sm:gap-6 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className={`${feature.className} transition-shadow hover:shadow-lg`}
              >
                <CardHeader className="space-y-4">
                  <div
                    className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"
                    aria-hidden="true"
                  >
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold leading-tight">
                    {feature.title}
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-base text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
