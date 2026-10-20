import type { MeterReading, AppSettings } from '../types';

export const INITIAL_READINGS: MeterReading[] = [];

export const DEFAULT_SETTINGS: AppSettings = {
  tariffPerKwh: 850,
  currency: '$',
  dailyTargetKwh: 5.0,
  monthlyTargetKwh: 140,
  targetNature: 'ceiling',
  billingCutoffDay: undefined,
  interpolateSkippedDays: true,
  theme: 'dark',
};
