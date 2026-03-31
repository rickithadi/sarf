import type { Metadata } from 'next';
import './globals.css';

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
        {children}
      </body>
    </html>
  );
}
