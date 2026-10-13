import { LayoutDashboard, History, Settings, Zap } from 'lucide-react';

export type TabType = 'dashboard' | 'history' | 'settings';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  latestValue?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  latestValue,
}) => {
  const tabs = [
    { id: 'dashboard' as TabType, icon: LayoutDashboard },
    { id: 'history' as TabType, icon: History },
    { id: 'settings' as TabType, icon: Settings },
  ];

  return (
    <>
      {/* Desktop Top App Bar */}
      <header className="hidden md:block sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Zap size={22} strokeWidth={2.4} />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Coge Air-e
              </span>
              {latestValue !== undefined && (
                <span className="ml-3 text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wider">
                  {latestValue.toFixed(2)} kWh
                </span>
              )}
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Top Brand Bar */}
      <header className="md:hidden sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Zap size={18} strokeWidth={2.4} />
          </div>
          <span className="text-base font-bold text-slate-900 dark:text-slate-100">
            Coge Air-e
          </span>
        </div>
        {latestValue !== undefined && (
          <div className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {latestValue.toFixed(2)} kWh
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (Material 3 style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-6 py-2">
        <div className="flex items-center justify-around max-w-sm mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className="flex flex-col items-center justify-center py-1 transition-all"
              >
                <div
                  className={`px-5 py-1.5 rounded-full transition-all flex items-center justify-center ${
                    isActive
                      ? 'bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
