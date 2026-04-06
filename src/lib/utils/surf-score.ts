import type { WindQuality } from '@/lib/breaks/wind-quality';

const windWeights: Record<WindQuality, number> = {
  offshore: 1,
  'cross-offshore': 0.85,
  'cross-shore': 0.65,
  'cross-onshore': 0.4,
  onshore: 0.2,
};

interface SurfScoreInput {
  heightMeters?: number | null;
  periodSeconds?: number | null;
  windQuality?: WindQuality | null;
  tideFactor?: number | null; // 0-1 representing how aligned the tide is
}

export function calculateSurfScore({
  heightMeters,
  periodSeconds,
  windQuality = null,
  tideFactor,
}: SurfScoreInput): number {
  const swellComponent = Math.min(Math.max(heightMeters ?? 0, 0) / 2.5, 1) * 4;
  const periodComponent = Math.min(Math.max(periodSeconds ?? 0, 0) / 14, 1) * 3;
  const windComponent = (windWeights[windQuality ?? 'cross-shore'] ?? 0.55) * 3;
  const tideComponent = Math.min(Math.max(tideFactor ?? 0.6, 0), 1) * 1.5;

  const raw = swellComponent + periodComponent + windComponent + tideComponent;
  return Math.round(Math.min(raw, 10) * 10) / 10;
}

export function scoreToDecision(score: number) {
  if (score >= 7.5) {
    return {
      label: 'Go now',
      tone: 'good' as const,
      description: 'Clean swell, favorable wind, lined-up banks.',
    };
  }
  if (score >= 5.5) {
    return {
      label: 'Keep an eye on it',
      tone: 'okay' as const,
      description: 'Rideable with some texture—worth a check later.',
    };
  }
  return {
    label: 'Wait it out',
    tone: 'poor' as const,
    description: 'Wind/tide not cooperating. Expect inconsistency.',
  };
}

export function toneToColor(tone: 'good' | 'okay' | 'poor') {
  switch (tone) {
    case 'good':
      return 'var(--surf-good)';
    case 'okay':
      return 'var(--surf-okay)';
    case 'poor':
    default:
      return 'var(--surf-poor)';
  }
}

export function toneToSurface(tone: 'good' | 'okay' | 'poor') {
  switch (tone) {
    case 'good':
      return 'color-mix(in oklch, var(--surf-good) 12%, white 88%)';
    case 'okay':
      return 'color-mix(in oklch, var(--surf-okay) 16%, white 84%)';
    case 'poor':
    default:
      return 'color-mix(in oklch, var(--surf-poor) 10%, white 90%)';
  }
}
