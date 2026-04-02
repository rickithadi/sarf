import type { Metadata } from 'next';
import './globals.css';
import { UnitProvider } from '@/components/ui/unit-toggle';
import { FavoritesProvider } from '@/components/ui/favorites';

export const metadata: Metadata = {
  title: 'Surf Forecast - Victorian Surf Breaks',
  description: 'Real-time surf conditions and AI-powered forecasts for Victoria\'s best surf breaks.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        <UnitProvider>
          <FavoritesProvider>
            {children}
          </FavoritesProvider>
        </UnitProvider>
      </body>
    </html>
  );
}
