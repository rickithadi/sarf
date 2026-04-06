'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Map, { Source, Layer, Marker, type MapRef } from 'react-map-gl';
import type { HeatmapLayer } from 'react-map-gl';
import type { GridData } from '@/app/api/map/grid/route';
import { MapControls } from './MapControls';
import { WindParticles } from './WindParticles';
import type { MapVariable } from './colorScale';
import { variableMaxValues } from './colorScale';
import 'mapbox-gl/dist/mapbox-gl.css';

interface BreakMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface Bounds {
  sw: [number, number]; // [lat, lng]
  ne: [number, number];
}

interface MeteoMapProps {
  gridData: GridData;
  breaks: BreakMarker[];
  initialBounds: Bounds;
  height?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export function MeteoMap({ gridData, breaks, initialBounds, height = '480px' }: MeteoMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [variable, setVariable] = useState<MapVariable>('waveHeight');
  const [hourIndex, setHourIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef<number | null>(null);

  // Calculate initial viewport from bounds
  const centerLat = (initialBounds.sw[0] + initialBounds.ne[0]) / 2;
  const centerLng = (initialBounds.sw[1] + initialBounds.ne[1]) / 2;

  // Build GeoJSON for current hour; memoized so marker interactions don't thrash Mapbox layers
  const geojson = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: gridData.points.map((pt) => {
        const val =
          variable === 'waveHeight'
            ? pt.waveHeight[hourIndex]
            : variable === 'windSpeed'
            ? pt.windSpeed[hourIndex]
            : pt.wavePeriod[hourIndex];

        return {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [pt.lng, pt.lat] },
          properties: { value: val ?? 0 },
        };
      }),
    };
  }, [gridData.points, hourIndex, variable]);

  const maxVal = variableMaxValues[variable];

  const heatmapLayer: HeatmapLayer = {
    id: 'meteo-heatmap',
    type: 'heatmap',
    source: 'meteo-grid',
    paint: {
      'heatmap-weight': ['/', ['get', 'value'], maxVal],
      'heatmap-intensity': 1.5,
      'heatmap-radius': 60,
      'heatmap-opacity': 0.82,
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(11,31,42,0)', // transparent brand navy
        0.25, 'rgb(11,31,42)',
        0.45, 'rgb(46,139,192)',
        0.65, 'rgb(11,114,133)',
        0.8, 'rgb(76,175,80)',
        0.92, 'rgb(244,211,94)',
        1, 'rgb(230,57,70)',
      ],
    },
  };

  // Auto-play
  const advance = useCallback(() => {
    setHourIndex((i) => (i + 1) % gridData.hours.length);
  }, [gridData.hours.length]);

  useEffect(() => {
    const cleanup = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    if (!playing) {
      cleanup();
      return () => cleanup();
    }

    const scheduleAdvance = () => {
      frameRef.current = requestAnimationFrame(() => {
        advance();
        timeoutRef.current = setTimeout(scheduleAdvance, 320);
      });
    };

    scheduleAdvance();

    return () => cleanup();
  }, [playing, advance]);

  // Fit map to bounds once loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    mapRef.current.fitBounds(
      [[initialBounds.sw[1], initialBounds.sw[0]], [initialBounds.ne[1], initialBounds.ne[0]]],
      { padding: 20, duration: 0 }
    );
  }, [mapLoaded, initialBounds]);

  const mapInstance = mapRef.current?.getMap() ?? null;

  return (
    <div className="relative rounded-lg overflow-hidden bg-black" style={{ height }}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: centerLng,
          latitude: centerLat,
          zoom: 5,
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        onLoad={() => setMapLoaded(true)}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        {mapLoaded && (
          <Source id="meteo-grid" type="geojson" data={geojson}>
            <Layer {...heatmapLayer} />
          </Source>
        )}

        {breaks.map((b) => {
          const isActive = activeMarker === b.id;
          const labelId = `marker-label-${b.id}`;
          return (
            <Marker key={b.id} longitude={b.lng} latitude={b.lat} anchor="center">
              <div
                className="group relative flex flex-col items-center gap-1 text-white"
                onMouseLeave={() => setActiveMarker((prev) => (prev === b.id ? null : prev))}
              >
                <button
                  type="button"
                  aria-label={`Show ${b.name} details`}
                  aria-describedby={labelId}
                  aria-pressed={isActive}
                  onClick={() => setActiveMarker((prev) => (prev === b.id ? null : b.id))}
                  onFocus={() => setActiveMarker(b.id)}
                  onBlur={() => setActiveMarker((prev) => (prev === b.id ? null : prev))}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-black bg-white shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span className="sr-only">{b.name} marker</span>
                </button>
                <div
                  id={labelId}
                  className={`rounded bg-black/80 px-2 py-0.5 text-[11px] font-medium text-white shadow ${
                    isActive
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
                  }`}
                >
                  {b.name}
                </div>
              </div>
            </Marker>
          );
        })}
      </Map>

      {mapLoaded && mapInstance && (
        <WindParticles
          points={gridData.points}
          hourIndex={hourIndex}
          mapRef={{ current: mapInstance } as React.RefObject<import('mapbox-gl').Map | null>}
          variable={variable}
        />
      )}

      <MapControls
        variable={variable}
        onVariableChange={setVariable}
        hourIndex={hourIndex}
        onHourIndexChange={setHourIndex}
        hours={gridData.hours}
        playing={playing}
        onPlayToggle={() => setPlaying((p) => !p)}
      />
    </div>
  );
}
