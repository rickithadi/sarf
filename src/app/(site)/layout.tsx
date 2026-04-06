import { Header } from '@/components/layout/header';
import { BomAttribution } from '@/components/layout/bom-attribution';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Skip-to-content: visible only on keyboard focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-primary focus:shadow-lg focus:outline-none"
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="flex-1 pb-16 md:pb-0">{children}</main>
      <BomAttribution />
      <BottomNav />
    </div>
  );
}
