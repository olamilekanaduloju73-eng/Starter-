import { useState } from 'react';
import { Check, Copy, Trash2 } from 'lucide-react';
import { CalculatorId, SavedLogEntry } from '../types/tactical';
import { formatDurationMinutes } from '../utils/tacticalMath';

interface CalculationLogProps {
  entries: SavedLogEntry[];
  onRemoveEntry: (id: string) => void;
  onClearAll: () => void;
}

const TYPE_NAME: Record<CalculatorId, string> = {
  azimuth: 'Azimuth',
  pace: 'Pace & Time',
  range: 'Mil-Range',
  grid: 'Grid Vector',
};

export function CalculationLog({
  entries,
  onRemoveEntry,
  onClearAll,
}: CalculationLogProps) {
  const [copied, setCopied] = useState(false);

  const totalDistance = entries.reduce(
    (sum, item) => sum + (item.distanceMeters ?? 0),
    0,
  );
  const totalMinutes = entries.reduce(
    (sum, item) => sum + (item.estimatedMinutes ?? 0),
    0,
  );

  const handleCopySummary = async () => {
    if (entries.length === 0) return;
    const lines = entries.map(
      (entry, i) =>
        `${i + 1}. [${TYPE_NAME[entry.calculator]}] ${entry.label} — ${entry.primaryMetric} (${entry.summary})`,
    );
    if (totalDistance > 0) {
      lines.push('');
      lines.push(
        `Combined Distance: ${totalDistance} m${totalMinutes > 0 ? ` · Estimated Time: ${formatDurationMinutes(totalMinutes)}` : ''}`,
      );
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable in restricted contexts; fail quietly without alert
    }
  };

  return (
    <section
      id="mission-log"
      aria-labelledby="mission-log-heading"
      className="bg-white border border-slate-200 rounded-xl p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2
            id="mission-log-heading"
            className="font-display text-lg font-semibold text-slate-900"
          >
            Saved Calculation Log
          </h2>
          <p className="text-xs text-slate-500">
            Save individual bearings, pace legs, or range estimates to build a route card
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {entries.length > 0 && (
            <>
              <div className="text-xs font-mono tabular-nums text-slate-600">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                {totalDistance > 0 ? ` · ${totalDistance} m total` : ''}
                {totalMinutes > 0 ? ` · ${formatDurationMinutes(totalMinutes)}` : ''}
              </div>

              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors whitespace-nowrap"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClearAll}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors whitespace-nowrap"
              >
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="py-10 text-center space-y-1.5">
          <p className="text-sm font-medium text-slate-700">
            No calculations saved yet
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Adjust any calculator above and click Save to Log to record legs, bearings,
            and target ranges into your session scratchpad.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                <th className="py-3 pr-4">Tool</th>
                <th className="py-3 pr-4">Leg / Label</th>
                <th className="py-3 pr-4">Breakdown</th>
                <th className="py-3 pr-4 text-right">Result</th>
                <th className="py-3 pl-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 pr-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                    {TYPE_NAME[entry.calculator]}
                  </td>
                  <td className="py-3 pr-4 font-medium text-slate-900 whitespace-nowrap">
                    {entry.label}
                  </td>
                  <td className="py-3 pr-4 text-xs font-mono tabular-nums text-slate-600">
                    {entry.summary}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono font-semibold tabular-nums text-slate-900 whitespace-nowrap">
                    {entry.primaryMetric}
                  </td>
                  <td className="py-3 pl-2 text-right">
                    <button
                      type="button"
                      onClick={() => onRemoveEntry(entry.id)}
                      aria-label={`Remove ${entry.label}`}
                      className="p-1.5 text-slate-400 hover:text-rose-700 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
