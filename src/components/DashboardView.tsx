import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
  Cell,
} from 'recharts';
import {
  Zap,
  Activity,
  Calendar,
  TrendingUp,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Plus,
} from 'lucide-react';
import { MetricCard } from './MetricCard';
import { HeroProjectionCard } from './HeroProjectionCard';
import type { ProcessedReading, DailyDataPoint, AppSettings, TargetNature } from '../types';
import type { PeriodSummary, WeekdayStats } from '../utils/calculations';

export interface MonthSummaryItem {
  key: string;
  name: string;
  label: string;
  summary: PeriodSummary;
  points: DailyDataPoint[];
}

interface DashboardViewProps {
  processedReadings: ProcessedReading[];
  dailySeries: DailyDataPoint[];
  latestProcessed: ProcessedReading | null;
  settings: AppSettings;
  availableMonths?: MonthSummaryItem[];
  activeMonthName?: string;
  activeMonthSummary?: PeriodSummary;
  octoberSummary: PeriodSummary;
  septemberSummary: PeriodSummary;
  totalSummary: PeriodSummary;
  octoberProjection: {
    monthKey?: string;
    monthName?: string;
    daysElapsed: number;
    daysTotal: number;
    daysRemaining: number;
    currentKwh: number;
    dailyAvg: number;
    projectedTotal: number;
    currentCost: number;
    projectedCost: number;
    monthlyTarget?: number;
    targetNature: TargetNature;
    targetDiff: number;
    targetPercent: number;
    remainingBudgetKwh: number;
    recommendedDailyAllowance: number;
    status: 'onTrack' | 'warning' | 'critical';
  } | null;
  weekdayStats: WeekdayStats[];
  onOpenAdd?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  processedReadings,
  dailySeries,
  latestProcessed,
  settings,
  availableMonths = [],
  activeMonthName = 'Mes Actual',
  activeMonthSummary,
  octoberSummary,
  septemberSummary,
  totalSummary,
  octoberProjection,
  weekdayStats,
  onOpenAdd,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('active');

  const activeMonthKey = availableMonths.length > 0 ? availableMonths[0].key : '';
  const currentPeriodKey = selectedPeriod === 'active' ? activeMonthKey : selectedPeriod;

  const filteredDailySeries = useMemo(() => {
    if (currentPeriodKey === 'all' || !currentPeriodKey) {
      return dailySeries;
    }
    const found = availableMonths.find((m) => m.key === currentPeriodKey);
    return found ? found.points : dailySeries.filter((d) => d.date.startsWith(currentPeriodKey));
  }, [dailySeries, currentPeriodKey, availableMonths]);

  const activeSummary = useMemo(() => {
    if (currentPeriodKey === 'all' || !currentPeriodKey) return totalSummary;
    const found = availableMonths.find((m) => m.key === currentPeriodKey);
    if (found) return found.summary;
    if (currentPeriodKey === '2026-10') return octoberSummary;
    if (currentPeriodKey === '2026-09') return septemberSummary;
    return activeMonthSummary || totalSummary;
  }, [currentPeriodKey, availableMonths, totalSummary, octoberSummary, septemberSummary, activeMonthSummary]);

  const cumulativeData = useMemo(() => {
    return processedReadings.map((r) => ({
      date: r.date.slice(5),
      displayDate: r.date.slice(8),
      value: r.value,
      delta: r.delta,
    }));
  }, [processedReadings]);

  const latestDelta = latestProcessed ? latestProcessed.delta : 0;
  const isOverDailyTarget = latestDelta > settings.dailyTargetKwh;

  const formatCurrency = (val: number) => {
    return `${settings.currency} ${val.toLocaleString('es-CO')}`;
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* 1. Header / Hero Section */}
      {processedReadings.length === 0 ? (
        /* Welcome Onboarding Hero Card */
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-sky-900/40 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
            <div className="space-y-1.5 max-w-lg">
              <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs tracking-wider uppercase">
                <Zap size={15} />
                <span>Coge Air-e</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Apunta la primera lectura
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Anota lo que marca el medidor en kWh para llevar la cuenta clarita y que el recibo no te coja fuera de base a fin de mes.
              </p>
            </div>

            {onOpenAdd && (
              <button
                onClick={onOpenAdd}
                className="px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all inline-flex items-center justify-center gap-2 shrink-0 self-start sm:self-center"
              >
                <Plus size={18} strokeWidth={2.6} />
                <span>Registrar Lectura</span>
              </button>
            )}
          </div>
        </div>
      ) : processedReadings.length === 1 && latestProcessed ? (
        /* Baseline Reading Confirmation Card */
        <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 rounded-3xl p-6 text-center space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Lectura base en firme
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
            {latestProcessed.value.toFixed(2)} <span className="text-base text-slate-400 font-semibold">kWh</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Registrada el {latestProcessed.date}. Anota la lectura de mañana para ver el consumo de 24 horas y cómo pinta el fin de mes.
          </div>
        </div>
      ) : octoberProjection ? (
        /* Full Hero Projection Card (2+ readings) */
        <HeroProjectionCard
          currentKwh={octoberProjection.currentKwh}
          projectedTotal={octoberProjection.projectedTotal}
          dailyAvg={octoberProjection.dailyAvg}
          daysElapsed={octoberProjection.daysElapsed}
          daysTotal={octoberProjection.daysTotal}
          daysRemaining={octoberProjection.daysRemaining}
          projectedCost={octoberProjection.projectedCost}
          currency={settings.currency}
          monthlyTarget={octoberProjection.monthlyTarget}
          targetNature={octoberProjection.targetNature}
          targetDiff={octoberProjection.targetDiff}
          recommendedDailyAllowance={octoberProjection.recommendedDailyAllowance}
          status={octoberProjection.status}
        />
      ) : null}

