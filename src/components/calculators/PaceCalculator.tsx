import { useState } from 'react';
import { BookmarkPlus, Footprints, RotateCcw } from 'lucide-react';
import { SavedLogEntry, TerrainId } from '../../types/tactical';
import {
  TERRAIN_PROFILES,
  calculatePaceAndTravel,
  formatDurationMinutes,
} from '../../utils/tacticalMath';

interface PaceCalculatorProps {
  onSaveLog: (entry: Omit<SavedLogEntry, 'id' | 'timestamp'>) => void;
}

export function PaceCalculator({ onSaveLog }: PaceCalculatorProps) {
  const [distanceMeters, setDistanceMeters] = useState<number>(850);
  const [pacesPer100m, setPacesPer100m] = useState<number>(62);
  const [terrainId, setTerrainId] = useState<TerrainId>('woods');
  const [elevationGain, setElevationGain] = useState<number>(45);
  const [tapCount, setTapCount] = useState<number>(0);

  const result = calculatePaceAndTravel({
    distanceMeters,
    pacesPer100m,
    terrainId,
    elevationGainMeters: elevationGain,
  });

  // Elevation profile SVG coordinates
  const svgW = 540;
  const svgH = 220;
  const padL = 48;
  const padR = 28;
  const padT = 28;
  const padB = 38;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const maxVisualGain = 250;
  const riseRatio = Math.min(1, elevationGain / maxVisualGain);
  const startY = padT + plotH;
  const endY = startY - riseRatio * (plotH - 16);
  const midX1 = padL + plotW * 0.38;
  const midY1 = startY - riseRatio * (plotH - 16) * 0.25;
  const midX2 = padL + plotW * 0.72;
  const midY2 = startY - riseRatio * (plotH - 16) * 0.78;

  const pathData = `M ${padL} ${startY} C ${midX1} ${midY1}, ${midX2} ${midY2}, ${padL + plotW} ${endY}`;
  const areaData = `${pathData} L ${padL + plotW} ${startY} L ${padL} ${startY} Z`;

  // 100m pace tick marks along the baseline
  const hundredMeterSegments = Math.min(20, Math.floor(distanceMeters / 100));

  const handleReset = () => {
    setDistanceMeters(850);
    setPacesPer100m(62);
    setTerrainId('woods');
    setElevationGain(45);
    setTapCount(0);
  };

  const handleSave = () => {
    onSaveLog({
      calculator: 'pace',
      label: `Leg ${distanceMeters} m (${result.terrain.label.split(' ')[0]})`,
      summary: `${result.totalDoublePaces} double-paces · +${elevationGain} m climb · ${formatDurationMinutes(result.totalMinutes)}`,
      primaryMetric: `${result.totalDoublePaces} paces`,
      distanceMeters,
      estimatedMinutes: result.totalMinutes,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left Zone: Elevation & Pace Visual Stage */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Route Leg Profile & Pace Cadence
            </h2>
            <p className="text-xs text-slate-500">
              Each 100 m marker represents {result.effectivePacesPer100m} adjusted double-paces
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-600">
            Slope: {result.slopePercent}% grade
          </div>
        </div>

        <div className="py-2">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-auto select-none"
            role="img"
            aria-label={`Terrain profile over ${distanceMeters} meters with ${elevationGain} meters elevation gain`}
          >
            <defs>
              <linearGradient id="terrainFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D97706" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#D97706" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal reference grid */}
            {[0.25, 0.5, 0.75, 1].map((t) => {
              const y = startY - t * (plotH - 16);
              return (
                <line
                  key={t}
                  x1={padL}
                  y1={y}
                  x2={padL + plotW}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              );
            })}

            {/* Baseline */}
            <line
              x1={padL}
              y1={startY}
              x2={padL + plotW}
              y2={startY}
              stroke="#94A3B8"
              strokeWidth="1.5"
            />

            {/* Terrain Fill & Slope Line */}
            <path d={areaData} fill="url(#terrainFill)" />
            <path
              d={pathData}
              fill="none"
              stroke="#D97706"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* 100m Checkpoint Ticks */}
            {Array.from({ length: hundredMeterSegments + 1 }).map((_, idx) => {
              if (distanceMeters <= 0) return null;
              const ratio = Math.min(1, (idx * 100) / distanceMeters);
              const x = padL + ratio * plotW;
              return (
                <g key={idx}>
                  <line
                    x1={x}
                    y1={startY - 4}
                    x2={x}
                    y2={startY + 5}
                    stroke="#475569"
                    strokeWidth="1.25"
                  />
                  {idx % 2 === 0 && (
                    <text
                      x={x}
                      y={startY + 18}
                      textAnchor="middle"
                      className="fill-slate-500 text-[10px] font-mono"
                    >
                      {idx * 100}m
                    </text>
                  )}
                </g>
              );
            })}

            {/* Start & Objective Nodes */}
            <circle
              cx={padL}
              cy={startY}
              r="5"
              fill="#0F172A"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
            <text
              x={padL}
              y={startY - 12}
              textAnchor="start"
              className="fill-slate-700 text-[11px] font-mono font-medium"
            >
              Start (0 m)
            </text>

            <circle
              cx={padL + plotW}
              cy={endY}
              r="6"
              fill="#D97706"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            <text
              x={padL + plotW}
              y={endY - 12}
              textAnchor="end"
              className="fill-slate-900 text-[11px] font-mono font-semibold"
            >
              Checkpoint ({distanceMeters} m, +{elevationGain} m)
            </text>
          </svg>
        </div>

        {/* Beginner Pace Calibration Helper */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-800">
              Live 100 m Pace Calibration Counter
            </div>
            <p className="text-xs text-slate-600">
              Count every time your left foot lands over a measured 100 m course.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTapCount((c) => c + 1)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-slate-300 text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
            >
              <Footprints className="w-3.5 h-3.5 text-amber-600" />
              <span>Tap Left Foot ({tapCount})</span>
            </button>
            {tapCount >= 10 && (
              <button
                type="button"
                onClick={() => setPacesPer100m(tapCount)}
                className="px-3 py-2 text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 rounded-lg transition-colors whitespace-nowrap"
              >
                Use {tapCount}
              </button>
            )}
            {tapCount > 0 && (
              <button
                type="button"
                onClick={() => setTapCount(0)}
                className="px-2.5 py-2 text-xs text-slate-500 hover:text-slate-900"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Zone: Parameter Controls & Readouts */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6">
        <div className="space-y-4">
          {/* Distance Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="pace-distance"
                className="text-sm font-medium text-slate-700"
              >
                Leg Distance
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="pace-distance"
                  type="number"
                  min={50}
                  max={10000}
                  step={50}
                  value={distanceMeters}
                  onChange={(e) =>
                    setDistanceMeters(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="w-24 text-right bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
                <span className="text-xs font-mono text-slate-500">m</span>
              </div>
            </div>
            <input
              type="range"
              min={50}
              max={3000}
              step={25}
              value={Math.min(3000, distanceMeters)}
              onChange={(e) => setDistanceMeters(Number(e.target.value))}
              aria-label="Leg distance slider"
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* 100m Pace Count */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="pace-count"
                className="text-sm font-medium text-slate-700"
              >
                Your 100 m Pace Count
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="pace-count"
                  type="number"
                  min={35}
                  max={110}
                  step={1}
                  value={pacesPer100m}
                  onChange={(e) =>
                    setPacesPer100m(Math.max(20, Number(e.target.value) || 62))
                  }
                  className="w-20 text-right bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
                <span className="text-xs font-mono text-slate-500">paces</span>
              </div>
            </div>
            <input
              type="range"
              min={45}
              max={85}
              step={1}
              value={pacesPer100m}
              onChange={(e) => setPacesPer100m(Number(e.target.value))}
              aria-label="Pace count per 100 meters slider"
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* Terrain Selector */}
          <div>
            <label
              htmlFor="terrain-select"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Terrain & Visibility
            </label>
            <select
              id="terrain-select"
              value={terrainId}
              onChange={(e) => setTerrainId(e.target.value as TerrainId)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
            >
              {TERRAIN_PROFILES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} ({t.paceMultiplier.toFixed(2)}× paces · {t.baseSpeedKmh} km/h)
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">{result.terrain.note}</p>
          </div>

          {/* Elevation Gain */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="elevation-gain"
                className="text-sm font-medium text-slate-700"
              >
                Total Elevation Climb
              </label>
              <span className="text-xs font-mono tabular-nums text-slate-600">
                +{elevationGain} m
              </span>
            </div>
            <input
              id="elevation-gain"
              type="range"
              min={0}
              max={400}
              step={5}
              value={elevationGain}
              onChange={(e) => setElevationGain(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* Primary Readout Panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Required Double-Paces
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-3xl font-mono font-semibold tabular-nums text-slate-900">
                    {result.totalDoublePaces}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    ({result.totalSingleSteps} steps)
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-500">
                  Estimated Travel Time
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-3xl font-mono font-semibold tabular-nums text-amber-700">
                    {formatDurationMinutes(result.totalMinutes)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/80 space-y-1 text-xs font-mono tabular-nums text-slate-600">
              <div>
                Paces: ({distanceMeters} m ÷ 100) × {pacesPer100m} ×{' '}
                {result.terrain.paceMultiplier.toFixed(2)} = {result.totalDoublePaces}
              </div>
              <div>
                Naismith Time: {result.horizontalMinutes} min flat + {result.climbMinutes}{' '}
                min climb
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Save to Log</span>
          </button>
        </div>
      </div>
    </div>
  );
}
