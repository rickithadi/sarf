'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { UnitSystem } from '@/lib/utils/units';

const STORAGE_KEY = 'surf-app-units';

interface UnitContextValue {
  unit: UnitSystem;
  setUnit: (unit: UnitSystem) => void;
  toggleUnit: () => void;
}

const UnitContext = createContext<UnitContextValue | null>(null);

/**
 * Provider for unit preferences
 */
export function UnitProvider({ children }: { children: ReactNode }) {
  const [unit, setUnitState] = useState<UnitSystem>('imperial');
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'metric' || stored === 'imperial') {
      setUnitState(stored);
    }
  }, []);

  const setUnit = (newUnit: UnitSystem) => {
    setUnitState(newUnit);
    localStorage.setItem(STORAGE_KEY, newUnit);
  };

  const toggleUnit = () => {
    setUnit(unit === 'imperial' ? 'metric' : 'imperial');
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <UnitContext.Provider value={{ unit, setUnit, toggleUnit }}>
      {children}
    </UnitContext.Provider>
  );
}

/**
 * Hook to access unit preferences
 */
export function useUnit(): UnitContextValue {
  const context = useContext(UnitContext);
  if (!context) {
    // Return default values if not in provider (SSR)
    return {
      unit: 'imperial',
      setUnit: () => {},
      toggleUnit: () => {},
    };
  }
  return context;
}

/**
 * Toggle button for switching between metric and imperial
 */
export function UnitToggle({ className }: { className?: string }) {
  const { unit, toggleUnit } = useUnit();

  return (
    <button
      onClick={toggleUnit}
      className={cn(
        'inline-flex min-h-[44px] items-center gap-1 px-3 py-2 rounded-md text-sm font-medium',
        'bg-surface-container hover:bg-surface-container-high transition-colors',
        className
      )}
    >
      <span className={cn(unit === 'imperial' ? 'text-primary font-bold' : 'text-on-surface-variant')}>
        ft/kts
      </span>
      <span className="text-outline-variant">/</span>
      <span className={cn(unit === 'metric' ? 'text-primary font-bold' : 'text-on-surface-variant')}>
        m/km/h
      </span>
    </button>
  );
}

/**
 * Segmented control for unit selection
 */
export function UnitSelector({ className }: { className?: string }) {
  const { unit, setUnit } = useUnit();

  return (
    <div className={cn('inline-flex rounded-lg bg-surface-container p-0.5', className)}>
      <button
        onClick={() => setUnit('imperial')}
        aria-pressed={unit === 'imperial'}
        className={cn(
          'min-h-[44px] px-3 py-2 rounded-md text-sm font-medium transition-colors',
          unit === 'imperial'
            ? 'bg-primary text-on-primary'
            : 'text-on-surface-variant hover:text-on-surface'
        )}
      >
        ft / kts
      </button>
      <button
        onClick={() => setUnit('metric')}
        aria-pressed={unit === 'metric'}
        className={cn(
          'min-h-[44px] px-3 py-2 rounded-md text-sm font-medium transition-colors',
          unit === 'metric'
            ? 'bg-primary text-on-primary'
            : 'text-on-surface-variant hover:text-on-surface'
        )}
      >
        m / km/h
      </button>
    </div>
  );
}
