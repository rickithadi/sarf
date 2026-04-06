"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Forecasts' },
  { href: '/how-it-works', label: 'Ocean Science' },
  { href: '#', label: 'Tide Charts' },
  { href: '#', label: 'News' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 border-none"
      style={{ backdropFilter: 'blur(24px)', backgroundColor: 'rgba(247, 249, 251, 0.85)' }}
    >
      <div className="mx-auto flex items-center justify-between px-4 py-4 max-w-screen-2xl sm:px-6 xl:px-8">
        {/* Logo */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-black tracking-tighter font-display text-primary">Lineup</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 font-display font-bold tracking-tight text-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                className={`pb-2 transition-colors duration-200 ${
                  pathname === link.href
                    ? 'border-b-4 border-secondary text-primary'
                    : 'text-[#5c708a] hover:text-secondary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>


        {/* Mobile: placeholder (nav handled by BottomNav) */}
        <div className="md:hidden w-9" />
      </div>
    </header>
  );
}
