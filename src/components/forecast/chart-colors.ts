/**
 * Centralised chart color tokens — Nautical Precisionist design system.
 * Recharts renders into SVG attributes, so these must be concrete hex values
 * (CSS custom properties don't work in SVG fill/stroke attributes).
 * Update here to change across all forecast charts simultaneously.
 */

/** Wind quality spectrum — offshore (best) → onshore (worst) */
export const windQualityColors = {
  offshore: '#5ead5c',         // on-tertiary-container green
  'cross-offshore': '#88d982', // tertiary-fixed-dim
  'cross-shore': '#a7c8ff',    // primary-fixed-dim (neutral blue)
  'cross-onshore': '#f97316',  // orange (keep semantic warning)
  onshore: '#ba1a1a',          // error red
  default: '#737780',          // outline
} as const;

/** Swell period quality */
export const periodQualityColors = {
  excellent: '#5ead5c',   // on-tertiary-container green
  good: '#88d982',        // tertiary-fixed-dim
  average: '#a7c8ff',     // primary-fixed-dim
  default: '#737780',     // outline
} as const;

/** Swell type */
export const swellTypeColors = {
  'ground-swell': '#5ead5c',   // on-tertiary-container
  'long-period': '#1a60a4',    // secondary
  'wind-swell': '#a7c8ff',     // primary-fixed-dim
  'short-chop': '#ba1a1a',     // error
  default: '#737780',           // outline
} as const;

/** Chart axes, grid lines, and primary data lines */
export const chartUiColors = {
  axis: '#737780',         // outline
  grid: '#e6e8ea',         // surface-container-high
  gridLine: '#c3c6d1',     // outline-variant
  waveHeight: '#1a60a4',   // secondary
  swellHeight: '#5ead5c',  // on-tertiary-container
  today: '#ba1a1a',        // error
  areaFill: '#001e40',     // primary (use at 10% opacity)
} as const;
