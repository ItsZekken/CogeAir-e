import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Info } from 'lucide-react';

interface MetricCardProps {
  title: string;
  icon: LucideIcon;
  value: string | number;
  unit?: string;
  subValue?: string;
  subIndicator?: 'positive' | 'negative' | 'neutral';
  accentColor?: string;
  tooltip?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  icon: Icon,
  value,
  unit,
  subValue,
  subIndicator = 'neutral',
  accentColor = 'text-sky-500 dark:text-sky-400',
  tooltip,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getSubColor = () => {
    switch (subIndicator) {
      case 'positive':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'negative':
        return 'text-amber-600 dark:text-amber-400';
      default:
        return 'text-slate-500 dark:text-slate-400';
    }
  };

  return (
    <div className="relative bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 ${accentColor}`}>
          <Icon size={18} strokeWidth={2.2} />
        </div>

        <div className="flex items-center gap-1.5">
          {subValue && (
            <span className={`text-xs font-semibold ${getSubColor()}`}>
              {subValue}
            </span>
          )}

          {tooltip && (
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip((prev) => !prev)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded-full"
                aria-label="Más información"
              >
                <Info size={13} />
              </button>

              {showTooltip && (
                <div className="absolute right-0 bottom-full mb-2 w-48 sm:w-56 p-2.5 bg-slate-900 text-slate-100 text-[11px] leading-relaxed rounded-xl shadow-xl border border-slate-700 z-50 animate-in fade-in zoom-in-95 pointer-events-none">
                  {tooltip}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
        {title}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};
