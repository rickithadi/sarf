"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Live dashboard' },
  { href: '/how-it-works', label: 'How it works' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0B1F2A] text-white text-lg font-bold">
            L
          </span>
          <div>
            <p className="text-base font-semibold text-slate-900">LINEUP</p>
            <p className="text-xs uppercase tracking-[0.3em] text-[#2E8BC0]">Know when it’s on</p>
          </div>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-1 transition-colors ${
                pathname === link.href
                  ? 'bg-[#2E8BC0]/10 text-[#0B1F2A]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
