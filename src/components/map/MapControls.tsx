'use client';

import { useId } from 'react';
import { MapVariable, variableLabels } from './colorScale';
import { format } from 'date-fns';

interface MapControlsProps {
  variable: MapVariable;
  onVariableChange: (v: MapVariable) => void;
  hourIndex: number;
  onHourIndexChange: (i: number) => void;
  hours: string[];
  playing: boolean;
  onPlayToggle: () => void;
}

export function MapControls({
  variable,
  onVariableChange,
  hourIndex,
  onHourIndexChange,
  hours,
  playing,
  onPlayToggle,
}: MapControlsProps) {
  const currentTime = hours[hourIndex] ? new Date(hours[hourIndex]) : null;
  const sliderLabelId = useId();

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/70 backdrop-blur-sm border-t border-white/10 p-3 space-y-2">
      {/* Variable toggles */}
      <div className="flex items-center gap-2" role="group" aria-label="Map data layer">
        {(Object.keys(variableLabels) as MapVariable[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onVariableChange(v)}
            aria-pressed={variable === v}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              variable === v
                ? 'bg-white text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {variableLabels[v]}
          </button>
        ))}
      </div>

      {/* Time scrubber */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPlayToggle}
          aria-label={playing ? 'Pause animation' : 'Play animation'}
          className="text-white bg-white/10 hover:bg-white/20 rounded px-3 py-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span aria-hidden="true">{playing ? '⏸' : '▶'}</span>
          <span className="sr-only">{playing ? 'Pause' : 'Play'}</span>
        </button>

        <input
          type="range"
          min={0}
          max={hours.length - 1}
          value={hourIndex}
          onChange={(e) => onHourIndexChange(Number(e.target.value))}
          className="flex-1 accent-white h-1"
          aria-labelledby={sliderLabelId}
          aria-valuemin={0}
          aria-valuemax={Math.max(hours.length - 1, 0)}
          aria-valuenow={hourIndex}
          aria-valuetext={currentTime ? format(currentTime, 'EEE d MMM, haaaa') : 'Forecast hour unavailable'}
        />

        <span id={sliderLabelId} className="text-white/70 text-xs whitespace-nowrap min-w-[120px] text-right">
          {currentTime ? format(currentTime, 'EEE d MMM, ha') : '—'}
        </span>
      </div>
    </div>
  );
}
