import { useRef, useState } from 'react';
import { BookmarkPlus, RotateCcw } from 'lucide-react';
import {
  AzimuthDirectionMode,
  DeclinationHemisphere,
  SavedLogEntry,
} from '../../types/tactical';
import {
  calculateAzimuthResult,
  formatBearing,
  normalizeDegrees,
} from '../../utils/tacticalMath';

interface AzimuthCalculatorProps {
  onSaveLog: (entry: Omit<SavedLogEntry, 'id' | 'timestamp'>) => void;
}

export function AzimuthCalculator({ onSaveLog }: AzimuthCalculatorProps) {
  const [mode, setMode] = useState<AzimuthDirectionMode>('gridToMagnetic');
  const [inputAzimuth, setInputAzimuth] = useState<number>(65);
  const [declination, setDeclination] = useState<number>(12);
  const [hemisphere, setHemisphere] = useState<DeclinationHemisphere>('E');
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const result = calculateAzimuthResult({
    inputAzimuth,
    declinationDegrees: declination,
    declinationHemisphere: hemisphere,
    mode,
  });

  const updateAngleFromPointer = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    // Clockwise from North (up = -Y)
    const rad = Math.atan2(dx, -dy);
    const deg = normalizeDegrees((rad * 180) / Math.PI);
    setInputAzimuth(Math.round(deg));
  };

  const cx = 200;
  const cy = 200;
  const outerR = 152;
  const innerR = 118;

  const degToPoint = (deg: number, radius: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  const magNorthAngle = hemisphere === 'E' ? declination : -declination;
  const targetRayAngle = result.gridAzimuth;
  const backRayAngle = result.backAzimuthGrid;

  const targetTip = degToPoint(targetRayAngle, outerR - 14);
  const backTip = degToPoint(backRayAngle, innerR - 6);
  const magNorthTip = degToPoint(magNorthAngle, outerR + 10);

  const handleReset = () => {
    setMode('gridToMagnetic');
    setInputAzimuth(65);
    setDeclination(12);
    setHemisphere('E');
  };

  const handleSave = () => {
    onSaveLog({
      calculator: 'azimuth',
      label:
        mode === 'gridToMagnetic'
          ? `Grid ${formatBearing(result.gridAzimuth)} → Mag`
          : `Mag ${formatBearing(result.magneticAzimuth)} → Grid`,
      summary: `${declination}°${hemisphere} decl · Back ${formatBearing(result.backAzimuth)} · ${result.outputMils} mils`,
      primaryMetric: formatBearing(result.outputAzimuth),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left Zone: Interactive Compass Rose Stage */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Interactive Compass Rose
            </h2>
            <p className="text-xs text-slate-500">
              Click or drag anywhere on the dial to set your bearing
            </p>
          </div>
          <div className="text-xs font-mono text-slate-600 tabular-nums">
            G-M Angle: {declination.toFixed(1)}° {hemisphere}
          </div>
        </div>

        <div className="py-4 flex items-center justify-center">
          <svg
            ref={svgRef}
            viewBox="0 0 400 400"
            className="w-full max-w-[380px] h-auto cursor-crosshair select-none touch-none"
            role="img"
            aria-label={`Compass rose showing Grid Azimuth ${result.gridAzimuth} degrees and Magnetic Azimuth ${result.magneticAzimuth} degrees`}
            onPointerDown={(e) => {
              setIsDragging(true);
              e.currentTarget.setPointerCapture(e.pointerId);
              updateAngleFromPointer(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (isDragging) updateAngleFromPointer(e.clientX, e.clientY);
            }}
            onPointerUp={() => setIsDragging(false)}
            onPointerCancel={() => setIsDragging(false)}
          >
            {/* Outer dial ring */}
            <circle
              cx={cx}
              cy={cy}
              r={outerR}
              fill="#F8FAFC"
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />
            <circle
              cx={cx}
              cy={cy}
              r={innerR}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="1"
              strokeDasharray="3 3"
            />

            {/* Degree ticks every 10 deg */}
            {Array.from({ length: 36 }).map((_, idx) => {
              const deg = idx * 10;
              const isMajor = deg % 30 === 0;
              const p1 = degToPoint(deg, outerR);
              const p2 = degToPoint(deg, isMajor ? outerR - 12 : outerR - 6);
              return (
                <g key={deg}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={isMajor ? '#475569' : '#94A3B8'}
                    strokeWidth={isMajor ? '1.5' : '1'}
                  />
                  {isMajor && deg !== 0 && deg !== 90 && deg !== 180 && deg !== 270 && (
                    <text
                      x={degToPoint(deg, outerR - 23).x}
                      y={degToPoint(deg, outerR - 23).y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="fill-slate-500 text-[10px] font-mono"
                    >
                      {deg}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Cardinal labels */}
            <text
              x={cx}
              y={cy - outerR - 16}
              textAnchor="middle"
              className="fill-slate-900 text-xs font-semibold font-mono"
            >
              GN 000°
            </text>
            <text
              x={cx + outerR + 18}
              y={cy + 4}
              textAnchor="middle"
              className="fill-slate-600 text-xs font-semibold font-mono"
            >
              E
            </text>
            <text
              x={cx}
              y={cy + outerR + 20}
              textAnchor="middle"
              className="fill-slate-600 text-xs font-semibold font-mono"
            >
              S
            </text>
            <text
              x={cx - outerR - 18}
              y={cy + 4}
              textAnchor="middle"
              className="fill-slate-600 text-xs font-semibold font-mono"
            >
              W
            </text>

            {/* Grid North Axis */}
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - outerR}
              stroke="#64748B"
              strokeWidth="1.5"
            />

            {/* Magnetic North Reference Line */}
            {declination > 0 && (
              <g>
                <line
                  x1={cx}
                  y1={cy}
                  x2={magNorthTip.x}
                  y2={magNorthTip.y}
                  stroke="#0284C7"
                  strokeWidth="1.75"
                  strokeDasharray="4 3"
                />
                <circle cx={magNorthTip.x} cy={magNorthTip.y} r="3.5" fill="#0284C7" />
                <text
                  x={degToPoint(magNorthAngle, outerR + 25).x}
                  y={degToPoint(magNorthAngle, outerR + 25).y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-sky-700 text-[10px] font-mono font-semibold"
                >
                  MN
                </text>
              </g>
            )}

            {/* Back Azimuth Line */}
            <line
              x1={cx}
              y1={cy}
              x2={backTip.x}
              y2={backTip.y}
              stroke="#64748B"
              strokeWidth="2"
              strokeDasharray="5 4"
            />
            <circle cx={backTip.x} cy={backTip.y} r="4" fill="#64748B" />

            {/* Forward Target Bearing Ray */}
            <line
              x1={cx}
              y1={cy}
              x2={targetTip.x}
              y2={targetTip.y}
              stroke="#D97706"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx={targetTip.x}
              cy={targetTip.y}
              r="7"
              fill="#D97706"
              stroke="#FFFFFF"
              strokeWidth="2"
            />

            {/* Center hub */}
            <circle
              cx={cx}
              cy={cy}
              r="5"
              fill="#0F172A"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Diagram Legend */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-5">
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-0.5 bg-amber-600 inline-block" />
              Forward Bearing (Grid {formatBearing(result.gridAzimuth)})
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-500 inline-block" />
              Back Azimuth ({formatBearing(result.backAzimuth)})
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-sky-600 inline-block" />
              Magnetic North ({declination}°{hemisphere})
            </span>
          </div>
        </div>
      </div>

      {/* Right Zone: Controls & Readouts */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6">
        <div className="space-y-5">
          {/* Mode Switcher */}
          <div>
            <span className="block text-xs font-medium text-slate-500 mb-2">
              Conversion Direction
            </span>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setMode('gridToMagnetic')}
                className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  mode === 'gridToMagnetic'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Map (Grid) → Compass
              </button>
              <button
                type="button"
                onClick={() => setMode('magneticToGrid')}
                className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  mode === 'magneticToGrid'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Compass → Map (Grid)
              </button>
            </div>
          </div>

          {/* Input Azimuth Slider + Number */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="azimuth-input"
                className="text-sm font-medium text-slate-700"
              >
                {mode === 'gridToMagnetic'
                  ? 'Map Grid Azimuth'
                  : 'Compass Magnetic Azimuth'}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="azimuth-input"
                  type="number"
                  min={0}
                  max={359.9}
                  step={1}
                  value={inputAzimuth}
                  onChange={(e) =>
                    setInputAzimuth(
                      normalizeDegrees(Number.parseFloat(e.target.value) || 0),
                    )
                  }
                  className="w-20 text-right bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
                <span className="text-xs font-mono text-slate-500">deg</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={359}
              step={1}
              value={Math.round(inputAzimuth)}
              onChange={(e) => setInputAzimuth(Number(e.target.value))}
              aria-label="Input azimuth slider"
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* Declination Angle + Hemisphere */}
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-7">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="declination-input"
                  className="text-sm font-medium text-slate-700"
                >
                  Magnetic Declination
                </label>
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  {declination.toFixed(1)}°
                </span>
              </div>
              <input
                id="declination-input"
                type="range"
                min={0}
                max={30}
                step={0.5}
                value={declination}
                onChange={(e) => setDeclination(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div className="col-span-5">
              <span className="block text-xs font-medium text-slate-500 mb-1.5">
                Direction
              </span>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setHemisphere('E')}
                  className={`py-1.5 text-xs font-mono font-medium rounded-md transition-colors ${
                    hemisphere === 'E'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  East
                </button>
                <button
                  type="button"
                  onClick={() => setHemisphere('W')}
                  className={`py-1.5 text-xs font-mono font-medium rounded-md transition-colors ${
                    hemisphere === 'W'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  West
                </button>
              </div>
            </div>
          </div>

          {/* Primary Readout Panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  {mode === 'gridToMagnetic'
                    ? 'Dial Compass (Magnetic)'
                    : 'Plot on Map (Grid)'}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-3xl font-mono font-semibold tabular-nums text-slate-900">
                    {formatBearing(result.outputAzimuth)}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    ({result.outputMils} mils)
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-500">
                  Return Back Azimuth
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-3xl font-mono font-semibold tabular-nums text-amber-700">
                    {formatBearing(result.backAzimuth)}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    ({result.backAzimuthMils} mils)
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/80 space-y-1">
              <div className="text-xs font-medium text-slate-700">{result.ruleLabel}</div>
              <div className="text-xs font-mono tabular-nums text-slate-600">
                {result.formulaStep}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
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
