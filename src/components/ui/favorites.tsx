'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'surf-app-favorites';

interface FavoritesContextValue {
  favorites: Set<string>;
  isFavorite: (breakId: string) => boolean;
  toggleFavorite: (breakId: string) => void;
  addFavorite: (breakId: string) => void;
  removeFavorite: (breakId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/**
 * Provider for favorites functionality
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(new Set(parsed));
        }
      }
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
  }, []);

  // Save to localStorage when favorites change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favorites)));
    }
  }, [favorites, mounted]);

  const isFavorite = (breakId: string) => favorites.has(breakId);

  const toggleFavorite = (breakId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(breakId)) {
        next.delete(breakId);
      } else {
        next.add(breakId);
      }
      return next;
    });
  };

  const addFavorite = (breakId: string) => {
    setFavorites((prev) => new Set(prev).add(breakId));
  };

  const removeFavorite = (breakId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.delete(breakId);
      return next;
    });
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <FavoritesContext.Provider
      value={{ favorites, isFavorite, toggleFavorite, addFavorite, removeFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

/**
 * Hook to access favorites
 */
export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    // Return default values if not in provider (SSR)
    return {
      favorites: new Set(),
      isFavorite: () => false,
      toggleFavorite: () => {},
      addFavorite: () => {},
      removeFavorite: () => {},
    };
  }
  return context;
}

/**
 * Heart icon button for favoriting
 */
interface FavoriteButtonProps {
  breakId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FavoriteButton({
  breakId,
  size = 'md',
  className,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(breakId);

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(breakId);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'p-1 rounded-full transition-colors',
        favorited ? 'text-red-500' : 'text-gray-400 hover:text-red-400',
        className
      )}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <HeartIcon filled={favorited} className={sizeClasses[size]} />
    </button>
  );
}

/**
 * Heart SVG icon
 */
function HeartIcon({
  filled,
  className,
}: {
  filled: boolean;
  className?: string;
}) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

/**
 * Filter toggle for showing only favorites
 */
export function FavoritesFilter({
  showOnlyFavorites,
  onToggle,
  className,
}: {
  showOnlyFavorites: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
        showOnlyFavorites
          ? 'bg-red-100 text-red-700 border border-red-200'
          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200',
        className
      )}
    >
      <HeartIcon filled={showOnlyFavorites} className="w-4 h-4" />
      <span>Favorites{showOnlyFavorites ? ' only' : ''}</span>
    </button>
  );
}
