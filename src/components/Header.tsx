interface HeaderProps {
  isDrillOpen: boolean;
  onToggleDrill: () => void;
  savedCount: number;
}

export function Header({ isDrillOpen, onToggleDrill, savedCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#F6F7F5]/95 backdrop-blur-sm border-b border-slate-200/80">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#workspace"
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 rounded"
        >
          Gridline
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <a
            href="#workspace"
            className="hover:text-slate-900 hover:underline underline-offset-4 decoration-slate-300 transition-colors whitespace-nowrap shrink-0"
          >
            Calculators
          </a>
          <a
            href="#mission-log"
            className="hover:text-slate-900 hover:underline underline-offset-4 decoration-slate-300 transition-colors whitespace-nowrap shrink-0"
          >
            Saved Log{savedCount > 0 ? ` (${savedCount})` : ''}
          </a>
          <a
            href="#formulas"
            className="hover:text-slate-900 hover:underline underline-offset-4 decoration-slate-300 transition-colors whitespace-nowrap shrink-0"
          >
            Formulas
          </a>
          <a
            href="#beginner-guide"
            className="hover:text-slate-900 hover:underline underline-offset-4 decoration-slate-300 transition-colors whitespace-nowrap shrink-0"
          >
            Beginner Guide
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onToggleDrill}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 ${
              isDrillOpen
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {isDrillOpen ? 'Close Drill' : 'Practice Drill'}
          </button>
        </div>
      </div>
    </header>
  );
}
