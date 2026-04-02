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
        'inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium',
        'bg-gray-100 hover:bg-gray-200 transition-colors',
        className
      )}
    >
      <span className={cn(unit === 'imperial' ? 'text-blue-600' : 'text-gray-400')}>
        ft/kts
      </span>
      <span className="text-gray-300">/</span>
      <span className={cn(unit === 'metric' ? 'text-blue-600' : 'text-gray-400')}>
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
    <div className={cn('inline-flex rounded-lg border border-gray-200 p-0.5', className)}>
      <button
        onClick={() => setUnit('imperial')}
        className={cn(
          'px-3 py-1 rounded-md text-sm font-medium transition-colors',
          unit === 'imperial'
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 hover:text-gray-900'
        )}
      >
        ft / kts
      </button>
      <button
        onClick={() => setUnit('metric')}
        className={cn(
          'px-3 py-1 rounded-md text-sm font-medium transition-colors',
          unit === 'metric'
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 hover:text-gray-900'
        )}
      >
        m / km/h
      </button>
    </div>
  );
}
