import { useState } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  RotateCcw,
  Sliders,
  Check,
  Target,
  Smartphone,
  Download,
  Database,
} from 'lucide-react';
import type { AppSettings, TargetNature } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newPartial: Partial<AppSettings>) => void;
  onResetData: () => void;
  isInstallable?: boolean;
  isInstalled?: boolean;
  onPromptInstall?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetData,
  isInstallable = false,
  isInstalled = false,
  onPromptInstall,
}) => {
  const [tariff, setTariff] = useState(settings.tariffPerKwh.toString());
  const [currency, setCurrency] = useState(settings.currency);
  const [dailyTarget, setDailyTarget] = useState(settings.dailyTargetKwh.toString());
  const [monthlyTarget, setMonthlyTarget] = useState(
    settings.monthlyTargetKwh ? settings.monthlyTargetKwh.toString() : '140'
  );
  const [hasMonthlyTarget, setHasMonthlyTarget] = useState(settings.monthlyTargetKwh !== undefined);
  const [targetNature, setTargetNature] = useState<TargetNature>(settings.targetNature || 'ceiling');
  const [billingCutoffDay, setBillingCutoffDay] = useState(
    settings.billingCutoffDay !== undefined ? settings.billingCutoffDay.toString() : ''
  );
  const [savedNotice, setSavedNotice] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleSaveParameters = (e: React.FormEvent) => {
    e.preventDefault();
    const tNum = parseFloat(tariff);
    const dailyTargetNum = parseFloat(dailyTarget);
    const monthlyTargetNum = parseFloat(monthlyTarget);
    const cutoffNum = parseInt(billingCutoffDay, 10);

    onUpdateSettings({
      tariffPerKwh: !isNaN(tNum) && tNum >= 0 ? tNum : settings.tariffPerKwh,
      currency: currency.trim() || '$',
      dailyTargetKwh: !isNaN(dailyTargetNum) && dailyTargetNum > 0 ? dailyTargetNum : settings.dailyTargetKwh,
      monthlyTargetKwh: hasMonthlyTarget && !isNaN(monthlyTargetNum) && monthlyTargetNum > 0 ? monthlyTargetNum : undefined,
      targetNature,
      billingCutoffDay: !isNaN(cutoffNum) && cutoffNum >= 1 && cutoffNum <= 31 ? cutoffNum : undefined,
    });

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-xl mx-auto">
      {/* PWA Mobile Installation Card */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Smartphone size={18} strokeWidth={2.4} />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                Instalación en Móvil
              </span>
              <div className="text-xs text-slate-400">
                Usa la app como aplicación nativa en tu pantalla de inicio
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl">
            <Database size={13} />
            <span>IndexedDB</span>
          </div>
        </div>

        {isInstalled ? (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check size={16} />
            <span>Aplicación instalada en este dispositivo. Funciona 100% offline.</span>
          </div>
        ) : isInstallable && onPromptInstall ? (
          <div className="space-y-2">
            <button
              onClick={onPromptInstall}
              className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Download size={18} strokeWidth={2.5} />
              <span>Instalar en el Móvil</span>
            </button>
            <div className="text-[11px] text-slate-400 text-center">
              Compatible con Android Chrome, Edge y navegadores modernos
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/40">
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              Para instalar en iPhone o Android:
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
              <li><strong>iOS (Safari)</strong>: Toca el icono de Compartir y selecciona <em>"Añadir a pantalla de inicio"</em>.</li>
              <li><strong>Android (Chrome)</strong>: Toca los tres puntos del menú y selecciona <em>"Instalar aplicación"</em>.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Monthly Target & Nature Configuration */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Target size={18} strokeWidth={2.4} />
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">
              Objetivo Mensual
            </span>
            <div className="text-xs text-slate-400">
              Fija una meta de consumo y define su comportamiento
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Toggle enable monthly target */}
          <label className="flex items-center justify-between cursor-pointer py-1">
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Activar objetivo de fin de mes
              </div>
              <div className="text-xs text-slate-400">
                Permite moderar el consumo proyectado hacia una cifra específica
              </div>
            </div>
            <input
              type="checkbox"
              checked={hasMonthlyTarget}
              onChange={(e) => setHasMonthlyTarget(e.target.checked)}
              className="w-5 h-5 rounded-lg accent-sky-500 cursor-pointer"
            />
          </label>

          {hasMonthlyTarget && (
            <>
              {/* Monthly Target Value */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                  Consumo objetivo (kWh/mes)
                </label>
                <div className="flex items-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 px-4 py-2.5">
                  <input
                    type="number"
                    step="1"
                    placeholder="140"
                    value={monthlyTarget}
                    onChange={(e) => setMonthlyTarget(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                  <span className="text-xs font-semibold text-slate-400">kWh</span>
                </div>
              </div>

              {/* Target Nature Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">
                  Naturaleza del objetivo
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetNature('ceiling')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      targetNature === 'ceiling'
                        ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold">Techo</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Minimizar (no superar)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetNature('floor')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      targetNature === 'floor'
                        ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold">Piso</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Maximizar (superar)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetNature('target')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      targetNature === 'target'
                        ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold">Acercarse</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Aproximación exacta</div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* General Parameters Card */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Sliders size={18} strokeWidth={2.4} />
          </div>
          <span className="text-base font-bold text-slate-900 dark:text-slate-100">
            Tarifa y Límites
          </span>
        </div>

        <form onSubmit={handleSaveParameters} className="space-y-4">
          {/* Tariff Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Costo de energía por kWh
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="$"
                className="w-16 text-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 py-2.5 text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <input
                type="number"
                step="1"
                value={tariff}
                onChange={(e) => setTariff(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Daily target limit Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Límite de alerta diario (kWh/día)
            </label>
            <div className="flex items-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 px-4 py-2.5">
              <input
                type="number"
                step="0.1"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <span className="text-xs font-semibold text-slate-400">kWh/d</span>
            </div>
          </div>

          {/* Billing cutoff day Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              Día de corte
            </label>
            <div className="flex items-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 px-4 py-2.5">
              <input
                type="number"
                min="1"
                max="31"
                placeholder="Fin de mes (calendario)"
                value={billingCutoffDay}
                onChange={(e) => setBillingCutoffDay(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <span className="text-xs font-semibold text-slate-400">del mes</span>
            </div>
          </div>

          {/* Interpolation toggle */}
          <div className="pt-2">
            <label className="flex items-center justify-between cursor-pointer py-1">
              <div className="pr-4">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Distribuir días omitidos
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Reparte el consumo acumulado equitativamente en los días sin toma en los gráficos
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.interpolateSkippedDays}
                onChange={(e) => onUpdateSettings({ interpolateSkippedDays: e.target.checked })}
                className="w-5 h-5 rounded-lg accent-sky-500 cursor-pointer"
              />
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-4"
          >
            <Check size={18} strokeWidth={2.5} />
            <span>Guardar Configuración</span>
          </button>

          {savedNotice && (
            <div className="text-xs text-emerald-500 font-semibold text-center mt-2">
              Configuración guardada correctamente
            </div>
          )}
        </form>
      </div>

      {/* Theme Card */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
        <label className="block text-xs font-semibold text-slate-400 uppercase">
          Aspecto
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onUpdateSettings({ theme: 'system' })}
            className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all ${
              settings.theme === 'system'
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            <Laptop size={20} />
            <span className="text-xs">Sistema</span>
          </button>
          <button
            onClick={() => onUpdateSettings({ theme: 'dark' })}
            className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all ${
              settings.theme === 'dark'
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            <Moon size={20} />
            <span className="text-xs">Oscuro</span>
          </button>
          <button
            onClick={() => onUpdateSettings({ theme: 'light' })}
            className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all ${
              settings.theme === 'light'
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            <Sun size={20} />
            <span className="text-xs">Claro</span>
          </button>
        </div>
      </div>

      {/* Reset Data Card */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Vaciar todas las lecturas
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Elimina todas las lecturas almacenadas en IndexedDB para reiniciar desde cero
            </div>
          </div>

          {resetConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onResetData();
                  setResetConfirm(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                Confirmar Borrado
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setResetConfirm(true)}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors"
              title="Vaciar todas las lecturas"
            >
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
