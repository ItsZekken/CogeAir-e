import { useState, useEffect, useMemo, useCallback } from 'react';
import type { MeterReading, AppSettings, ProcessedReading, DailyDataPoint } from '../types';
import { DEFAULT_SETTINGS } from '../data/seedData';
import {
  processReadings,
  generateDailySeries,
  calculateSummary,
  calculateWeekdayDistribution,
  getMonthName,
  getBillingPeriodInfo,
} from '../utils/calculations';
import type { PeriodSummary, WeekdayStats } from '../utils/calculations';
import {
  dbGetAllReadings,
  dbSaveAllReadings,
  dbGetSettings,
  dbSaveSettings,
  dbClearAllReadings,
} from '../utils/db';
import { exportToExcel, parseExcelFile, type ImportResult } from '../utils/excel';

const STORAGE_KEY_READINGS = 'meter_readings_v1';
const STORAGE_KEY_SETTINGS = 'meter_settings_v1';
const SEED_PURGED_FLAG = 'meter_seed_purged_v2';

// Ensure previous seed records from older versions are purged clean
try {
  if (typeof window !== 'undefined' && !localStorage.getItem(SEED_PURGED_FLAG)) {
    localStorage.removeItem(STORAGE_KEY_READINGS);
    localStorage.setItem(SEED_PURGED_FLAG, 'true');
    dbClearAllReadings().catch(console.error);
  }
} catch {}

