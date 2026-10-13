import { useState } from 'react';
import { Info, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { TargetNature } from '../types';

interface HeroProjectionCardProps {
  currentKwh: number;
  projectedTotal: number;
  dailyAvg: number;
  daysElapsed: number;
  daysTotal: number;
  daysRemaining: number;
  projectedCost: number;
  currency: string;
  monthlyTarget?: number;
  targetNature: TargetNature;
  targetDiff: number;
  recommendedDailyAllowance: number;
  status: 'onTrack' | 'warning' | 'critical';
}

export const HeroProjectionCard: React.FC<HeroProjectionCardProps> = ({
  currentKwh,
  projectedTotal,
  dailyAvg,
  daysElapsed,
  daysTotal,
  daysRemaining,
  projectedCost,
  currency,
  monthlyTarget,
  targetNature,
  targetDiff,
  recommendedDailyAllowance,
  status,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusText = () => {
    if (!monthlyTarget) return null;
    const absDiff = Math.abs(targetDiff).toFixed(1);
    if (targetNature === 'ceiling') {
      if (targetDiff <= 0) {
        return `Vas suave (-${absDiff} kWh)`;
      }
      return `¡Pilas! +${absDiff} kWh`;
    }
    if (targetNature === 'floor') {
      if (targetDiff >= 0) {
        return `Sobre piso (+${absDiff} kWh)`;
      }
      return `¡Ojo! -${absDiff} kWh`;
    }
    // target
    if (Math.abs(targetDiff) <= 1.5) return 'En meta';
    return targetDiff > 0 ? `+${absDiff} kWh sobre meta` : `-${absDiff} kWh bajo meta`;
  };

  const getStatusBadgeClass = () => {
    if (status === 'onTrack') {
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
    if (status === 'warning') {
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
    return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  };

  const percentProgress = monthlyTarget
    ? Math.min(100, Math.round((currentKwh / monthlyTarget) * 100))
    : Math.round((daysElapsed / daysTotal) * 100);

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white rounded-3xl p-5 sm:p-6 shadow-lg border border-sky-900/40 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <TrendingUp size={20} strokeWidth={2.4} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-slate-200">
                Proyección Fin de Mes
              </span>
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip((p) => !p)}
                className="text-slate-400 hover:text-slate-200 p-0.5 rounded-full"
                aria-label="Información de cálculo"
              >
                <Info size={14} />
              </button>
            </div>
            <div className="text-xs text-slate-400">
              Día {daysElapsed} de {daysTotal} ({daysRemaining} d restantes)
            </div>
          </div>
        </div>

        {/* Compact Status Indicator */}
        {monthlyTarget && (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold shrink-0 ${getStatusBadgeClass()}`}
          >
            {status === 'onTrack' ? (
              <CheckCircle2 size={14} />
            ) : (
              <AlertTriangle size={14} />
            )}
            <span>{getStatusText()}</span>
          </div>
        )}

        {/* Tooltip Box */}
        {showTooltip && (
          <div className="absolute left-4 right-4 top-14 p-3 bg-slate-950 text-slate-200 text-xs rounded-2xl shadow-2xl border border-slate-700 z-50 animate-in fade-in zoom-in-95 leading-relaxed">
            Estimación al cierre sumando el consumo actual ({currentKwh} kWh) más el ritmo diario ({dailyAvg} kWh/d) por los {daysRemaining} días restantes.
          </div>
        )}
      </div>

      {/* Hero Metric Number Display */}
      <div className="my-3 relative z-10">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-sky-400">
            ~{Number(projectedTotal.toFixed(1))}
          </span>
          <span className="text-base font-bold text-slate-400">kWh</span>
        </div>
        <div className="text-xs text-slate-400 mt-0.5 font-medium">
          Costo proyectado: <strong className="text-slate-200">{currency} {projectedCost.toLocaleString('es-CO')}</strong>
        </div>
      </div>

      {/* Progress Bar (Consumed vs Target) */}
      <div className="space-y-1.5 relative z-10 my-3">
        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <span>Consumido: <strong className="text-slate-200">{currentKwh} kWh</strong> ({percentProgress}%)</span>
          {monthlyTarget && (
            <span>Meta: <strong className="text-slate-200">{monthlyTarget} kWh</strong></span>
          )}
        </div>

        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              status === 'critical' ? 'bg-amber-400' : 'bg-sky-400'
            }`}
            style={{ width: `${Math.min(100, percentProgress)}%` }}
          />
        </div>
      </div>

      {/* Actionable Consumption Advice Box (Punchy & Direct) */}
      {monthlyTarget && daysRemaining > 0 && (
        <div className="relative z-10 mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
          <div className="text-slate-300">
            {targetNature === 'ceiling' && (
              <span>
                Límite sugerido:{' '}
                <strong
                  className={
                    recommendedDailyAllowance < dailyAvg
                      ? 'text-amber-400 font-bold'
                      : 'text-emerald-400 font-bold'
                  }
                >
                  {recommendedDailyAllowance} kWh/d
                </strong>
              </span>
            )}
            {targetNature === 'floor' && (
              <span>
                Mínimo sugerido:{' '}
                <strong className="text-emerald-400 font-bold">
                  {recommendedDailyAllowance} kWh/d
                </strong>
              </span>
            )}
            {targetNature === 'target' && (
              <span>
                Consumo sugerido:{' '}
                <strong className="text-sky-400 font-bold">
                  {recommendedDailyAllowance} kWh/d
                </strong>
              </span>
            )}
          </div>

          <div className="text-slate-400 text-right">
            Ritmo actual: <strong className="text-slate-200">{dailyAvg} kWh/d</strong>
          </div>
        </div>
      )}
    </div>
  );
};
