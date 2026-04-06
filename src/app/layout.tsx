import type { Metadata } from 'next';
import { Manrope, Inter } from 'next/font/google';
import './globals.css';
import { UnitProvider } from '@/components/ui/unit-toggle';
import { FavoritesProvider } from '@/components/ui/favorites';

// Display/headline font — geometric, authoritative, nautical editorial
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

// Body/label font — precision tool, legible in dense data at any size
const inter = Inter({
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
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
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
