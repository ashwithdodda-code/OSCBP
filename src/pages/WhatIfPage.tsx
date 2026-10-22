import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Check,
  Zap,
  Clock,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AlgorithmConfig, AlgorithmType, Process, ScheduleResult } from '../types/scheduler';
import { runScheduler, ALGORITHM_NAMES } from '../algorithms/schedulerEngine';
import { GanttChart } from '../components/GanttChart';
import { useToast } from '../components/Toast';

interface WhatIfPageProps {
  baselineProcesses: Process[];
  baselineConfig: AlgorithmConfig;
  baselineResult: ScheduleResult;
  onApplyToMaster: (procs: Process[], config: AlgorithmConfig) => void;
}

export const WhatIfPage: React.FC<WhatIfPageProps> = ({
  baselineProcesses,
  baselineConfig,
  baselineResult,
  onApplyToMaster,
}) => {
  const { addToast } = useToast();

  // What-If state controls
  const [whatIfAlgorithm, setWhatIfAlgorithm] = useState<AlgorithmType>(baselineConfig.algorithm);
  const [whatIfQuantum, setWhatIfQuantum] = useState<number>(baselineConfig.timeQuantum);
  const [whatIfCsCost, setWhatIfCsCost] = useState<number>(baselineConfig.contextSwitchCost);
  const [burstScale, setBurstScale] = useState<number>(100); // 50% to 200%
  const [arrivalShift, setArrivalShift] = useState<number>(0); // 0 to 5

  // Compute what-if processes
  const whatIfProcesses = useMemo<Process[]>(() => {
    return baselineProcesses.map((p) => {
      const scaledBurst = Math.max(1, Math.round((p.burstTime * burstScale) / 100));
      const shiftedArrival = Math.max(0, p.arrivalTime + arrivalShift);
      return {
        ...p,
        burstTime: scaledBurst,
        arrivalTime: shiftedArrival,
      };
    });
  }, [baselineProcesses, burstScale, arrivalShift]);

  // Compute what-if simulation results
  const whatIfResult = useMemo<ScheduleResult>(() => {
    return runScheduler(whatIfProcesses, {
      algorithm: whatIfAlgorithm,
      timeQuantum: whatIfQuantum,
      contextSwitchCost: whatIfCsCost,
    });
  }, [whatIfProcesses, whatIfAlgorithm, whatIfQuantum, whatIfCsCost]);

  // Deltas (Negative is good for waiting, turnaround, response, context switches; positive is good for utilization)
  const waitDelta = Number((whatIfResult.avgWaitingTime - baselineResult.avgWaitingTime).toFixed(2));
  const tatDelta = Number((whatIfResult.avgTurnaroundTime - baselineResult.avgTurnaroundTime).toFixed(2));
  const respDelta = Number((whatIfResult.avgResponseTime - baselineResult.avgResponseTime).toFixed(2));
  const cpuDelta = Number((whatIfResult.cpuUtilization - baselineResult.cpuUtilization).toFixed(2));
  const csDelta = whatIfResult.contextSwitchCount - baselineResult.contextSwitchCount;

  const handleApply = () => {
    onApplyToMaster(whatIfProcesses, {
      algorithm: whatIfAlgorithm,
      timeQuantum: whatIfQuantum,
      contextSwitchCost: whatIfCsCost,
    });
    addToast('success', 'Applied to Master', 'Updated master workload and scheduler parameters with What-If scenario.');
  };

  const handleResetToBaseline = () => {
    setWhatIfAlgorithm(baselineConfig.algorithm);
    setWhatIfQuantum(baselineConfig.timeQuantum);
    setWhatIfCsCost(baselineConfig.contextSwitchCost);
    setBurstScale(100);
    setArrivalShift(0);
    addToast('info', 'Reset', 'What-If controls aligned back to baseline parameters.');
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <SlidersHorizontal className="w-6 h-6 text-cyan-400" />
            What-If Sensitivity & Trade-Off Analyzer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time sensitivity analysis • Dynamically stress-test parameters and evaluate performance impact
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToBaseline}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Baseline</span>
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/30 transition active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply What-If to Lab</span>
          </button>
        </div>
      </div>

      {/* Interactive Sliders Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-md">
        {/* Algorithm Picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-300">What-If Algorithm</label>
          <select
            value={whatIfAlgorithm}
            onChange={(e) => setWhatIfAlgorithm(e.target.value as AlgorithmType)}
            className="h-9 px-2 text-xs font-semibold bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {(Object.keys(ALGORITHM_NAMES) as AlgorithmType[]).map((key) => (
              <option key={key} value={key} className="bg-slate-900 text-white">
                {key}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-500">
            Baseline: {baselineConfig.algorithm}
          </span>
        </div>

        {/* Time Quantum Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Time Quantum (q)</span>
            <span className="font-mono text-indigo-400">{whatIfQuantum}u</span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            value={whatIfQuantum}
            onChange={(e) => setWhatIfQuantum(Number(e.target.value))}
            className="accent-indigo-500 cursor-pointer mt-2"
          />
          <span className="text-[10px] text-slate-500">
            Baseline: {baselineConfig.timeQuantum}u
          </span>
        </div>

        {/* Context Switch Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>CS Overhead</span>
            <span className="font-mono text-rose-400">{whatIfCsCost}u</span>
          </div>
          <input
            type="range"
            min="0"
            max="4"
            value={whatIfCsCost}
            onChange={(e) => setWhatIfCsCost(Number(e.target.value))}
            className="accent-rose-500 cursor-pointer mt-2"
          />
          <span className="text-[10px] text-slate-500">
            Baseline: {baselineConfig.contextSwitchCost}u
          </span>
        </div>

        {/* Burst Scale Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Burst Scale</span>
            <span className="font-mono text-amber-400">{burstScale}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="200"
            step="10"
            value={burstScale}
            onChange={(e) => setBurstScale(Number(e.target.value))}
            className="accent-amber-500 cursor-pointer mt-2"
          />
          <span className="text-[10px] text-slate-500">
            Workload scaling factor
          </span>
        </div>

        {/* Arrival Shift Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Arrival Delay</span>
            <span className="font-mono text-cyan-400">+{arrivalShift}u</span>
          </div>
          <input
            type="range"
            min="0"
            max="6"
            value={arrivalShift}
            onChange={(e) => setArrivalShift(Number(e.target.value))}
            className="accent-cyan-500 cursor-pointer mt-2"
          />
          <span className="text-[10px] text-slate-500">
            Stagger arrival times
          </span>
        </div>
      </div>

      {/* Delta Metric Comparison Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Waiting Time Delta */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">Avg Waiting Time</span>
          <div className="mt-2 flex flex-col">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-500">Baseline: {baselineResult.avgWaitingTime}</span>
              <span className="text-lg font-bold font-mono text-white">{whatIfResult.avgWaitingTime}</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              {waitDelta < 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {waitDelta}u (Faster)
                </span>
              ) : waitDelta > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30 font-mono">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +{waitDelta}u (Slower)
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-mono">No change (0.00)</span>
              )}
            </div>
          </div>
        </div>

        {/* Turnaround Time Delta */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">Avg Turnaround</span>
          <div className="mt-2 flex flex-col">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-500">Baseline: {baselineResult.avgTurnaroundTime}</span>
              <span className="text-lg font-bold font-mono text-white">{whatIfResult.avgTurnaroundTime}</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              {tatDelta < 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {tatDelta}u (Faster)
                </span>
              ) : tatDelta > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30 font-mono">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +{tatDelta}u (Slower)
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-mono">No change (0.00)</span>
              )}
            </div>
          </div>
        </div>

        {/* Response Time Delta */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">Avg Response Time</span>
          <div className="mt-2 flex flex-col">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-500">Baseline: {baselineResult.avgResponseTime}</span>
              <span className="text-lg font-bold font-mono text-white">{whatIfResult.avgResponseTime}</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              {respDelta < 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {respDelta}u (Quicker)
                </span>
              ) : respDelta > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30 font-mono">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +{respDelta}u (Delayed)
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-mono">No change (0.00)</span>
              )}
            </div>
          </div>
        </div>

        {/* CPU Utilization Delta */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">CPU Utilization</span>
          <div className="mt-2 flex flex-col">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-500">Baseline: {baselineResult.cpuUtilization}%</span>
              <span className="text-lg font-bold font-mono text-white">{whatIfResult.cpuUtilization}%</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              {cpuDelta > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +{cpuDelta}%
                </span>
              ) : cpuDelta < 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30 font-mono">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {cpuDelta}%
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-mono">No change (0%)</span>
              )}
            </div>
          </div>
        </div>

        {/* Context Switches Delta */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400">Context Switches</span>
          <div className="mt-2 flex flex-col">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-500">Baseline: {baselineResult.contextSwitchCount}</span>
              <span className="text-lg font-bold font-mono text-white">{whatIfResult.contextSwitchCount}</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              {csDelta < 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                  {csDelta} (Fewer switches)
                </span>
              ) : csDelta > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30 font-mono">
                  +{csDelta} (More switches)
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-mono">Identical</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dual Gantt Timelines (Baseline vs What-If) */}
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              1. Current Baseline Timeline ({baselineConfig.algorithm})
            </span>
          </div>
          <GanttChart result={baselineResult} interactivePlayback={false} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              2. Simulated What-If Timeline ({whatIfAlgorithm})
            </span>
          </div>
          <GanttChart result={whatIfResult} interactivePlayback={false} />
        </div>
      </div>
    </div>
  );
};
