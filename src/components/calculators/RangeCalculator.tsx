import { useState } from 'react';
import { BookmarkPlus, RotateCcw } from 'lucide-react';
import { RangeSolveTarget, SavedLogEntry } from '../../types/tactical';
import { TARGET_PRESETS, calculateMilRange } from '../../utils/tacticalMath';

interface RangeCalculatorProps {
  onSaveLog: (entry: Omit<SavedLogEntry, 'id' | 'timestamp'>) => void;
}

export function RangeCalculator({ onSaveLog }: RangeCalculatorProps) {
  const [solveFor, setSolveFor] = useState<RangeSolveTarget>('distance');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('person-height');
  const [targetSizeMeters, setTargetSizeMeters] = useState<number>(1.75);
  const [apparentMils, setApparentMils] = useState<number>(4.5);
  const [distanceMeters, setDistanceMeters] = useState<number>(400);

  const result = calculateMilRange({
    solveFor,
    targetSizeMeters,
    apparentMils,
    distanceMeters,
  });

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = TARGET_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setTargetSizeMeters(preset.sizeMeters);
    }
  };

  // Reticle viewport geometry: center (220, 145), 1 mil = 18px (displays ±10 mils horizontal)
  const cx = 220;
  const cy = 145;
  const pxPerMil = 18;
  const visualMils = Math.min(11, Math.max(0.5, result.apparentMils));
  const visualSizePx = visualMils * pxPerMil;

  const isHorizontalObject =
    selectedPresetId === 'sedan' ||
    selectedPresetId === 'container' ||
    selectedPresetId === 'person-width' ||
    selectedPresetId === 'doorway';

  const handleReset = () => {
    setSolveFor('distance');
    setSelectedPresetId('person-height');
    setTargetSizeMeters(1.75);
    setApparentMils(4.5);
    setDistanceMeters(400);
  };

  const handleSave = () => {
    onSaveLog({
      calculator: 'range',
      label: `Mil-Range (${result.targetSizeMeters} m @ ${result.apparentMils} mils)`,
      summary: result.formulaText,
      primaryMetric: `${result.distanceMeters} m`,
      distanceMeters: result.distanceMeters,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left Zone: Interactive Mil-Dot Reticle Viewport */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Mil-Reticle Sight Preview
            </h2>
            <p className="text-xs text-slate-500">
              Major ticks mark 1.0 mil intervals · 1 mil = 1 m wide at 1,000 m
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-600">
            Apparent Span: {result.apparentMils.toFixed(1)} mils
          </div>
        </div>

        <div className="py-2 flex items-center justify-center">
          <svg
            viewBox="0 0 440 290"
            className="w-full max-w-[460px] h-auto select-none"
            role="img"
            aria-label={`Binocular mil reticle showing target spanning ${result.apparentMils} mils at ${result.distanceMeters} meters`}
          >
            {/* Scope Field Background */}
            <rect
              x="12"
              y="12"
              width="416"
              height="266"
              rx="18"
              fill="#0F172A"
              stroke="#334155"
              strokeWidth="2"
            />

            {/* Subtle horizon line */}
            <line
              x1="14"
              y1={cy + 36}
              x2="426"
              y2={cy + 36}
              stroke="#1E293B"
              strokeWidth="1"
            />

            {/* Target Silhouette scaled to apparentMils */}
            {isHorizontalObject ? (
              <g>
                <rect
                  x={cx - visualSizePx / 2}
                  y={cy - Math.max(12, visualSizePx * 0.36) / 2}
                  width={visualSizePx}
                  height={Math.max(12, visualSizePx * 0.36)}
                  rx="3"
                  fill="#D97706"
                  fillOpacity="0.32"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                />
                {/* Span Bracket */}
                <line
                  x1={cx - visualSizePx / 2}
                  y1={cy + Math.max(12, visualSizePx * 0.36) / 2 + 12}
                  x2={cx + visualSizePx / 2}
                  y2={cy + Math.max(12, visualSizePx * 0.36) / 2 + 12}
                  stroke="#FBBF24"
                  strokeWidth="1.25"
                />
              </g>
            ) : (
              <g>
                <rect
                  x={cx - Math.max(8, visualSizePx * 0.28) / 2}
                  y={cy - visualSizePx / 2}
                  width={Math.max(8, visualSizePx * 0.28)}
                  height={visualSizePx}
                  rx="3"
                  fill="#D97706"
                  fillOpacity="0.32"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                />
                {/* Vertical Span Bracket */}
                <line
                  x1={cx + Math.max(8, visualSizePx * 0.28) / 2 + 12}
                  y1={cy - visualSizePx / 2}
                  x2={cx + Math.max(8, visualSizePx * 0.28) / 2 + 12}
                  y2={cy + visualSizePx / 2}
                  stroke="#FBBF24"
                  strokeWidth="1.25"
                />
              </g>
            )}

            {/* Reticle Main Crosshair Axes */}
            <line
              x1="28"
              y1={cy}
              x2="412"
              y2={cy}
              stroke="#E2E8F0"
              strokeOpacity="0.7"
              strokeWidth="1"
            />
            <line
              x1={cx}
              y1="26"
              x2={cx}
              y2="264"
              stroke="#E2E8F0"
              strokeOpacity="0.7"
              strokeWidth="1"
            />

            {/* Horizontal Mil Ticks (-10 to +10) */}
            {Array.from({ length: 21 }).map((_, idx) => {
              const mil = idx - 10;
              if (mil === 0) return null;
              const x = cx + mil * pxPerMil;
              const isMajor = mil % 5 === 0;
              return (
                <g key={`h-${mil}`}>
                  <line
                    x1={x}
                    y1={cy - (isMajor ? 8 : 4)}
                    x2={x}
                    y2={cy + (isMajor ? 8 : 4)}
                    stroke="#F8FAFC"
                    strokeOpacity="0.85"
                    strokeWidth={isMajor ? '1.5' : '1'}
                  />
                  {isMajor && (
                    <text
                      x={x}
                      y={cy + 20}
                      textAnchor="middle"
                      className="fill-slate-300 text-[9px] font-mono"
                    >
                      {Math.abs(mil)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Vertical Mil Ticks (-6 to +6) */}
            {Array.from({ length: 13 }).map((_, idx) => {
              const mil = idx - 6;
              if (mil === 0) return null;
              const y = cy + mil * pxPerMil;
              const isMajor = mil % 5 === 0;
              return (
                <g key={`v-${mil}`}>
                  <line
                    x1={cx - (isMajor ? 8 : 4)}
                    y1={y}
                    x2={cx + (isMajor ? 8 : 4)}
                    y2={y}
                    stroke="#F8FAFC"
                    strokeOpacity="0.85"
                    strokeWidth={isMajor ? '1.5' : '1'}
                  />
                  {isMajor && (
                    <text
                      x={cx - 14}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-slate-300 text-[9px] font-mono"
                    >
                      {Math.abs(mil)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Reticle HUD Labels */}
            <text
              x="28"
              y="34"
              className="fill-slate-300 text-[10px] font-mono"
            >
              SIZE: {result.targetSizeMeters.toFixed(2)} m
            </text>
            <text
              x="412"
              y="34"
              textAnchor="end"
              className="fill-amber-400 text-[10px] font-mono font-semibold"
            >
              RANGE: {result.distanceMeters} m
            </text>
          </svg>
        </div>

        {/* Common Reference Presets */}
        <div>
          <span className="block text-xs font-medium text-slate-500 mb-2">
            Beginner Reference Target Sizes (click to fill)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TARGET_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                  selectedPresetId === preset.id
                    ? 'bg-amber-50 border-amber-400 text-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="font-medium truncate">{preset.label}</div>
                <div className="font-mono text-slate-500 tabular-nums">
                  {preset.sizeMeters.toFixed(2)} m
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Zone: Controls & Readouts */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6">
        <div className="space-y-5">
          {/* Solve For Segmented Toggle */}
          <div>
            <span className="block text-xs font-medium text-slate-500 mb-2">
              Solve For
            </span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setSolveFor('distance')}
                className={`px-2 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  solveFor === 'distance'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Range (m)
              </button>
              <button
                type="button"
                onClick={() => setSolveFor('size')}
                className={`px-2 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  solveFor === 'size'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Target Size
              </button>
              <button
                type="button"
                onClick={() => setSolveFor('mils')}
                className={`px-2 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  solveFor === 'mils'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Apparent Mils
              </button>
            </div>
          </div>

          {/* Target Size Control (unless solving for size) */}
          {solveFor !== 'size' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="target-size-input"
                  className="text-sm font-medium text-slate-700"
                >
                  Known Target Size
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="target-size-input"
                    type="number"
                    min={0.1}
                    max={50}
                    step={0.05}
                    value={targetSizeMeters}
                    onChange={(e) => {
                      setSelectedPresetId('custom');
                      setTargetSizeMeters(
                        Math.max(0.05, Number.parseFloat(e.target.value) || 0.1),
                      );
                    }}
                    className="w-20 text-right bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                  <span className="text-xs font-mono text-slate-500">m</span>
                </div>
              </div>
              <input
                type="range"
                min={0.3}
                max={12}
                step={0.05}
                value={Math.min(12, targetSizeMeters)}
                onChange={(e) => {
                  setSelectedPresetId('custom');
                  setTargetSizeMeters(Number(e.target.value));
                }}
                aria-label="Target size slider"
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          )}

          {/* Apparent Mils Control (unless solving for mils) */}
          {solveFor !== 'mils' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="apparent-mils-input"
                  className="text-sm font-medium text-slate-700"
                >
                  Measured Reticle Span
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="apparent-mils-input"
                    type="number"
                    min={0.2}
                    max={30}
                    step={0.1}
                    value={apparentMils}
                    onChange={(e) =>
                      setApparentMils(
                        Math.max(0.2, Number.parseFloat(e.target.value) || 0.5),
                      )
                    }
                    className="w-20 text-right bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                  <span className="text-xs font-mono text-slate-500">mils</span>
                </div>
              </div>
              <input
                type="range"
                min={0.5}
                max={15}
                step={0.1}
                value={Math.min(15, apparentMils)}
                onChange={(e) => setApparentMils(Number(e.target.value))}
                aria-label="Measured reticle span slider"
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          )}

          {/* Distance Control (when solving for size or mils) */}
          {solveFor !== 'distance' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="known-distance-input"
                  className="text-sm font-medium text-slate-700"
                >
                  Known Range to Target
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="known-distance-input"
                    type="number"
                    min={25}
                    max={3000}
                    step={25}
                    value={distanceMeters}
                    onChange={(e) =>
                      setDistanceMeters(
                        Math.max(10, Number.parseFloat(e.target.value) || 100),
                      )
                    }
                    className="w-24 text-right bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                  <span className="text-xs font-mono text-slate-500">m</span>
                </div>
              </div>
              <input
                type="range"
                min={50}
                max={1500}
                step={25}
                value={Math.min(1500, distanceMeters)}
                onChange={(e) => setDistanceMeters(Number(e.target.value))}
                aria-label="Known range slider"
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          )}

          {/* Primary Readout Panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <div>
              <div className="text-xs font-medium text-slate-500">
                {solveFor === 'distance'
                  ? 'Estimated Range to Target'
                  : solveFor === 'size'
                    ? 'Estimated Target Size'
                    : 'Expected Reticle Reading'}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-mono font-semibold tabular-nums text-slate-900">
                  {solveFor === 'distance'
                    ? `${result.distanceMeters}`
                    : solveFor === 'size'
                      ? `${result.targetSizeMeters.toFixed(2)}`
                      : `${result.apparentMils.toFixed(1)}`}
                </span>
                <span className="text-sm font-mono text-slate-500">
                  {solveFor === 'distance'
                    ? 'meters'
                    : solveFor === 'size'
                      ? 'meters'
                      : 'mils'}
                </span>
              </div>
              {solveFor === 'distance' && (
                <div className="mt-1 text-xs font-mono tabular-nums text-slate-500">
                  ≈ {Math.round(result.distanceMeters * 1.0936)} yards
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200/80 space-y-1">
              <div className="text-xs font-medium text-slate-700">
                WORM Formula: (Width × 1000) ÷ Mils = Range
              </div>
              <div className="text-xs font-mono tabular-nums text-slate-600">
                {result.formulaText}
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
