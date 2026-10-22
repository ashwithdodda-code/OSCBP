import React from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { AlgorithmConfig, AlgorithmType, Process, ScheduleResult } from '../types/scheduler';
import { ALGORITHM_DESCRIPTIONS, ALGORITHM_NAMES } from '../algorithms/schedulerEngine';
import { ProcessTable } from '../components/ProcessTable';
import { TabKey } from '../components/Sidebar';

interface SchedulerLabPageProps {
  processes: Process[];
  config: AlgorithmConfig;
  result: ScheduleResult;
  onChangeProcesses: (procs: Process[]) => void;
  onChangeConfig: (config: AlgorithmConfig) => void;
  onResetDemo: () => void;
  onNavigateTab: (tab: TabKey) => void;
}

export const SchedulerLabPage: React.FC<SchedulerLabPageProps> = ({
  processes,
  config,
  result,
  onChangeProcesses,
  onChangeConfig,
  onResetDemo,
  onNavigateTab,
}) => {
  const algorithms: { id: AlgorithmType; label: string; preemptive: boolean }[] = [
    { id: 'FCFS', label: 'FCFS', preemptive: false },
    { id: 'SJF', label: 'SJF (Non-Preemptive)', preemptive: false },
    { id: 'SRTF', label: 'SRTF (Preemptive SJF)', preemptive: true },
    { id: 'RR', label: 'Round Robin', preemptive: true },
    { id: 'PRIORITY_NP', label: 'Priority (Non-Preemptive)', preemptive: false },
    { id: 'PRIORITY_P', label: 'Priority (Preemptive)', preemptive: true },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-indigo-400" />
            Scheduler Laboratory & Configurator
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure algorithm parameters, inject context switch overhead, and manipulate process workloads
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('gantt')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95 shrink-0"
        >
          <span>Open Gantt Simulator</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Algorithm Selection Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {algorithms.map((alg) => {
          const isSelected = config.algorithm === alg.id;
          return (
            <div
              key={alg.id}
              onClick={() => onChangeConfig({ ...config, algorithm: alg.id })}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/15 ring-1 ring-indigo-500/50'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-sm text-white">{alg.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider border shrink-0 ${
                    alg.preemptive
                      ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {alg.preemptive ? 'Preemptive' : 'Non-Preempt'}
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">
                {ALGORITHM_DESCRIPTIONS[alg.id]}
              </p>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
                <span className={isSelected ? 'text-indigo-400 font-semibold' : 'text-slate-500'}>
                  {isSelected ? '● Selected Algorithm' : 'Click to select'}
                </span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Execution Parameter Controls (Quantum & Context Switch Cost) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Round Robin Time Quantum Slider */}
        <div className={`p-5 rounded-2xl border bg-slate-900/80 transition ${
          config.algorithm === 'RR'
            ? 'border-indigo-500/50 ring-1 ring-indigo-500/20'
            : 'border-slate-800 opacity-60'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-sm font-bold text-white flex items-center gap-2">
                Round Robin Time Quantum (q)
                {config.algorithm !== 'RR' && (
                  <span className="text-[10px] text-slate-500 font-normal">
                    (Applies when RR is active)
                  </span>
                )}
              </span>
              <p className="text-xs text-slate-400">
                Max continuous timeslice before timer preemption
              </p>
            </div>
            <span className="text-lg font-extrabold font-mono text-indigo-300 px-3 py-1 bg-slate-950 rounded-xl border border-indigo-500/30">
              {config.timeQuantum} units
            </span>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <input
              type="range"
              min="1"
              max="15"
              step="1"
              value={config.timeQuantum}
              disabled={config.algorithm !== 'RR'}
              onChange={(e) =>
                onChangeConfig({ ...config, timeQuantum: Number(e.target.value) })
              }
              className="w-full accent-indigo-500 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex items-center gap-1 font-mono text-xs text-slate-400 shrink-0">
              <span>q = {config.timeQuantum}</span>
            </div>
          </div>
        </div>

        {/* Context Switch Overhead Slider */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-sm font-bold text-white flex items-center gap-2">
                Context Switch Overhead Cost (CS)
                <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-800">
                  Default: 0
                </span>
              </span>
              <p className="text-xs text-slate-400">
                Explicit CPU cycles consumed preserving PCB state on process switch
              </p>
            </div>
            <span className="text-lg font-extrabold font-mono text-rose-300 px-3 py-1 bg-slate-950 rounded-xl border border-rose-500/30">
              {config.contextSwitchCost} units
            </span>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={config.contextSwitchCost}
              onChange={(e) =>
                onChangeConfig({ ...config, contextSwitchCost: Number(e.target.value) })
              }
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="flex items-center gap-1 font-mono text-xs text-slate-400 shrink-0">
              <span>CS = {config.contextSwitchCost}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Editable Process Table */}
      <ProcessTable
        processes={processes}
        onChangeProcesses={onChangeProcesses}
        onResetDemo={onResetDemo}
      />

      {/* Real Calculated Process Metrics Table */}
      <div className="flex flex-col gap-4 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Calculated Performance Metrics Table
              <span className="text-xs font-mono text-indigo-400">({config.algorithm})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Formulas: TAT = CT - AT • WT = TAT - BT • RT = First Start - AT
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">PID</th>
                <th className="py-3 px-4">Arrival (AT)</th>
                <th className="py-3 px-4">Burst (BT)</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4 text-indigo-300">Completion (CT)</th>
                <th className="py-3 px-4 text-violet-300">Turnaround (TAT)</th>
                <th className="py-3 px-4 text-cyan-300">Waiting (WT)</th>
                <th className="py-3 px-4 text-emerald-300">Response (RT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {result.metrics.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-slate-500 font-sans">
                    No metrics available.
                  </td>
                </tr>
              ) : (
                result.metrics.map((m) => (
                  <tr key={m.processId} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2 font-sans">
                      <span
                        style={{ backgroundColor: m.color }}
                        className="w-2.5 h-2.5 rounded-full"
                      />
                      <span>{m.processId}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{m.arrivalTime}</td>
                    <td className="py-3 px-4 text-slate-300">{m.burstTime}</td>
                    <td className="py-3 px-4 text-slate-400">{m.priority}</td>
                    <td className="py-3 px-4 text-indigo-300 font-bold">{m.completionTime}</td>
                    <td className="py-3 px-4 text-violet-300 font-bold">{m.turnaroundTime}</td>
                    <td className="py-3 px-4 text-cyan-300 font-bold">{m.waitingTime}</td>
                    <td className="py-3 px-4 text-emerald-300 font-bold">{m.responseTime}</td>
                  </tr>
                ))
              )}
            </tbody>
            {result.metrics.length > 0 && (
              <tfoot className="bg-slate-900/90 font-bold border-t border-slate-700 text-slate-200">
                <tr>
                  <td colSpan={4} className="py-3 px-4 uppercase text-slate-400 font-sans text-[11px]">
                    Workload Averages:
                  </td>
                  <td className="py-3 px-4 text-slate-400">-</td>
                  <td className="py-3 px-4 text-violet-300">{result.avgTurnaroundTime}</td>
                  <td className="py-3 px-4 text-cyan-300">{result.avgWaitingTime}</td>
                  <td className="py-3 px-4 text-emerald-300">{result.avgResponseTime}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
