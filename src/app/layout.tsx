import type { Metadata } from 'next';
import { Barlow_Condensed, DM_Sans } from 'next/font/google';
import './globals.css';
import { UnitProvider } from '@/components/ui/unit-toggle';
import { FavoritesProvider } from '@/components/ui/favorites';

// Display/headline font — condensed, authoritative, nautical editorial
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

// Body/label font — clean, legible at small sizes outdoors
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LINEUP — Victorian Surf Breaks',
  description: 'Real-time surf conditions and AI-powered forecasts for Victoria\'s best surf breaks. Know when it\'s on.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${barlowCondensed.variable} ${dmSans.variable}`}>
      <body className="antialiased">
        <UnitProvider>
          <FavoritesProvider>
            {children}
          </FavoritesProvider>
        </UnitProvider>
      </body>
    </html>
  );
}
