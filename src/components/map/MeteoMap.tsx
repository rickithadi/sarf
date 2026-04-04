'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate initial viewport from bounds
  const centerLat = (initialBounds.sw[0] + initialBounds.ne[0]) / 2;
  const centerLng = (initialBounds.sw[1] + initialBounds.ne[1]) / 2;

  // Build GeoJSON for current hour
  const geojson = {
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
        0,   'rgba(10,0,128,0)',
        0.1, 'rgb(10,0,128)',
        0.2, 'rgb(0,100,255)',
        0.35,'rgb(0,220,180)',
        0.5, 'rgb(0,255,80)',
        0.65,'rgb(200,255,0)',
        0.75,'rgb(255,220,0)',
        0.85,'rgb(255,140,0)',
        1,   'rgb(255,40,0)',
      ],
    },
  };

  // Auto-play
  const advance = useCallback(() => {
    setHourIndex((i) => (i + 1) % gridData.hours.length);
  }, [gridData.hours.length]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(advance, 280);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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

        {breaks.map((b) => (
          <Marker key={b.id} longitude={b.lng} latitude={b.lat} anchor="center">
            <div className="relative group cursor-pointer">
              <div className="w-3 h-3 rounded-full bg-white border-2 border-black shadow-lg" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black/80 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
                {b.name}
              </div>
            </div>
          </Marker>
        ))}
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
