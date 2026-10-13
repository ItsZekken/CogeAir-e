import * as XLSX from 'xlsx';
import type { MeterReading, ProcessedReading, AppSettings } from '../types';
import { getDayOfWeekName } from './calculations';

export function exportToExcel(
  processedReadings: ProcessedReading[],
  settings: AppSettings
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Lecturas detalladas
  const headers = [
    'Fecha',
    'Día',
    'Día Semana',
    'Horario',
    'Lectura (kWh)',
    'Consumo Diario (kWh)',
    `Costo Est. (${settings.currency})`,
    'Notas',
  ];

  const rows = processedReadings.map((r) => {
    const cost = r.delta > 0 ? Math.round(r.delta * settings.tariffPerKwh) : 0;
    const dayNum = parseInt(r.date.slice(8), 10);
    return [
      r.date,
      dayNum,
      getDayOfWeekName(r.date),
      r.time || '',
      r.value,
      r.delta > 0 ? r.delta : 0,
      cost,
      r.note || '',
    ];
  });

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-width columns
  ws['!cols'] = [
    { wch: 12 },
    { wch: 6 },
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
    { wch: 22 },
    { wch: 16 },
    { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Lecturas');

  // Trigger download
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `seguimiento-luz-${dateStr}.xlsx`);
}

export interface ImportResult {
  success: boolean;
  imported: MeterReading[];
  message: string;
  count: number;
}

export async function parseExcelFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve({ success: false, imported: [], message: 'El archivo Excel no contiene hojas', count: 0 });
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (rawRows.length < 2) {
          resolve({ success: false, imported: [], message: 'El archivo no contiene filas suficientes', count: 0 });
          return;
        }

        // 1. Detect header row by scanning first 5 rows
        let headerRowIdx = -1;
        let colDate = -1;
        let colReading = -1;
        let colTime = -1;
        let colNote = -1;

        for (let r = 0; r < Math.min(5, rawRows.length); r++) {
          const row = rawRows[r].map((cell) => String(cell || '').trim().toLowerCase());
          const dateIdx = row.findIndex((c) => /^(dia|día|fecha|date|day|fec)$/i.test(c) || /dia|fecha/.test(c));
          const readingIdx = row.findIndex((c) => /^(lectura|kwh|contador|reading|valor|medidor)$/i.test(c) || /lectura|kwh|contador/.test(c));

          if (dateIdx !== -1 && readingIdx !== -1) {
            headerRowIdx = r;
            colDate = dateIdx;
            colReading = readingIdx;
            colTime = row.findIndex((c) => /^(horario|hora|time|hour)$/i.test(c) || /hora/.test(c));
            colNote = row.findIndex((c) => /^(nota|notas|obs|observaciones|note)$/i.test(c));
            break;
          }
        }

        if (headerRowIdx === -1 || colDate === -1 || colReading === -1) {
          // Fallback: assume column 0 is Date/Day, column 1 is Time, column 2 is Reading (like the user's table)
          colDate = 0;
          colReading = rawRows[0].length >= 3 ? 2 : 1;
          colTime = rawRows[0].length >= 3 ? 1 : -1;
          headerRowIdx = 0;
        }

        const parsedReadings: MeterReading[] = [];
        let currentYear = 2026;
        let currentMonth = 9; // Default starting month: September (based on day 21)
        let lastDayNum = -1;

        for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const dateRaw = row[colDate];
          const readingRaw = row[colReading];
          const timeRaw = colTime !== -1 ? String(row[colTime] || '').trim() : '';
          const noteRaw = colNote !== -1 ? String(row[colNote] || '').trim() : '';

          // Parse reading value
          if (readingRaw === undefined || readingRaw === null || readingRaw === '') {
            continue; // Skip empty readings like Day 29 or Day 10
          }

          let valueNum = NaN;
          if (typeof readingRaw === 'number') {
            valueNum = readingRaw;
          } else {
            const cleaned = String(readingRaw).replace(',', '.').replace(/[^0-9.]/g, '');
            valueNum = parseFloat(cleaned);
          }

          if (isNaN(valueNum) || valueNum <= 0) continue;

          // Parse date
          let finalDateStr = '';

          if (dateRaw instanceof Date && !isNaN(dateRaw.getTime())) {
            const y = dateRaw.getFullYear();
            const m = String(dateRaw.getMonth() + 1).padStart(2, '0');
            const d = String(dateRaw.getDate()).padStart(2, '0');
            finalDateStr = `${y}-${m}-${d}`;
          } else if (typeof dateRaw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw.trim())) {
            finalDateStr = dateRaw.trim();
          } else if (typeof dateRaw === 'string' && /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(dateRaw.trim())) {
            const parts = dateRaw.trim().split(/[\/\-\.]/);
            const d = String(parseInt(parts[0], 10)).padStart(2, '0');
            const m = String(parseInt(parts[1], 10)).padStart(2, '0');
            let y = parts[2];
            if (y.length === 2) y = '20' + y;
            finalDateStr = `${y}-${m}-${d}`;
          } else {
            // Likely just day number (e.g. 21, 22, 23, ..., 1, 2, ...)
            const dayNum = parseInt(String(dateRaw).replace(/[^0-9]/g, ''), 10);
            if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
              if (lastDayNum !== -1 && dayNum < lastDayNum) {
                // Rollover month! (e.g. 30 -> 1)
                currentMonth += 1;
                if (currentMonth > 12) {
                  currentMonth = 1;
                  currentYear += 1;
                }
              }
              lastDayNum = dayNum;
              const mStr = String(currentMonth).padStart(2, '0');
              const dStr = String(dayNum).padStart(2, '0');
              finalDateStr = `${currentYear}-${mStr}-${dStr}`;
            }
          }

          if (finalDateStr) {
            parsedReadings.push({
              id: `rec-${finalDateStr}-${Math.round(valueNum * 100)}`,
              date: finalDateStr,
              value: Number(valueNum.toFixed(2)),
              time: timeRaw || undefined,
              note: noteRaw || undefined,
            });
          }
        }

        if (parsedReadings.length === 0) {
          resolve({
            success: false,
            imported: [],
            message: 'No se encontraron lecturas válidas en el archivo',
            count: 0,
          });
          return;
        }

        // Deduplicate by date (keep last occurrence)
        const dedupMap = new Map<string, MeterReading>();
        for (const item of parsedReadings) {
          dedupMap.set(item.date, item);
        }
        const sorted = Array.from(dedupMap.values()).sort((a, b) => a.date.localeCompare(b.date));

        resolve({
          success: true,
          imported: sorted,
          message: `Se importaron ${sorted.length} lecturas correctamente`,
          count: sorted.length,
        });
      } catch (err: any) {
        console.error('Error parsing excel file', err);
        resolve({
          success: false,
          imported: [],
          message: `Error al procesar el archivo: ${err?.message || 'Formato no soportado'}`,
          count: 0,
        });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, imported: [], message: 'Error de lectura de archivo', count: 0 });
    };

    reader.readAsArrayBuffer(file);
  });
}
