import type { MeterReading, ProcessedReading, DailyDataPoint } from '../types';

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthIdx = parseInt(m, 10) - 1;
  return `${parseInt(d, 10)} ${months[monthIdx] || ''}`;
}

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function getMonthName(yearMonth: string): string {
  const parts = yearMonth.split('-');
  if (parts.length < 2) return yearMonth;
  const mIdx = parseInt(parts[1], 10) - 1;
  return MONTH_NAMES[mIdx] || yearMonth;
}

const WEEKDAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function getDayOfWeekName(dateStr: string): string {
  const d = parseDate(dateStr);
  return WEEKDAY_NAMES[d.getDay()];
}

export function processReadings(readings: MeterReading[]): ProcessedReading[] {
  // Sort chronologically ascending
  const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date));

  const result: ProcessedReading[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    if (i === 0) {
      result.push({
        ...current,
        delta: 0,
        daysElapsed: 0,
        dailyAvg: 0,
        isMultiDay: false,
      });
      continue;
    }

    const prev = sorted[i - 1];
    const prevD = parseDate(prev.date);
    const currD = parseDate(current.date);
    const diffTime = currD.getTime() - prevD.getTime();
    const daysElapsed = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

    const delta = Math.max(0, current.value - prev.value);
    const dailyAvg = delta / daysElapsed;

    result.push({
      ...current,
      prevReading: prev.value,
      prevDate: prev.date,
      delta: Number(delta.toFixed(2)),
      daysElapsed,
      dailyAvg: Number(dailyAvg.toFixed(2)),
      isMultiDay: daysElapsed > 1,
    });
  }

  return result;
}

export function generateDailySeries(
  processed: ProcessedReading[],
  interpolate: boolean
): DailyDataPoint[] {
  if (processed.length < 2) return [];

  const points: DailyDataPoint[] = [];

  for (let i = 1; i < processed.length; i++) {
    const item = processed[i];
    const prev = processed[i - 1];

    if (!interpolate || item.daysElapsed === 1) {
      points.push({
        date: item.date,
        displayDate: formatShortDate(item.date),
        dayOfWeek: getDayOfWeekName(item.date),
        consumption: item.delta,
        isInterpolated: item.daysElapsed > 1,
        meterValue: item.value,
      });
    } else {
      // Interpolate over the missing days evenly
      const startD = parseDate(prev.date);
      const perDayDelta = Number((item.delta / item.daysElapsed).toFixed(2));

      for (let dayStep = 1; dayStep <= item.daysElapsed; dayStep++) {
        const stepDate = new Date(startD);
        stepDate.setDate(stepDate.getDate() + dayStep);
        const dateKey = formatDateKey(stepDate);

        points.push({
          date: dateKey,
          displayDate: formatShortDate(dateKey),
          dayOfWeek: getDayOfWeekName(dateKey),
          consumption: perDayDelta,
          isInterpolated: dayStep < item.daysElapsed,
          meterValue: dayStep === item.daysElapsed ? item.value : undefined,
        });
      }
    }
  }

  return points;
}

export interface PeriodSummary {
  totalKwh: number;
  dailyAvg: number;
  maxKwh: number;
  minKwh: number;
  readingsCount: number;
  daysCount: number;
  startReading: number;
  endReading: number;
}

export function calculateSummary(points: DailyDataPoint[]): PeriodSummary {
  if (points.length === 0) {
    return {
      totalKwh: 0,
      dailyAvg: 0,
      maxKwh: 0,
      minKwh: 0,
      readingsCount: 0,
      daysCount: 0,
      startReading: 0,
      endReading: 0,
    };
  }

  const consumptions = points.map((p) => p.consumption);
  const totalKwh = Number(consumptions.reduce((a, b) => a + b, 0).toFixed(2));
  const daysCount = points.length;
  const dailyAvg = Number((totalKwh / daysCount).toFixed(2));
  const maxKwh = Math.max(...consumptions);
  const minKwh = Math.min(...consumptions);

  return {
    totalKwh,
    dailyAvg,
    maxKwh,
    minKwh,
    readingsCount: points.length,
    daysCount,
    startReading: 0,
    endReading: 0,
  };
}

export interface WeekdayStats {
  dayName: string;
  avgKwh: number;
  count: number;
}

export function calculateWeekdayDistribution(points: DailyDataPoint[]): WeekdayStats[] {
  const map: Record<string, { sum: number; count: number }> = {
    Lun: { sum: 0, count: 0 },
    Mar: { sum: 0, count: 0 },
    Mié: { sum: 0, count: 0 },
    Jue: { sum: 0, count: 0 },
    Vie: { sum: 0, count: 0 },
    Sáb: { sum: 0, count: 0 },
    Dom: { sum: 0, count: 0 },
  };

  points.forEach((p) => {
    if (map[p.dayOfWeek]) {
      map[p.dayOfWeek].sum += p.consumption;
      map[p.dayOfWeek].count += 1;
    }
  });

  return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => {
    const item = map[d];
    return {
      dayName: d,
      avgKwh: item.count > 0 ? Number((item.sum / item.count).toFixed(2)) : 0,
      count: item.count,
    };
  });
}
