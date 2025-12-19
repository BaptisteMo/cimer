import { MarketingNav } from '@/components/marketing/marketing-nav';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-gray-50 py-8" role="contentinfo">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CMR Digital. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
