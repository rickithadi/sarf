'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
  className,
  id,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section id={id} className={cn('rounded-lg border border-gray-200 bg-white', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left sm:p-6"
        aria-expanded={isOpen}
      >
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <svg
          className={cn('h-5 w-5 text-gray-500 transition-transform duration-200', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="border-t border-gray-100 p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </section>
  );
}
