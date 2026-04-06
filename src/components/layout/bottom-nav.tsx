"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  {
    href: '/',
    label: 'Explore',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />
      </svg>
    ),
  },
  {
    href: '/how-it-works',
    label: 'Forecast',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5C3 9.36 6.36 6 10.5 6S18 9.36 18 13.5M2 17h16M6 17v-2.5M10 17V14M14 17v-3M18 17v-4" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const isBreakPage = pathname !== '/' && pathname !== '/how-it-works';

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest"
      style={{ borderTop: '1px solid rgba(195, 198, 209, 0.15)' }}
    >
      <div className="flex items-stretch" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map((tab) => {
          const active = tab.href === '/' ? (pathname === '/' || isBreakPage) : pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[0.625rem] font-medium transition-colors ${
                active ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              {tab.icon(active)}
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
