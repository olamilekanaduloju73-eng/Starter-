import { useEffect, useState } from 'react';
import { Compass, Crosshair, Footprints, Grid3X3 } from 'lucide-react';
import { BeginnerGuide } from './components/BeginnerGuide';
import { CalculationLog } from './components/CalculationLog';
import { Header } from './components/Header';
import { PracticeDrillPanel } from './components/PracticeDrillPanel';
import { AzimuthCalculator } from './components/calculators/AzimuthCalculator';
import { GridCalculator } from './components/calculators/GridCalculator';
import { PaceCalculator } from './components/calculators/PaceCalculator';
import { RangeCalculator } from './components/calculators/RangeCalculator';
import { CalculatorId, SavedLogEntry } from './types/tactical';

const STORAGE_KEY = 'gridline_saved_log_v1';

const CALCULATOR_TABS: {
  id: CalculatorId;
  label: string;
  shortDesc: string;
  icon: typeof Compass;
}[] = [
  {
    id: 'azimuth',
    label: 'Azimuth & Declination',
    shortDesc: 'Grid ↔ Magnetic bearings & back-azimuths',
    icon: Compass,
  },
  {
    id: 'pace',
    label: 'Pace & Travel Time',
    shortDesc: '100 m pace count & climb-adjusted ETA',
    icon: Footprints,
  },
  {
    id: 'range',
    label: 'Mil-Range Estimation',
    shortDesc: 'Optical WORM formula & reticle sizing',
    icon: Crosshair,
  },
  {
    id: 'grid',
    label: 'Grid Vector Plotter',
    shortDesc: '6-digit & 8-digit distance and bearing',
    icon: Grid3X3,
  },
];

export default function App() {
  const [activeCalc, setActiveCalc] = useState<CalculatorId>('azimuth');
  const [isDrillOpen, setIsDrillOpen] = useState(false);
  const [savedEntries, setSavedEntries] = useState<SavedLogEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore malformed storage
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedEntries));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedEntries]);

  const handleSaveLog = (entry: Omit<SavedLogEntry, 'id' | 'timestamp'>) => {
    const next: SavedLogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setSavedEntries((prev) => [next, ...prev]);
  };

  const handleRemoveEntry = (id: string) => {
    setSavedEntries((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setSavedEntries([]);
  };

  const activeMeta =
    CALCULATOR_TABS.find((t) => t.id === activeCalc) ?? CALCULATOR_TABS[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F5] text-slate-900">
      <Header
        isDrillOpen={isDrillOpen}
        onToggleDrill={() => setIsDrillOpen((v) => !v)}
        savedCount={savedEntries.length}
      />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
        {/* Compact Workspace Intro + Calculator Switcher */}
        <section id="workspace" aria-label="Tactical calculation workspace" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <h1
                className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900"
                style={{ textWrap: 'balance' }}
              >
                Tactical &amp; Field Calculations for Beginners
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Learn compass conversions, pace counting, optical mil-range estimation,
                and map grid plotting with live visual diagrams and step-by-step math.
              </p>
            </div>
            <div className="text-xs text-slate-500 whitespace-nowrap">
              Active tool: <span className="font-medium text-slate-800">{activeMeta.label}</span>
            </div>
          </div>

          {/* 4-Tool Segmented Bar */}
          <div
            role="tablist"
            aria-label="Select tactical calculator"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 bg-slate-200/70 rounded-xl"
          >
            {CALCULATOR_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeCalc === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  onClick={() => setActiveCalc(tab.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-amber-600' : 'text-slate-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{tab.label}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {tab.shortDesc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Optional Guided Practice Drill */}
          {isDrillOpen && (
            <PracticeDrillPanel
              onSelectCalculator={(id) => setActiveCalc(id)}
              onClose={() => setIsDrillOpen(false)}
            />
          )}

          {/* Active Two-Zone Calculator */}
          <div>
            {activeCalc === 'azimuth' && <AzimuthCalculator onSaveLog={handleSaveLog} />}
            {activeCalc === 'pace' && <PaceCalculator onSaveLog={handleSaveLog} />}
            {activeCalc === 'range' && <RangeCalculator onSaveLog={handleSaveLog} />}
            {activeCalc === 'grid' && <GridCalculator onSaveLog={handleSaveLog} />}
          </div>
        </section>

        {/* Saved Route / Calculation Log */}
        <CalculationLog
          entries={savedEntries}
          onRemoveEntry={handleRemoveEntry}
          onClearAll={handleClearAll}
        />

        {/* Reference Formulas & Beginner Field Guide */}
        <BeginnerGuide />
      </main>

      <footer className="border-t border-slate-200/80 bg-white mt-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Gridline · Starter Tactical &amp; Land Navigation Calculations
          </div>
          <div>
            For training and route planning. Always verify bearings with a calibrated map
            and compass in the field.
          </div>
        </div>
      </footer>
    </div>
  );
}