export function useMeterData() {
  const [readings, setReadings] = useState<MeterReading[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_READINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load readings from localStorage', e);
    }
    return [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // Initialize from IndexedDB on startup
  useEffect(() => {
    async function loadFromDB() {
      try {
        const [dbReadings, dbSettings] = await Promise.all([
          dbGetAllReadings(),
          dbGetSettings(),
        ]);

        if (dbReadings) {
          setReadings(dbReadings);
        }
        if (dbSettings) {
          setSettings(dbSettings);
        }
      } catch (err) {
        console.warn('Could not initialize from IndexedDB, using fallback', err);
      } finally {
        setIsDbLoaded(true);
      }
    }

    loadFromDB();
  }, []);

  // Persist readings to IndexedDB + localStorage
  useEffect(() => {
    if (!isDbLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY_READINGS, JSON.stringify(readings));
    } catch (e) {
      console.error('Failed to save readings to localStorage', e);
    }
    dbSaveAllReadings(readings).catch(console.error);
  }, [readings, isDbLoaded]);

  // Persist settings to IndexedDB + localStorage
  useEffect(() => {
    if (!isDbLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
    dbSaveSettings(settings).catch(console.error);
  }, [settings, isDbLoaded]);

  // Theme application
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  // CRUD actions
  const addReading = useCallback((data: { date: string; value: number; time?: string; note?: string }) => {
    const newId = `rec-${data.date}-${Date.now()}`;
    setReadings((prev) => {
      const filtered = prev.filter((r) => r.date !== data.date);
      return [...filtered, { id: newId, ...data }].sort((a, b) => a.date.localeCompare(b.date));
    });
  }, []);

  const updateReading = useCallback((id: string, updated: Partial<MeterReading>) => {
    setReadings((prev) =>
      prev
        .map((r) => (r.id === id ? { ...r, ...updated } : r))
        .sort((a, b) => a.date.localeCompare(b.date))
    );
  }, []);

  const deleteReading = useCallback((id: string) => {
    setReadings((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateSettings = useCallback((newPartial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newPartial }));
  }, []);

  const resetToDefault = useCallback(() => {
    setReadings([]);
    setSettings(DEFAULT_SETTINGS);
    dbClearAllReadings().catch(console.error);
    try {
      localStorage.removeItem(STORAGE_KEY_READINGS);
    } catch {}
  }, []);

  // Export JSON (for full restore)
  const exportToJson = useCallback(() => {
    const backupPayload = {
      app: 'seguimiento-luz',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      readings,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `respaldo-luz-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [readings, settings]);

  // Import JSON
  const importFromJson = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      let incomingReadings: MeterReading[] = [];

      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0].value === 'number') {
        incomingReadings = parsed;
      } else if (parsed && Array.isArray(parsed.readings)) {
        incomingReadings = parsed.readings;
        if (parsed.settings) {
          setSettings((prev) => ({ ...prev, ...parsed.settings }));
        }
      }

      if (incomingReadings.length > 0) {
        setReadings(incomingReadings.sort((a, b) => a.date.localeCompare(b.date)));
        return true;
      }
    } catch (e) {
      console.error('Import JSON failed', e);
    }
    return false;
  }, []);

  // Processed readings
  const processedReadings: ProcessedReading[] = useMemo(() => {
    return processReadings(readings);
  }, [readings]);

  // Export to Excel (.xlsx)
  const exportToExcelFile = useCallback(() => {
    exportToExcel(processedReadings, settings);
  }, [processedReadings, settings]);

  // Import from Excel / CSV intelligently
  const importFromExcelFile = useCallback(async (file: File): Promise<ImportResult> => {
    const result = await parseExcelFile(file);
    if (result.success && result.imported.length > 0) {
      // Merge with existing or replace duplicates by date
      setReadings((prev) => {
        const map = new Map<string, MeterReading>();
        // Add current
        for (const item of prev) map.set(item.date, item);
        // Overwrite / add imported
        for (const item of result.imported) map.set(item.date, item);
        return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
      });
    }
    return result;
  }, []);

  // Daily series (for charts)
  const dailySeries: DailyDataPoint[] = useMemo(() => {
    return generateDailySeries(processedReadings, settings.interpolateSkippedDays);
  }, [processedReadings, settings.interpolateSkippedDays]);

  // Overall summary
  const totalSummary: PeriodSummary = useMemo(() => {
    return calculateSummary(dailySeries);
  }, [dailySeries]);

  // Most recent reading & delta
  const latestProcessed = useMemo(() => {
    if (processedReadings.length === 0) return null;
    return processedReadings[processedReadings.length - 1];
  }, [processedReadings]);

  // Dynamic grouping by billing cycle / month (descending: newest first)
  const availableMonths = useMemo(() => {
    const map = new Map<string, DailyDataPoint[]>();
    for (const p of dailySeries) {
      const periodInfo = getBillingPeriodInfo(p.date, settings.billingCutoffDay);
      const mKey = periodInfo.key;
      if (!map.has(mKey)) map.set(mKey, []);
      map.get(mKey)!.push(p);
    }
    const keys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    return keys.map((key) => {
      const points = map.get(key)!;
      const sampleDate = points[points.length - 1].date;
      const periodInfo = getBillingPeriodInfo(sampleDate, settings.billingCutoffDay);
      return {
        key,
        name: periodInfo.name,
        label: periodInfo.label,
        summary: calculateSummary(points),
        points,
        periodInfo,
      };
    });
  }, [dailySeries, settings.billingCutoffDay]);

  // Active month (most recent in data, or current calendar month if no data yet)
  const activeMonthData = useMemo(() => {
    if (availableMonths.length === 0) return null;
    return availableMonths[0];
  }, [availableMonths]);

  const activeMonthSummary: PeriodSummary = useMemo(() => {
    return activeMonthData ? activeMonthData.summary : calculateSummary([]);
  }, [activeMonthData]);

  const activeMonthName = useMemo(() => {
    if (activeMonthData) return activeMonthData.name;
    const now = new Date();
    const currentCalMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return getMonthName(currentCalMonth);
  }, [activeMonthData]);

  // Backward compatible summaries for October & September
  const octoberSummary: PeriodSummary = useMemo(() => {
    const oct = availableMonths.find((m) => m.key === '2026-10');
    return oct ? oct.summary : activeMonthSummary;
  }, [availableMonths, activeMonthSummary]);

  const septemberSummary: PeriodSummary = useMemo(() => {
    const sep = availableMonths.find((m) => m.key === '2026-09');
    if (sep) return sep.summary;
    if (availableMonths.length >= 2) return availableMonths[1].summary;
    return calculateSummary([]);
  }, [availableMonths]);

  // Month Projection for active period
  const currentProjection = useMemo(() => {
    if (!activeMonthData || activeMonthData.points.length === 0) return null;

    const latestPoint = activeMonthData.points[activeMonthData.points.length - 1];
    const periodInfo = activeMonthData.periodInfo || getBillingPeriodInfo(latestPoint.date, settings.billingCutoffDay);
    const daysTotal = periodInfo.totalDays;

    // Determine days elapsed from cycle startDate to latest point in this cycle
    const latestDate = latestPoint.date;
    const [ly, lm, ld] = latestDate.split('-').map(Number);
    const [sy, sm, sd] = periodInfo.startDate.split('-').map(Number);
    const latestD = new Date(ly, lm - 1, ld);
    const startD = new Date(sy, sm - 1, sd);
    const diffTime = latestD.getTime() - startD.getTime();
    const daysElapsedFromStart = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const daysElapsed = Math.min(daysTotal, Math.max(activeMonthData.points.length, daysElapsedFromStart));
    const currentKwh = activeMonthData.summary.totalKwh;
    const dailyAvg = daysElapsed > 0 ? currentKwh / daysElapsed : 0;
    const daysRemaining = Math.max(0, daysTotal - daysElapsed);
    const projectedTotal = currentKwh + dailyAvg * daysRemaining;
    const projectedCost = projectedTotal * settings.tariffPerKwh;
    const currentCost = currentKwh * settings.tariffPerKwh;

    const monthlyTarget = settings.monthlyTargetKwh;
    const nature = settings.targetNature;

    let targetDiff = 0;
    let targetPercent = 0;
    let remainingBudgetKwh = 0;
    let recommendedDailyAllowance = 0;
    let status: 'onTrack' | 'warning' | 'critical' = 'onTrack';

    if (monthlyTarget && monthlyTarget > 0) {
      targetDiff = Number((projectedTotal - monthlyTarget).toFixed(2));
      targetPercent = Math.min(200, Math.round((currentKwh / monthlyTarget) * 100));
      remainingBudgetKwh = Number((monthlyTarget - currentKwh).toFixed(2));
      recommendedDailyAllowance =
        daysRemaining > 0 && remainingBudgetKwh > 0
          ? Number((remainingBudgetKwh / daysRemaining).toFixed(2))
          : 0;

      if (nature === 'ceiling') {
        if (projectedTotal <= monthlyTarget) {
          status = 'onTrack';
        } else if (projectedTotal <= monthlyTarget * 1.05) {
          status = 'warning';
        } else {
          status = 'critical';
        }
      } else if (nature === 'floor') {
        if (projectedTotal >= monthlyTarget) {
          status = 'onTrack';
        } else if (projectedTotal >= monthlyTarget * 0.95) {
          status = 'warning';
        } else {
          status = 'critical';
        }
      } else {
        const absDiff = Math.abs(targetDiff);
        if (absDiff <= monthlyTarget * 0.03) {
          status = 'onTrack';
        } else if (absDiff <= monthlyTarget * 0.08) {
          status = 'warning';
        } else {
          status = 'critical';
        }
      }
    }

    return {
      monthKey: activeMonthData.key,
      monthName: activeMonthData.name,
      daysElapsed,
      daysTotal,
      daysRemaining,
      currentKwh: Number(currentKwh.toFixed(2)),
      dailyAvg: Number(dailyAvg.toFixed(2)),
      projectedTotal: Number(projectedTotal.toFixed(2)),
      currentCost: Math.round(currentCost),
      projectedCost: Math.round(projectedCost),
      monthlyTarget,
      targetNature: nature,
      targetDiff,
      targetPercent,
      remainingBudgetKwh,
      recommendedDailyAllowance,
      status,
    };
  }, [activeMonthData, settings.tariffPerKwh, settings.monthlyTargetKwh, settings.targetNature, settings.billingCutoffDay]);

  // Weekday distribution
  const weekdayStats: WeekdayStats[] = useMemo(() => {
    return calculateWeekdayDistribution(dailySeries);
  }, [dailySeries]);

  return {
    readings,
    settings,
    processedReadings,
    dailySeries,
    latestProcessed,
    availableMonths,
    activeMonthName,
    activeMonthSummary,
    currentProjection,
    octoberProjection: currentProjection,
    totalSummary,
    octoberSummary,
    septemberSummary,
    weekdayStats,
    addReading,
    updateReading,
    deleteReading,
    updateSettings,
    resetToDefault,
    exportToJson,
    exportToExcelFile,
    importFromJson,
    importFromExcelFile,
  };
}
