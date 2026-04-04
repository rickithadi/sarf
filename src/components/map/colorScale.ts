export type MapVariable = 'waveHeight' | 'windSpeed' | 'wavePeriod';

interface ColorStop {
  value: number;
  r: number;
  g: number;
  b: number;
}

const WAVE_HEIGHT_STOPS: ColorStop[] = [
  { value: 0,   r: 10,  g: 0,   b: 128 },
  { value: 0.5, r: 0,   g: 100, b: 255 },
  { value: 1.0, r: 0,   g: 220, b: 180 },
  { value: 1.5, r: 0,   g: 255, b: 80  },
  { value: 2.0, r: 200, g: 255, b: 0   },
  { value: 2.5, r: 255, g: 220, b: 0   },
  { value: 3.0, r: 255, g: 140, b: 0   },
  { value: 4.0, r: 255, g: 40,  b: 0   },
  { value: 6.0, r: 180, g: 0,   b: 0   },
];

const WIND_SPEED_STOPS: ColorStop[] = [
  { value: 0,  r: 10,  g: 0,   b: 128 },
  { value: 10, r: 0,   g: 100, b: 255 },
  { value: 20, r: 0,   g: 230, b: 130 },
  { value: 30, r: 200, g: 255, b: 0   },
  { value: 40, r: 255, g: 180, b: 0   },
  { value: 55, r: 255, g: 60,  b: 0   },
  { value: 70, r: 180, g: 0,   b: 0   },
];

const WAVE_PERIOD_STOPS: ColorStop[] = [
  { value: 0,  r: 10,  g: 0,   b: 128 },
  { value: 4,  r: 0,   g: 80,  b: 200 },
  { value: 8,  r: 0,   g: 200, b: 160 },
  { value: 12, r: 0,   g: 255, b: 80  },
  { value: 16, r: 180, g: 255, b: 0   },
  { value: 20, r: 255, g: 200, b: 0   },
];

function interpolateColor(stops: ColorStop[], value: number): [number, number, number] {
  if (value <= stops[0].value) return [stops[0].r, stops[0].g, stops[0].b];
  if (value >= stops[stops.length - 1].value) {
    const last = stops[stops.length - 1];
    return [last.r, last.g, last.b];
  }

  for (let i = 0; i < stops.length - 1; i++) {
    if (value >= stops[i].value && value <= stops[i + 1].value) {
      const t = (value - stops[i].value) / (stops[i + 1].value - stops[i].value);
      return [
        Math.round(stops[i].r + t * (stops[i + 1].r - stops[i].r)),
        Math.round(stops[i].g + t * (stops[i + 1].g - stops[i].g)),
        Math.round(stops[i].b + t * (stops[i + 1].b - stops[i].b)),
      ];
    }
  }

  return [0, 0, 0];
}

export function valueToRgb(value: number | null, variable: MapVariable): [number, number, number] {
  if (value === null) return [0, 0, 0];
  const stops =
    variable === 'waveHeight'
      ? WAVE_HEIGHT_STOPS
      : variable === 'windSpeed'
      ? WIND_SPEED_STOPS
      : WAVE_PERIOD_STOPS;
  return interpolateColor(stops, value);
}

export function valueToHex(value: number | null, variable: MapVariable): string {
  const [r, g, b] = valueToRgb(value, variable);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Returns Mapbox expression for heatmap-color property
export function mapboxColorExpression(variable: MapVariable) {
  const stops =
    variable === 'waveHeight'
      ? WAVE_HEIGHT_STOPS
      : variable === 'windSpeed'
      ? WIND_SPEED_STOPS
      : WAVE_PERIOD_STOPS;

  const expr: unknown[] = ['interpolate', ['linear'], ['heatmap-density']];
  stops.forEach((stop, i) => {
    const t = i / (stops.length - 1);
    expr.push(t, `rgb(${stop.r},${stop.g},${stop.b})`);
  });
  return expr;
}

export const variableLabels: Record<MapVariable, string> = {
  waveHeight: 'Wave Height',
  windSpeed: 'Wind Speed',
  wavePeriod: 'Wave Period',
};

export const variableUnits: Record<MapVariable, string> = {
  waveHeight: 'm',
  windSpeed: 'km/h',
  wavePeriod: 's',
};

export const variableMaxValues: Record<MapVariable, number> = {
  waveHeight: 6,
  windSpeed: 70,
  wavePeriod: 20,
};
