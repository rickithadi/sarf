'use client';

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

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/70 backdrop-blur-sm border-t border-white/10 p-3 space-y-2">
      {/* Variable toggles */}
      <div className="flex items-center gap-2">
        {(Object.keys(variableLabels) as MapVariable[]).map((v) => (
          <button
            key={v}
            onClick={() => onVariableChange(v)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
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
          onClick={onPlayToggle}
          className="text-white bg-white/10 hover:bg-white/20 rounded px-2 py-1 text-sm"
        >
          {playing ? '⏸' : '▶'}
        </button>

        <input
          type="range"
          min={0}
          max={hours.length - 1}
          value={hourIndex}
          onChange={(e) => onHourIndexChange(Number(e.target.value))}
          className="flex-1 accent-white h-1"
        />

        <span className="text-white/70 text-xs whitespace-nowrap min-w-[120px] text-right">
          {currentTime ? format(currentTime, 'EEE d MMM, ha') : ''}
        </span>
      </div>
    </div>
  );
}
