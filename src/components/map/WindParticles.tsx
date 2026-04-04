'use client';

import { useEffect, useRef } from 'react';
import type { GridPoint } from '@/app/api/map/grid/route';
import type { Map as MapboxMap } from 'mapbox-gl';

interface WindParticlesProps {
  points: GridPoint[];
  hourIndex: number;
  mapRef: React.RefObject<MapboxMap | null>;
  variable: 'waveHeight' | 'windSpeed' | 'wavePeriod';
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angleDeg: number,
  length: number,
  alpha: number
) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const dx = Math.cos(rad) * length;
  const dy = Math.sin(rad) * length;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - dx / 2, y - dy / 2);
  ctx.lineTo(x + dx / 2, y + dy / 2);
  ctx.stroke();

  // Arrowhead
  const headLen = length * 0.35;
  const headRad = Math.PI / 6;
  ctx.beginPath();
  ctx.moveTo(x + dx / 2, y + dy / 2);
  ctx.lineTo(
    x + dx / 2 - headLen * Math.cos(rad - headRad),
    y + dy / 2 - headLen * Math.sin(rad - headRad)
  );
  ctx.moveTo(x + dx / 2, y + dy / 2);
  ctx.lineTo(
    x + dx / 2 - headLen * Math.cos(rad + headRad),
    y + dy / 2 - headLen * Math.sin(rad + headRad)
  );
  ctx.stroke();
  ctx.restore();
}

export function WindParticles({ points, hourIndex, mapRef, variable }: WindParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const map = mapRef.current;
    if (!canvas || !map) return;

    const container = map.getContainer();
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const directionKey = variable === 'windSpeed' ? 'windDirection' : 'waveDirection';
    const speedKey = variable === 'windSpeed' ? 'windSpeed' : 'waveHeight';

    for (const point of points) {
      const dirValues = point[directionKey as keyof GridPoint] as (number | null)[];
      const speedValues = point[speedKey as keyof GridPoint] as (number | null)[];
      const dir = dirValues?.[hourIndex];
      const speed = speedValues?.[hourIndex];

      if (dir === null || dir === undefined || speed === null || speed === undefined) continue;

      // Project lat/lng to pixel
      const px = map.project([point.lng, point.lat]);

      // Skip if outside canvas
      if (px.x < -20 || px.x > canvas.width + 20 || px.y < -20 || px.y > canvas.height + 20) continue;

      const maxSpeed = variable === 'windSpeed' ? 60 : 5;
      const alpha = Math.min(0.8, 0.15 + (speed / maxSpeed) * 0.65);
      const arrowLen = Math.min(22, 8 + (speed / maxSpeed) * 18);

      drawArrow(ctx, px.x, px.y, dir, arrowLen, alpha);
    }
  }, [points, hourIndex, mapRef, variable]);

  // Resize canvas when window resizes
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const map = mapRef.current;
      if (!canvas || !map) return;
      const container = map.getContainer();
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mapRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 2 }}
    />
  );
}
