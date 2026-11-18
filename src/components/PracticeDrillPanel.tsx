import { useState } from 'react';
import { Check, HelpCircle, RefreshCw, X } from 'lucide-react';
import { CalculatorId, PracticeDrillQuestion } from '../types/tactical';
import { generatePracticeDrill } from '../utils/tacticalMath';

interface PracticeDrillPanelProps {
  onSelectCalculator: (id: CalculatorId) => void;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<CalculatorId, string> = {
  azimuth: 'Azimuth & Declination',
  pace: 'Pace Count & Time',
  range: 'Mil-Range Estimation',
  grid: 'Grid Coordinates',
};

export function PracticeDrillPanel({
  onSelectCalculator,
  onClose,
}: PracticeDrillPanelProps) {
  const [question, setQuestion] = useState<PracticeDrillQuestion>(() =>
    generatePracticeDrill(Math.floor(Date.now() % 1000)),
  );
  const [userInput, setUserInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [checkedState, setCheckedState] = useState<'idle' | 'correct' | 'incorrect'>(
    'idle',
  );
  const [score, setScore] = useState({ solved: 0, attempts: 0 });

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number.parseFloat(userInput.trim());
    if (Number.isNaN(numeric)) return;

    const isCorrect = Math.abs(numeric - question.correctAnswer) <= question.tolerance;
    setCheckedState(isCorrect ? 'correct' : 'incorrect');
    setScore((prev) => ({
      solved: prev.solved + (isCorrect ? 1 : 0),
      attempts: prev.attempts + 1,
    }));
  };

  const handleNext = () => {
    setQuestion(generatePracticeDrill(Math.floor(Math.random() * 10000)));
    setUserInput('');
    setShowHint(false);
    setCheckedState('idle');
  };

  return (
    <section
      aria-label="Beginner practice drill"
      className="bg-white border border-slate-200 rounded-xl p-6 mb-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Beginner Practice Drill
          </h2>
          <span className="text-slate-300" aria-hidden="true">
            ·
          </span>
          <span className="text-sm text-slate-600">
            {CATEGORY_LABELS[question.category]}
          </span>
          <span className="text-slate-300" aria-hidden="true">
            ·
          </span>
          <span className="text-sm font-mono tabular-nums text-slate-600">
            {score.solved} / {score.attempts} solved
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectCalculator(question.category)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Open Matching Calculator
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close practice drill"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="pt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-3">
          <p className="text-base text-slate-800 leading-relaxed">{question.prompt}</p>

          {showHint && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200/70 rounded-lg px-4 py-2.5">
              Hint: {question.hint}
            </p>
          )}

          {checkedState !== 'idle' && (
            <div
              className={`rounded-lg px-4 py-3 border text-sm ${
                checkedState === 'correct'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="font-semibold flex items-center gap-2 mb-1">
                {checkedState === 'correct' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>
                      Correct ({question.correctAnswer} {question.unit})
                    </span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-rose-700" />
                    <span>
                      Expected answer: {question.correctAnswer} {question.unit}
                    </span>
                  </>
                )}
              </div>
              <p className="text-slate-700">{question.explanation}</p>
            </div>
          )}
        </div>

        <form
          onSubmit={handleCheck}
          className="lg:col-span-5 flex flex-col gap-3 bg-slate-50 border border-slate-200/80 rounded-lg p-4"
        >
          <label
            htmlFor="drill-answer-input"
            className="text-xs font-medium text-slate-600"
          >
            Your Answer ({question.unit})
          </label>
          <div className="flex items-center gap-2">
            <input
              id="drill-answer-input"
              type="number"
              step="any"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={`Enter value in ${question.unit}`}
              className="flex-1 min-w-0 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600"
            />
            <button
              type="submit"
              disabled={!userInput.trim()}
              className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
            >
              Check
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Question</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
