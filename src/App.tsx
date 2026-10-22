import React, { useState, useMemo } from 'react';
import { AlgorithmConfig, AlgorithmType, Process, ScheduleResult } from './types/scheduler';
import { runScheduler } from './algorithms/schedulerEngine';
import { PRESET_DEFAULT, PRESETS } from './data/presetData';
import { generateSmartInsights } from './utils/smartInsights';
import { Navbar } from './components/Navbar';
import { Sidebar, TabKey } from './components/Sidebar';
import { ToastProvider, useToast } from './components/Toast';

// Operational Pages
import { DashboardPage } from './pages/DashboardPage';
import { SchedulerLabPage } from './pages/SchedulerLabPage';
import { GanttSimulatorPage } from './pages/GanttSimulatorPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { WhatIfPage } from './pages/WhatIfPage';
import { SmartInsightsPage } from './pages/SmartInsightsPage';

const TAB_TITLES: Record<TabKey, string> = {
  dashboard: 'Executive Dashboard & Analytics',
  lab: 'Scheduler Lab & Workload Workbench',
  gantt: 'Gantt Simulator & Decision Engine',
  comparison: 'Algorithm Benchmark Matrix',
  'what-if': 'What-If Sensitivity Analysis',
  insights: 'OS Diagnostics & Bottleneck Heuristics',
};

const MainApp: React.FC = () => {
  const { addToast } = useToast();

  // Central master workload & configuration state
  const [processes, setProcesses] = useState<Process[]>(PRESET_DEFAULT);
  const [config, setConfig] = useState<AlgorithmConfig>({
    algorithm: 'SRTF',
    timeQuantum: 2,
    contextSwitchCost: 0,
  });
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Single Source of Truth for scheduling calculations
  const result: ScheduleResult = useMemo(() => {
    return runScheduler(processes, config);
  }, [processes, config]);

  // Real-time diagnostics count for sidebar notification badge
  const insightCount = useMemo(() => {
    return generateSmartInsights(processes, config, result).length;
  }, [processes, config, result]);

  const handleSelectAlgorithm = (alg: AlgorithmType) => {
    setConfig((prev) => ({ ...prev, algorithm: alg }));
    addToast('info', 'Algorithm Switched', `Active CPU scheduler algorithm changed to ${alg}.`);
  };

  const handleLoadPreset = (presetId: string) => {
    const found = PRESETS.find((p) => p.id === presetId);
    if (found) {
      setProcesses(found.processes);
      addToast('success', 'Workload Injected', `Loaded "${found.name}" with ${found.processes.length} processes.`);
    }
  };

  const handleResetDemo = () => {
    setProcesses(PRESET_DEFAULT);
    setConfig({
      algorithm: 'SRTF',
      timeQuantum: 2,
      contextSwitchCost: 0,
    });
    addToast('info', 'Workload Reset', 'Restored standard benchmark dataset (P1..P5).');
  };

  const handleApplyWhatIf = (newProcs: Process[], newConfig: AlgorithmConfig) => {
    setProcesses(newProcs);
    setConfig(newConfig);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header Navigation */}
      <Navbar
        algorithm={config.algorithm}
        onSelectAlgorithm={handleSelectAlgorithm}
        onLoadPreset={handleLoadPreset}
        onResetDemo={handleResetDemo}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        activeTabTitle={TAB_TITLES[activeTab]}
      />

      <div className="flex-1 flex w-full">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          insightCount={insightCount}
        />

        {/* Main Operational View */}
        <main className="flex-1 min-w-0 pb-16">
          {activeTab === 'dashboard' && (
            <DashboardPage
              processes={processes}
              config={config}
              result={result}
              onNavigateTab={setActiveTab}
              onSelectAlgorithm={handleSelectAlgorithm}
            />
          )}

          {activeTab === 'lab' && (
            <SchedulerLabPage
              processes={processes}
              config={config}
              result={result}
              onChangeProcesses={setProcesses}
              onChangeConfig={setConfig}
              onResetDemo={handleResetDemo}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'gantt' && (
            <GanttSimulatorPage
              processes={processes}
              config={config}
              result={result}
            />
          )}

          {activeTab === 'comparison' && (
            <ComparisonPage
              processes={processes}
              config={config}
              onSelectAlgorithm={handleSelectAlgorithm}
            />
          )}

          {activeTab === 'what-if' && (
            <WhatIfPage
              baselineProcesses={processes}
              baselineConfig={config}
              baselineResult={result}
              onApplyToMaster={handleApplyWhatIf}
            />
          )}

          {activeTab === 'insights' && (
            <SmartInsightsPage
              processes={processes}
              config={config}
              result={result}
              onNavigateTab={setActiveTab}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
