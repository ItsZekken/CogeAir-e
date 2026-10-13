import { useState } from 'react';
import { useMeterData } from './hooks/useMeterData';
import { usePWAInstall } from './hooks/usePWAInstall';
import { Navigation, type TabType } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { FloatingActionButton } from './components/FloatingActionButton';
import { AddReadingModal } from './components/AddReadingModal';
import type { MeterReading } from './types';

export function App() {
  const {
    settings,
    processedReadings,
    dailySeries,
    latestProcessed,
    availableMonths,
    activeMonthName,
    activeMonthSummary,
    totalSummary,
    octoberSummary,
    septemberSummary,
    octoberProjection,
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
  } = useMeterData();

  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [readingToEdit, setReadingToEdit] = useState<MeterReading | null>(null);

  const handleOpenAdd = () => {
    setReadingToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditReading = (reading: MeterReading) => {
    setReadingToEdit(reading);
    setIsModalOpen(true);
  };

  const handleSaveReading = (data: { date: string; value: number; time?: string; note?: string }) => {
    if (readingToEdit) {
      updateReading(readingToEdit.id, data);
    } else {
      addReading(data);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 selection:bg-sky-500/20">
      {/* Top App Bar (Desktop and Mobile header) */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        latestValue={latestProcessed?.value}
      />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            processedReadings={processedReadings}
            dailySeries={dailySeries}
            latestProcessed={latestProcessed}
            settings={settings}
            availableMonths={availableMonths}
            activeMonthName={activeMonthName}
            activeMonthSummary={activeMonthSummary}
            octoberSummary={octoberSummary}
            septemberSummary={septemberSummary}
            totalSummary={totalSummary}
            octoberProjection={octoberProjection}
            weekdayStats={weekdayStats}
            onOpenAdd={handleOpenAdd}
          />
        )}

        {currentTab === 'history' && (
          <HistoryView
            processedReadings={processedReadings}
            settings={settings}
            onEditReading={handleEditReading}
            onDeleteReading={deleteReading}
            onExportExcel={exportToExcelFile}
            onExportJson={exportToJson}
            onImportJson={importFromJson}
            onImportExcel={importFromExcelFile}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={updateSettings}
            onResetData={resetToDefault}
            isInstallable={isInstallable}
            isInstalled={isInstalled}
            onPromptInstall={promptInstall}
          />
        )}
      </main>

      {/* Material FAB */}
      <FloatingActionButton onClick={handleOpenAdd} />

      {/* Quick Add / Edit Bottom Sheet Modal */}
      <AddReadingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setReadingToEdit(null);
        }}
        onSave={handleSaveReading}
        initialReading={readingToEdit}
        latestProcessed={latestProcessed}
        settings={settings}
      />
    </div>
  );
}

export default App;
