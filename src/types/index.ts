export interface MeterReading {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  value: number; // Cumulative kWh
  note?: string;
}

export interface ProcessedReading extends MeterReading {
  prevReading?: number;
  prevDate?: string;
  delta: number; // value - prevReading
  daysElapsed: number; // days since previous reading
  dailyAvg: number; // delta / daysElapsed
  isMultiDay: boolean; // if daysElapsed > 1
}

export interface DailyDataPoint {
  date: string; // YYYY-MM-DD
  displayDate: string; // e.g. "12 Oct"
  dayOfWeek: string; // e.g. "Lun"
  consumption: number; // kWh
  isInterpolated?: boolean;
  meterValue?: number;
}

export type TargetNature = 'ceiling' | 'floor' | 'target';

export interface AppSettings {
  tariffPerKwh: number;
  currency: string;
  dailyTargetKwh: number;
  monthlyTargetKwh?: number; // e.g. 140 kWh
  targetNature: TargetNature; // 'ceiling' (techo/minimizar), 'floor' (piso/maximizar), 'target' (acercarse)
  interpolateSkippedDays: boolean;
  theme: 'system' | 'dark' | 'light';
}
