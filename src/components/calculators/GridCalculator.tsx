import { useRef, useState } from 'react';
import { BookmarkPlus, RotateCcw } from 'lucide-react';
import { GridPrecision, SavedLogEntry } from '../../types/tactical';
import { calculateGridVector, formatBearing } from '../../utils/tacticalMath';

interface GridCalculatorProps {
  onSaveLog: (entry: Omit<SavedLogEntry, 'id' | 'timestamp'>) => void;
}

export function GridCalculator({ onSaveLog }: GridCalculatorProps) {
  const [precision, setPrecision] = useState<GridPrecision>(6);
  const [startEasting, setStartEasting] = useState<number>(240);
  const [startNorthing, setStartNorthing] = useState<number>(310);
  const [targetEasting, setTargetEasting] = useState<number>(680);
  const [targetNorthing, setTargetNorthing] = useState<number>(740);
  const [activePin, setActivePin] = useState<'start' | 'target'>('target');
  const svgRef = useRef<SVGSVGElement | null>(null);

  const result = calculateGridVector({
    precision,
    startEasting,
    startNorthing,
    targetEasting,
    targetNorthing,
  });

  const handlePrecisionChange = (next: GridPrecision) => {
    if (next === precision) return;
    if (next === 8) {
      setStartEasting((v) => Math.min(9999, v * 10));
      setStartNorthing((v) => Math.min(9999, v * 10));
      setTargetEasting((v) => Math.min(9999, v * 10));
      setTargetNorthing((v) => Math.min(9999, v * 10));
    } else {
      setStartEasting((v) => Math.round(v / 10));
      setStartNorthing((v) => Math.round(v / 10));
      setTargetEasting((v) => Math.round(v / 10));
      setTargetNorthing((v) => Math.round(v / 10));
    }
    setPrecision(next);
  };

  // Grid geometry inside SVG: 40..360 on both axes (320px = 10km sector)
  const pad = 44;
  const gridSize = 312;
  const maxCoord = precision === 8 ? 10000 : 1000;

  const toSvgX = (easting: number) => pad + (easting / maxCoord) * gridSize;
  const toSvgY = (northing: number) => pad + gridSize - (northing / maxCoord) * gridSize;

  const handleGridClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const viewX = ((e.clientX - rect.left) / rect.width) * 400;
    const viewY = ((e.clientY - rect.top) / rect.height) * 400;

    const normX = Math.max(0, Math.min(1, (viewX - pad) / gridSize));
    const normY = Math.max(0, Math.min(1, (pad + gridSize - viewY) / gridSize));

    const maxVal = precision === 8 ? 9999 : 999;
    const newE = Math.min(maxVal, Math.round(normX * maxCoord));
    const newN = Math.min(maxVal, Math.round(normY * maxCoord));

    if (activePin === 'start') {
      setStartEasting(newE);
      setStartNorthing(newN);
    } else {
      setTargetEasting(newE);
      setTargetNorthing(newN);
    }
  };

  const sx = toSvgX(startEasting);
  const sy = toSvgY(startNorthing);
  const tx = toSvgX(targetEasting);
  const ty = toSvgY(targetNorthing);

  const handleReset = () => {
    setPrecision(6);
    setStartEasting(240);
    setStartNorthing(310);
    setTargetEasting(680);
    setTargetNorthing(740);
    setActivePin('target');
  };

  const handleSave = () => {
    onSaveLog({
      calculator: 'grid',
      label: `Grid ${result.startCode} → ${result.targetCode}`,
      summary: `Bearing ${formatBearing(result.bearingDeg)} (${result.bearingMils} mils) · ΔE ${result.deltaEastingMeters} m, ΔN ${result.deltaNorthingMeters} m`,
      primaryMetric: `${result.distanceMeters} m @ ${formatBearing(result.bearingDeg)}`,
      distanceMeters: result.distanceMeters,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left Zone: Clickable 10x10 Topographic Grid Square */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              10 km × 10 km Grid Sector Plotter
            </h2>
            <p className="text-xs text-slate-500">
              Click anywhere on the grid to place the active point ("Read right, then up")
            </p>
          </div>

          {/* Active Point Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActivePin('start')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activePin === 'start'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Place Point A
            </button>
            <button
              type="button"
              onClick={() => setActivePin('target')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activePin === 'target'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Place Point B
            </button>
          </div>
        </div>

        <div className="py-2 flex items-center justify-center">
          <svg
            ref={svgRef}
            viewBox="0 0 400 400"
            onClick={handleGridClick}
            className="w-full max-w-[380px] h-auto cursor-crosshair select-none"
            role="img"
            aria-label={`Grid map plotting leg from ${result.startCode} to ${result.targetCode}`}
          >
            {/* Sector Background */}
            <rect
              x={pad}
              y={pad}
              width={gridSize}
              height={gridSize}
              fill="#F8FAFC"
              stroke="#94A3B8"
              strokeWidth="1.5"
            />

            {/* 1km Grid Lines */}
            {Array.from({ length: 11 }).map((_, idx) => {
              const offset = (idx / 10) * gridSize;
              const isMajor = idx % 2 === 0;
              return (
                <g key={idx}>
                  {/* Vertical Easting Line */}
                  <line
                    x1={pad + offset}
                    y1={pad}
                    x2={pad + offset}
                    y2={pad + gridSize}
                    stroke={isMajor ? '#CBD5E1' : '#E2E8F0'}
                    strokeWidth="1"
                  />
                  {/* Horizontal Northing Line */}
                  <line
                    x1={pad}
                    y1={pad + gridSize - offset}
                    x2={pad + gridSize}
                    y2={pad + gridSize - offset}
                    stroke={isMajor ? '#CBD5E1' : '#E2E8F0'}
                    strokeWidth="1"
                  />
                  {idx < 10 && (
                    <>
                      <text
                        x={pad + offset + gridSize / 20}
                        y={pad + gridSize + 18}
                        textAnchor="middle"
                        className="fill-slate-500 text-[10px] font-mono"
                      >
                        {idx}
                      </text>
                      <text
                        x={pad - 14}
                        y={pad + gridSize - offset - gridSize / 20 + 3}
                        textAnchor="middle"
                        className="fill-slate-500 text-[10px] font-mono"
                      >
                        {idx}
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Axis captions */}
            <text
              x={pad + gridSize / 2}
              y={390}
              textAnchor="middle"
              className="fill-slate-600 text-[10px] font-medium"
            >
              Easting (Read Right →)
            </text>
            <text
              x={14}
              y={pad + gridSize / 2}
              textAnchor="middle"
              transform={`rotate(-90 14 ${pad + gridSize / 2})`}
              className="fill-slate-600 text-[10px] font-medium"
            >
              Northing (Read Up ↑)
            </text>

            {/* Right-triangle ΔE and ΔN guides */}
            <line
              x1={sx}
              y1={sy}
              x2={tx}
              y2={sy}
              stroke="#64748B"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <line
              x1={tx}
              y1={sy}
              x2={tx}
              y2={ty}
              stroke="#64748B"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />

            {/* Direct Vector Line */}
            <line
              x1={sx}
              y1={sy}
              x2={tx}
              y2={ty}
              stroke="#D97706"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Point A (Start) */}
            <circle
              cx={sx}
              cy={sy}
              r="6"
              fill="#0F172A"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            <text
              x={sx}
              y={sy - 11}
              textAnchor="middle"
              className="fill-slate-900 text-[11px] font-mono font-semibold"
            >
              A
            </text>

            {/* Point B (Target) */}
            <circle
              cx={tx}
              cy={ty}
              r="7"
              fill="#D97706"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            <text
              x={tx}
              y={ty - 12}
              textAnchor="middle"
              className="fill-amber-800 text-[11px] font-mono font-semibold"
            >
              B
            </text>
          </svg>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span>
            Each numbered square equals 1,000 m × 1,000 m (1 km²)
          </span>
          <span className="font-mono tabular-nums">
            Resolution: ±{result.unitMeters} m
          </span>
        </div>
      </div>

      {/* Right Zone: Coordinate Inputs & Vector Solution */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6">
        <div className="space-y-5">
          {/* Grid Precision Selector */}
          <div>
            <span className="block text-xs font-medium text-slate-500 mb-2">
              Grid Reference Precision
            </span>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => handlePrecisionChange(6)}
                className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  precision === 6
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                6-Digit (100 m)
              </button>
              <button
                type="button"
                onClick={() => handlePrecisionChange(8)}
                className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  precision === 8
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                8-Digit (10 m)
              </button>
            </div>
          </div>

          {/* Point A Coordinates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">
                Point A (Start Grid)
              </span>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {result.startCode}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="start-easting"
                  className="block text-xs text-slate-500 mb-1"
                >
                  Easting (Right)
                </label>
                <input
                  id="start-easting"
                  type="number"
                  min={0}
                  max={result.maxVal}
                  value={startEasting}
                  onChange={(e) =>
                    setStartEasting(
                      Math.max(0, Math.min(result.maxVal, Number(e.target.value) || 0)),
                    )
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
              <div>
                <label
                  htmlFor="start-northing"
                  className="block text-xs text-slate-500 mb-1"
                >
                  Northing (Up)
                </label>
                <input
                  id="start-northing"
                  type="number"
                  min={0}
                  max={result.maxVal}
                  value={startNorthing}
                  onChange={(e) =>
                    setStartNorthing(
                      Math.max(0, Math.min(result.maxVal, Number(e.target.value) || 0)),
                    )
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Point B Coordinates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">
                Point B (Target Grid)
              </span>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {result.targetCode}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="target-easting"
                  className="block text-xs text-slate-500 mb-1"
                >
                  Easting (Right)
                </label>
                <input
                  id="target-easting"
                  type="number"
                  min={0}
                  max={result.maxVal}
                  value={targetEasting}
                  onChange={(e) =>
                    setTargetEasting(
                      Math.max(0, Math.min(result.maxVal, Number(e.target.value) || 0)),
                    )
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
              <div>
                <label
                  htmlFor="target-northing"
                  className="block text-xs text-slate-500 mb-1"
                >
                  Northing (Up)
                </label>
                <input
                  id="target-northing"
                  type="number"
                  min={0}
                  max={result.maxVal}
                  value={targetNorthing}
                  onChange={(e) =>
                    setTargetNorthing(
                      Math.max(0, Math.min(result.maxVal, Number(e.target.value) || 0)),
                    )
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Primary Readout Panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Straight-Line Distance
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-3xl font-mono font-semibold tabular-nums text-slate-900">
                    {result.distanceMeters}
                  </span>
                  <span className="text-xs font-mono text-slate-500">m</span>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-500">
                  Grid Bearing (A → B)
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-3xl font-mono font-semibold tabular-nums text-amber-700">
                    {formatBearing(result.bearingDeg)}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    ({result.bearingMils} mils)
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/80 space-y-1 text-xs font-mono tabular-nums text-slate-600">
              <div>
                ΔE = {result.deltaEastingMeters >= 0 ? '+' : ''}
                {result.deltaEastingMeters} m · ΔN ={' '}
                {result.deltaNorthingMeters >= 0 ? '+' : ''}
                {result.deltaNorthingMeters} m
              </div>
              <div>
                √({result.deltaEastingMeters}² + {result.deltaNorthingMeters}²) ={' '}
                {result.distanceMeters} m · Return {formatBearing(result.backBearingDeg)}
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
