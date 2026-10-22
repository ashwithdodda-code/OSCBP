import React, { useState } from 'react';
import {
  Activity,
  ListOrdered,
  Clock,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Hourglass,
  ArrowRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { AlgorithmConfig, Process, ScheduleResult, SimulationSnapshot } from '../types/scheduler';
import { ALGORITHM_NAMES, ALGORITHM_DESCRIPTIONS } from '../algorithms/schedulerEngine';
import { GanttChart } from '../components/GanttChart';
import { ProcessStateVisualizer } from '../components/ProcessStateVisualizer';

interface GanttSimulatorPageProps {
  processes: Process[];
  config: AlgorithmConfig;
  result: ScheduleResult;
}

export const GanttSimulatorPage: React.FC<GanttSimulatorPageProps> = ({
  processes,
  config,
  result,
}) => {
  const [simulationTime, setSimulationTime] = useState<number>(0);

  // Active snapshot at simulationTime
  const activeSnapshot: SimulationSnapshot | undefined =
    result.snapshots.find((s) => s.time === simulationTime) ||
    result.snapshots[result.snapshots.length - 1];

  const activeProcess = processes.find(
    (p) => p.id === (activeSnapshot ? activeSnapshot.runningProcessId : null)
  );

  // Find next scheduling event time
  const upcomingEvents = result.timeline
    .filter((s) => s.startTime > simulationTime || s.endTime > simulationTime)
    .map((s) => (s.startTime > simulationTime ? s.startTime : s.endTime));
  const nextEventTime = upcomingEvents.length > 0 ? Math.min(...upcomingEvents) : result.totalTime;

  // Generate detailed execution trace events for the log
  const traceEvents = result.timeline.map((seg, idx) => {
    let description = '';
    if (seg.type === 'process') {
      const isStart = seg.startTime === 0 || result.timeline[idx - 1]?.processId !== seg.processId;
      const isFinish = seg.endTime === result.metrics.find((m) => m.processId === seg.processId)?.completionTime;
      description = `Process ${seg.processId} dispatched to CPU for ${seg.duration} unit(s). ${
        isFinish ? `[Process completed at T=${seg.endTime}]` : ''
      }`;
    } else if (seg.type === 'context-switch') {
      description = `Kernel context switch overhead (${seg.duration} unit): saving CPU registers & swapping PCB state.`;
    } else {
      description = `CPU idle (${seg.duration} unit) — ready queue is empty awaiting future arrivals.`;
    }

    return {
      id: seg.id,
      timeSpan: `[T=${seg.startTime} - ${seg.endTime}]`,
      type: seg.type,
      processId: seg.processId,
      description,
      isCurrent: seg.startTime <= simulationTime && simulationTime < seg.endTime,
    };
  });

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-cyan-400" />
            Gantt Simulator & Decision Reasoner
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Frame-by-frame CPU dispatch trace • Step-by-step kernel decision reasoning • Interactive timeline scrub
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-indigo-500/30 text-xs font-semibold text-slate-200">
          <span className="text-slate-400">Selected Algorithm:</span>
          <span className="text-indigo-400 font-bold">{config.algorithm}</span>
        </div>
      </div>

      {/* Primary Gantt Chart with Playback Engine */}
      <GanttChart
        result={result}
        currentTime={simulationTime}
        onTimeChange={setSimulationTime}
        interactivePlayback={true}
      />

      {/* Real-Time Decision Reasoner & Hardware Register Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Step-by-Step Kernel Decision Explanation */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/40 shadow-xl backdrop-blur-md flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Kernel Scheduling Decision at Clock T = {simulationTime}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Explains exactly why this decision was executed under {config.algorithm}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-500/40">
              {config.algorithm} Rule
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            {activeSnapshot?.decisionReason || 'Simulate or scrub the Gantt chart to inspect real-time decisions.'}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Algorithm Logic:</span>
              <span className="text-slate-400 line-clamp-1">{ALGORITHM_DESCRIPTIONS[config.algorithm]}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-cyan-300 text-[11px]">
              <span>Next Event at T = {nextEventTime}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Right 1 Col: CPU Core & Register Inspection */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              CPU Core & PCB Register
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              Core #0 Active
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Clock Tick (T):</span>
              <span className="font-bold text-white text-sm">{simulationTime} / {result.totalTime}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Current Task:</span>
              <span className="font-bold text-indigo-300">
                {activeSnapshot?.isContextSwitch
                  ? 'OS Context Switch'
                  : activeProcess
                  ? `Process ${activeProcess.id}`
                  : 'CPU IDLE'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Ready Queue:</span>
              <span className="text-cyan-300 font-bold">
                {activeSnapshot?.readyQueue.length
                  ? `[${activeSnapshot.readyQueue.join(', ')}]`
                  : 'Empty'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Terminated:</span>
              <span className="text-emerald-300 font-bold">
                {activeSnapshot?.completedProcesses.length} / {processes.length}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">Context Switch Overhead:</span>
              <span className="text-rose-300 font-bold">
                {config.contextSwitchCost}u per switch
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-State Process Machine & Ready Queue Visualizer */}
      <ProcessStateVisualizer
        processes={processes}
        result={result}
        currentTime={simulationTime}
      />

      {/* Step-by-Step Kernel Execution Trace Log */}
      <div className="flex flex-col gap-3 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <ListOrdered className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Kernel Dispatch Event Log (Chronological Trace)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {result.timeline.length} Dispatch Segments
          </span>
        </div>

        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {traceEvents.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No execution trace available.
            </p>
          ) : (
            traceEvents.map((evt) => (
              <div
                key={evt.id}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-mono transition-all ${
                  evt.isCurrent
                    ? 'bg-indigo-950/80 border-indigo-500/60 ring-1 ring-indigo-500/30 text-white'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                      evt.type === 'process'
                        ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-600/40'
                        : evt.type === 'context-switch'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-600/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {evt.timeSpan}
                  </span>
                  <span className="font-sans text-xs">{evt.description}</span>
                </div>

                {evt.isCurrent && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                    Active Cursor
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
