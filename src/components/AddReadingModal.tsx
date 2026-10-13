import { useState, useEffect } from 'react';
import { X, Check, Zap, Clock, Calendar } from 'lucide-react';
import type { MeterReading, ProcessedReading, AppSettings } from '../types';

interface AddReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { date: string; value: number; time?: string; note?: string }) => void;
  initialReading?: MeterReading | null;
  latestProcessed: ProcessedReading | null;
  settings: AppSettings;
}

export const AddReadingModal: React.FC<AddReadingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialReading,
  latestProcessed,
  settings,
}) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [valueStr, setValueStr] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize form when opened
  useEffect(() => {
    if (!isOpen) return;

    if (initialReading) {
      // Edit mode
      setDate(initialReading.date);
      setTime(initialReading.time || '');
      setValueStr(initialReading.value.toString());
      setNote(initialReading.note || '');
    } else {
      // Create mode: Next sequential date or today
      if (latestProcessed) {
        const lastD = new Date(latestProcessed.date + 'T00:00:00');
        lastD.setDate(lastD.getDate() + 1);
        const y = lastD.getFullYear();
        const m = String(lastD.getMonth() + 1).padStart(2, '0');
        const d = String(lastD.getDate()).padStart(2, '0');
        setDate(`${y}-${m}-${d}`);
      } else {
        setDate(new Date().toISOString().slice(0, 10));
      }

      // Current time HH:mm
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setTime(`${hh}:${mm}`);

      setValueStr('');
      setNote('');
    }
    setError(null);
  }, [isOpen, initialReading, latestProcessed]);

  if (!isOpen) return null;

  const numValue = parseFloat(valueStr);
  const isValidNum = !isNaN(numValue) && numValue > 0;

  // Real-time delta comparison
  let deltaPreview: number | null = null;
  let estimatedCost: number | null = null;

  if (isValidNum && latestProcessed && !initialReading) {
    deltaPreview = Number((numValue - latestProcessed.value).toFixed(2));
    estimatedCost = Math.round(deltaPreview * settings.tariffPerKwh);
  }

  const handleAdjustValue = (amount: number) => {
    const base = isValidNum ? numValue : latestProcessed ? latestProcessed.value : 0;
    const newVal = Math.max(0, Number((base + amount).toFixed(2)));
    setValueStr(newVal.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError('Selecciona una fecha');
      return;
    }
    if (!isValidNum) {
      setError('Ingresa una lectura válida en kWh');
      return;
    }
    if (latestProcessed && !initialReading && date >= latestProcessed.date && numValue < latestProcessed.value) {
      setError(`La lectura (${numValue}) es menor que la anterior (${latestProcessed.value})`);
      return;
    }

    onSave({
      date,
      value: numValue,
      time: time.trim() || undefined,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Zap size={18} strokeWidth={2.4} />
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">
              {initialReading ? 'Editar Lectura' : 'Nueva Lectura'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Numeric Input */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-700/60 text-center">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Lectura del Contador
            </label>

            <div className="flex items-center justify-center gap-2">
              <input
                type="number"
                step="0.01"
                placeholder={latestProcessed ? (latestProcessed.value + 4.5).toFixed(2) : '0.00'}
                value={valueStr}
                onChange={(e) => setValueStr(e.target.value)}
                autoFocus
                className="w-full text-center text-3xl sm:text-4xl font-extrabold tracking-tight bg-transparent text-slate-900 dark:text-slate-50 focus:outline-none"
              />
              <span className="text-base font-bold text-slate-400">kWh</span>
            </div>

            {/* Quick Adjust Steppers */}
            <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/40">
              <button
                type="button"
                onClick={() => handleAdjustValue(0.1)}
                className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors"
              >
                +0.1
              </button>
              <button
                type="button"
                onClick={() => handleAdjustValue(1.0)}
                className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors"
              >
                +1.0
              </button>
              <button
                type="button"
                onClick={() => handleAdjustValue(5.0)}
                className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors"
              >
                +5.0
              </button>
            </div>

            {/* Live Delta Preview */}
            {deltaPreview !== null && (
              <div className="mt-3 text-xs flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                <span>
                  Consumo:{' '}
                  <strong className={deltaPreview > settings.dailyTargetKwh ? 'text-amber-500' : 'text-emerald-500'}>
                    +{deltaPreview.toFixed(2)} kWh
                  </strong>
                </span>
                {estimatedCost !== null && estimatedCost > 0 && (
                  <span>
                    • Est: <strong>{settings.currency} {estimatedCost.toLocaleString()}</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Fecha
              </label>
              <div className="flex items-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 px-3 py-2.5">
                <Calendar size={16} className="text-slate-400 mr-2 shrink-0" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Horario (opcional)
              </label>
              <div className="flex items-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 px-3 py-2.5">
                <Clock size={16} className="text-slate-400 mr-2 shrink-0" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Notes field */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Nota (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Aire acondicionado toda la noche"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          {/* Error notice */}
          {error && (
            <div className="text-xs text-rose-500 font-semibold px-2">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
          >
            <Check size={18} strokeWidth={2.5} />
            <span>Guardar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
