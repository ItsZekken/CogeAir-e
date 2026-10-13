import { useState, useRef } from 'react';
import {
  Upload,
  Trash2,
  Edit2,
  Clock,
  FileSpreadsheet,
  FileCode,
  Check,
  AlertCircle,
} from 'lucide-react';
import type { ProcessedReading, AppSettings, MeterReading } from '../types';
import { getDayOfWeekName } from '../utils/calculations';

interface HistoryViewProps {
  processedReadings: ProcessedReading[];
  settings: AppSettings;
  onEditReading: (reading: MeterReading) => void;
  onDeleteReading: (id: string) => void;
  onExportExcel: () => void;
  onExportJson: () => void;
  onImportJson: (jsonString: string) => boolean;
  onImportExcel: (file: File) => Promise<{ success: boolean; message: string }>;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  processedReadings,
  settings,
  onEditReading,
  onDeleteReading,
  onExportExcel,
  onExportJson,
  onImportJson,
  onImportExcel,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group readings by Month (descending)
  const reversedReadings = [...processedReadings].reverse();

  const grouped = reversedReadings.reduce((acc, curr) => {
    const monthKey = curr.date.slice(0, 7); // YYYY-MM
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(curr);
    return acc;
  }, {} as Record<string, ProcessedReading[]>);

  const getMonthTitle = (monthKey: string) => {
    const [y, m] = monthKey.split('-');
    const months = [
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
    return `${months[parseInt(m, 10) - 1]} ${y}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const success = onImportJson(content);
        if (success) {
          setImportNotice({ text: 'Copia de seguridad JSON restaurada correctamente' });
        } else {
          setImportNotice({ text: 'Error: El archivo JSON no tiene un formato válido', error: true });
        }
        setTimeout(() => setImportNotice(null), 4000);
      };
      reader.readAsText(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
      const res = await onImportExcel(file);
      setImportNotice({ text: res.message, error: !res.success });
      setTimeout(() => setImportNotice(null), 4000);
    } else {
      setImportNotice({ text: 'Formato no compatible. Sube .xlsx, .csv o .json', error: true });
      setTimeout(() => setImportNotice(null), 4000);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {processedReadings.length} Registros
          </span>
          <span className="text-xs text-slate-400">
            (IndexedDB)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls,.csv,.json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Importar inteligentemente desde Excel o JSON"
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors text-xs font-semibold"
          >
            <Upload size={16} strokeWidth={2.2} />
            <span>Importar</span>
          </button>

          <button
            onClick={onExportExcel}
            title="Exportar a Excel (.xlsx)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors text-xs font-semibold"
          >
            <FileSpreadsheet size={16} strokeWidth={2.2} />
            <span>Excel</span>
          </button>

          <button
            onClick={onExportJson}
            title="Exportar copia de seguridad en JSON (para restaurar)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-semibold"
          >
            <FileCode size={16} strokeWidth={2.2} />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {importNotice && (
        <div
          className={`flex items-center gap-2 text-xs font-semibold p-3.5 rounded-2xl border animate-in fade-in ${
            importNotice.error
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
          }`}
        >
          {importNotice.error ? <AlertCircle size={16} /> : <Check size={16} />}
          <span>{importNotice.text}</span>
        </div>
      )}

      {/* Empty State when no readings */}
      {processedReadings.length === 0 && (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-10 text-center shadow-sm space-y-2">
          <div className="text-base font-bold text-slate-800 dark:text-slate-200">
            No hay lecturas registradas
          </div>
          <div className="text-xs text-slate-400 max-w-sm mx-auto">
            Usa el botón flotante (+) para registrar una nueva lectura o importa un archivo Excel (.xlsx) o JSON.
          </div>
        </div>
      )}

      {/* Grouped Month List */}
      {Object.entries(grouped).map(([monthKey, items]) => (
        <div key={monthKey} className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-bold tracking-tight text-slate-500 dark:text-slate-400 uppercase">
              {getMonthTitle(monthKey)}
            </h3>
            <span className="text-xs text-slate-400">
              {items.length} días
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 shadow-sm">
            {items.map((item) => {
              const dayNum = parseInt(item.date.slice(8), 10);
              const dayName = getDayOfWeekName(item.date);
              const isConfirmingDelete = deleteConfirmId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Left: Date & Time */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">
                        {dayNum}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">
                        {dayName}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                          {item.value.toFixed(2)}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">kWh</span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 truncate">
                        {item.time && (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={11} /> {item.time}
                          </span>
                        )}
                        {item.note && <span className="truncate italic">{item.note}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right: Delta & Actions */}
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <div className="text-right">
                      {item.delta > 0 ? (
                        <>
                          <div className="text-sm font-bold text-sky-600 dark:text-sky-400 flex items-center justify-end gap-0.5">
                            <span>+{item.delta.toFixed(2)}</span>
                            <span className="text-[10px] font-medium text-slate-400">kWh</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {settings.currency} {Math.round(item.delta * settings.tariffPerKwh).toLocaleString('es-CO')}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-slate-400">Base</div>
                      )}

                      {item.isMultiDay && (
                        <div className="text-[10px] text-amber-500 font-medium">
                          {item.daysElapsed}d (Ø {item.dailyAvg.toFixed(2)})
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              onDeleteReading(item.id);
                              setDeleteConfirmId(null);
                            }}
                            className="p-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
                            title="Confirmar eliminación"
                          >
                            Eliminar
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs hover:bg-slate-300"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => onEditReading(item)}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Editar lectura"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Eliminar lectura"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