      {/* 2. Primary KPI Cards Grid (Always visible for clean layout structure) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Lectura Actual"
          icon={Zap}
          value={latestProcessed ? latestProcessed.value.toFixed(2) : '--'}
          unit={latestProcessed ? 'kWh' : undefined}
          subValue={
            latestProcessed
              ? `${latestProcessed.date.slice(8)} ${activeMonthName ? activeMonthName.slice(0, 3) : ''}`
              : undefined
          }
          accentColor="text-sky-500 dark:text-sky-400"
          tooltip="Última lectura acumulada tomada directamente del contador de luz."
        />

        <MetricCard
          title="Consumo 24h"
          icon={Activity}
          value={latestProcessed && latestDelta > 0 ? `+${latestDelta.toFixed(2)}` : '--'}
          unit={latestProcessed && latestDelta > 0 ? 'kWh' : undefined}
          subValue={
            latestProcessed
              ? isOverDailyTarget
                ? 'Sobre Meta'
                : 'Normal'
              : undefined
          }
          subIndicator={isOverDailyTarget ? 'negative' : 'positive'}
          accentColor={isOverDailyTarget ? 'text-amber-500' : 'text-emerald-500'}
          tooltip="Energía consumida desde la lectura previa. Comparado con la meta diaria fija."
        />

        <MetricCard
          title="Acumulado Mes"
          icon={Calendar}
          value={
            processedReadings.length >= 2
              ? (activeMonthSummary?.totalKwh ?? octoberSummary.totalKwh).toFixed(1)
              : '--'
          }
          unit={processedReadings.length >= 2 ? 'kWh' : undefined}
          subValue={processedReadings.length >= 2 ? activeMonthName : undefined}
          accentColor="text-teal-500 dark:text-teal-400"
          tooltip={`Consumo total sumado durante ${activeMonthName} hasta la última lectura.`}
        />

        <MetricCard
          title="Ritmo Diario"
          icon={Clock}
          value={
            processedReadings.length >= 2
              ? (activeMonthSummary?.dailyAvg ?? octoberSummary.dailyAvg).toFixed(2)
              : '--'
          }
          unit={processedReadings.length >= 2 ? 'kWh/d' : undefined}
          subValue={
            processedReadings.length >= 2
              ? formatCurrency(
                  Math.round(
                    (activeMonthSummary?.dailyAvg ?? octoberSummary.dailyAvg) * settings.tariffPerKwh
                  )
                )
              : undefined
          }
          accentColor="text-indigo-500 dark:text-indigo-400"
          tooltip={`Promedio aritmético de energía consumida por día en ${activeMonthName}.`}
        />
      </div>

      {/* 3. Analytics Section: Charts or Clean Placeholder */}
      {processedReadings.length < 2 ? (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 sm:p-10 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Activity size={22} strokeWidth={2} />
          </div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {processedReadings.length === 0
              ? 'Panel analítico en espera'
              : 'Esperando siguiente lectura'}
          </div>
          <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            {processedReadings.length === 0
              ? 'Los gráficos de consumo diario, curva del medidor y proyección mensual se activarán automáticamente con tus registros.'
              : 'Con tu próxima toma diaria se calculará tu consumo en 24h y se generará la proyección del mes.'}
          </div>
        </div>
      ) : (
        <>
          {/* Main Bar Chart Container */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-sm">
            {/* Header & Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Activity size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Consumo Diario
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {activeSummary.totalKwh.toFixed(2)}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">kWh</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                      • Ø {activeSummary.dailyAvg.toFixed(2)} kWh/d • {formatCurrency(Math.round(activeSummary.totalKwh * settings.tariffPerKwh))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Segmented Filter Control */}
              <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 self-start sm:self-auto overflow-x-auto max-w-full">
                {availableMonths.length > 0 ? (
                  <>
                    {availableMonths.map((m) => {
                      const isActive =
                        currentPeriodKey === m.key ||
                        (selectedPeriod === 'active' && m.key === activeMonthKey);
                      return (
                        <button
                          key={m.key}
                          onClick={() => setSelectedPeriod(m.key)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                            isActive
                              ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setSelectedPeriod('all')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        currentPeriodKey === 'all'
                          ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      Todo
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectedPeriod('all')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm"
                  >
                    Todo
                  </button>
                )}
              </div>
            </div>

            {/* Daily Bar Chart */}
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredDailySeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="displayDate"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(56, 189, 248, 0.08)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as DailyDataPoint;
                        const cost = Math.round(data.consumption * settings.tariffPerKwh);
                        return (
                          <div className="bg-slate-900 text-slate-100 dark:bg-slate-800 p-3 rounded-2xl shadow-xl border border-slate-700/60 text-xs">
                            <div className="font-semibold text-slate-300 mb-1">
                              {data.displayDate} ({data.dayOfWeek})
                            </div>
                            <div className="text-base font-bold text-sky-400">
                              {data.consumption.toFixed(2)} kWh
                            </div>
                            <div className="text-slate-400 mt-0.5">
                              {formatCurrency(cost)}
                            </div>
                            {data.isInterpolated && (
                              <div className="text-[10px] text-amber-400/90 mt-1">
                                Promedio intervalo
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={activeSummary.dailyAvg}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                  <Bar dataKey="consumption" radius={[6, 6, 2, 2]}>
                    {filteredDailySeries.map((entry, index) => {
                      let fillColor = '#38bdf8';
                      if (entry.consumption > settings.dailyTargetKwh) {
                        fillColor = '#f59e0b';
                      } else if (entry.consumption < activeSummary.dailyAvg * 0.85) {
                        fillColor = '#2dd4bf';
                      }
                      return <Cell key={`cell-${index}`} fill={fillColor} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                  <span>&lt; Promedio</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <span>Normal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>&gt; {settings.dailyTargetKwh} kWh</span>
                </div>
              </div>
              <div className="text-right">
                Línea punteada: Ø {activeSummary.dailyAvg.toFixed(2)} kWh
              </div>
            </div>
          </div>

          {/* Two Column Section: Avance del Contador & Patrón Semanal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Cumulative Progression Curve */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <TrendingUp size={16} strokeWidth={2.4} />
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Avance del Contador
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {latestProcessed ? latestProcessed.value.toFixed(2) : 0} kWh
                </span>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativeData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="meterGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={['dataMin - 10', 'dataMax + 10']}
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-slate-100 p-2.5 rounded-xl text-xs border border-slate-700">
                              <div className="font-semibold">{data.date}</div>
                              <div className="text-sky-400 font-bold">{data.value.toFixed(2)} kWh</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#meterGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekday Distribution */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Calendar size={16} strokeWidth={2.4} />
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Patrón Semanal
                  </span>
                </div>
                <span className="text-xs text-slate-400">Promedios por día</span>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayStats} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis
                      dataKey="dayName"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as WeekdayStats;
                          return (
                            <div className="bg-slate-900 text-slate-100 p-2.5 rounded-xl text-xs border border-slate-700">
                              <div className="font-semibold">{data.dayName}</div>
                              <div className="text-indigo-400 font-bold">
                                {data.avgKwh.toFixed(2)} kWh
                              </div>
                              <div className="text-slate-400 text-[10px]">{data.count} lecturas</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="avgKwh" fill="#818cf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Monthly Comparison Analysis Card (rendered when at least 2 distinct months exist) */}
          {availableMonths.length >= 2 && (
            <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <Flame size={18} className="text-amber-400" />
                  <span className="text-sm font-bold tracking-tight text-slate-200">
                    {availableMonths[1].name} vs {availableMonths[0].name}
                  </span>
                </div>
                <span className="text-xs font-medium text-slate-400">
                  {availableMonths[0].summary.dailyAvg > availableMonths[1].summary.dailyAvg ? (
                    <span className="text-amber-400 inline-flex items-center gap-1">
                      <ArrowUpRight size={14} /> +{(
                        ((availableMonths[0].summary.dailyAvg /
                          (availableMonths[1].summary.dailyAvg || 1) -
                          1) *
                        100)
                      ).toFixed(0)}% en ritmo diario
                    </span>
                  ) : (
                    <span className="text-emerald-400 inline-flex items-center gap-1">
                      <ArrowDownRight size={14} /> Ritmo más bajo
                    </span>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/40">
                  <div className="text-xs text-slate-400 font-medium">{availableMonths[1].name}</div>
                  <div className="text-xl font-bold mt-1 text-slate-100">
                    {availableMonths[1].summary.totalKwh.toFixed(2)}{' '}
                    <span className="text-xs font-normal text-slate-400">kWh</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Ø {availableMonths[1].summary.dailyAvg.toFixed(2)} kWh/d •{' '}
                    {availableMonths[1].summary.daysCount} días
                  </div>
                </div>

                <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/40">
                  <div className="text-xs text-slate-400 font-medium">{availableMonths[0].name}</div>
                  <div className="text-xl font-bold mt-1 text-sky-400">
                    {availableMonths[0].summary.totalKwh.toFixed(2)}{' '}
                    <span className="text-xs font-normal text-slate-400">kWh</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Ø {availableMonths[0].summary.dailyAvg.toFixed(2)} kWh/d •{' '}
                    {availableMonths[0].summary.daysCount} días
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
