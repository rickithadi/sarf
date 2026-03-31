import { Header } from '@/components/layout/header';
import { BomAttribution } from '@/components/layout/bom-attribution';

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <BomAttribution />
    </div>
  );
}
