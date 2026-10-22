import React from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Shield,
  Cpu,
  Hourglass,
} from 'lucide-react';
import { Process, ScheduleResult, SimulationSnapshot } from '../types/scheduler';

interface ProcessStateVisualizerProps {
  processes: Process[];
  result: ScheduleResult;
  currentTime: number;
}

export const ProcessStateVisualizer: React.FC<ProcessStateVisualizerProps> = ({
  processes,
  result,
  currentTime,
}) => {
  // Find current snapshot
  const snapshot: SimulationSnapshot | undefined =
    result.snapshots.find((s) => s.time === currentTime) ||
    result.snapshots[result.snapshots.length - 1];

  const runningProcess = processes.find(
    (p) => p.id === (snapshot ? snapshot.runningProcessId : null)
  );

  const readyPids = snapshot ? snapshot.readyQueue : [];
  const completedPids = snapshot ? snapshot.completedProcesses : [];

  // Group processes by current 5-state lifecycle
  const newProcesses = processes.filter(
    (p) => snapshot?.processStates[p.id] === 'NEW'
  );
  const readyProcesses = processes.filter(
    (p) => snapshot?.processStates[p.id] === 'READY'
  );
  const runningProcesses = processes.filter(
    (p) => snapshot?.processStates[p.id] === 'RUNNING'
  );
  const terminatedProcesses = processes.filter(
    (p) => snapshot?.processStates[p.id] === 'TERMINATED'
  );

  return (
    <div className="flex flex-col gap-5 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      {/* Title & Live Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Process Lifecycle & Ready Queue State
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/40">
                Clock T = {currentTime}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Live kernel state machine tracking • FIFO Ready Queue visualization
            </p>
          </div>
        </div>

        {/* Status of CPU */}
        <div className="flex items-center gap-2">
          {snapshot?.isContextSwitch ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs font-semibold animate-pulse">
              <Hourglass className="w-4 h-4 text-amber-400 animate-spin" />
              <span>OS Kernel Context Switching...</span>
            </div>
          ) : runningProcess ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>CPU Active: Process {runningProcess.id}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-semibold">
              <Cpu className="w-4 h-4 text-slate-500" />
              <span>CPU Idle (No runnable process)</span>
            </div>
          )}
        </div>
      </div>

      {/* 5-State Architecture Pipeline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* NEW State Card */}
        <div className="flex flex-col rounded-xl bg-slate-950/80 border border-slate-800 p-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              NEW (Unarrived)
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-400">
              {newProcesses.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 min-h-[44px]">
            {newProcesses.length === 0 ? (
              <span className="text-[11px] text-slate-600 italic py-1">No pending arrivals</span>
            ) : (
              newProcesses.map((p) => (
                <div
                  key={p.id}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono border text-slate-300 bg-slate-900 border-slate-700"
                  title={`Arrives at T=${p.arrivalTime}, Burst=${p.burstTime}`}
                >
                  {p.id} <span className="text-[10px] text-slate-400">(AT:{p.arrivalTime})</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* READY State Card */}
        <div className="flex flex-col rounded-xl bg-slate-950/80 border border-indigo-500/30 p-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              READY QUEUE
            </span>
            <span className="text-[11px] font-mono font-semibold text-indigo-300">
              {readyProcesses.length} waiting
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 min-h-[44px]">
            {readyProcesses.length === 0 ? (
              <span className="text-[11px] text-slate-600 italic py-1">Queue empty</span>
            ) : (
              readyProcesses.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-1">
                  <div
                    style={{ borderColor: p.color }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono border bg-slate-900 text-white shadow-sm"
                    title={`Remaining: ${snapshot?.remainingBursts[p.id] ?? p.burstTime} units`}
                  >
                    {p.id}
                    <span className="ml-1 text-[10px] opacity-75">
                      rem:{snapshot?.remainingBursts[p.id] ?? p.burstTime}
                    </span>
                  </div>
                  {idx < readyProcesses.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* RUNNING State Card */}
        <div className="flex flex-col rounded-xl bg-slate-950/80 border border-emerald-500/40 p-3.5 ring-1 ring-emerald-500/20">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              RUNNING (On CPU)
            </span>
            <span className="text-[11px] font-mono font-semibold text-emerald-400">
              {runningProcess ? '1 core busy' : 'Idle'}
            </span>
          </div>
          <div className="flex items-center min-h-[44px]">
            {runningProcess ? (
              <div
                style={{ backgroundColor: `${runningProcess.color}22`, borderColor: runningProcess.color }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    style={{ backgroundColor: runningProcess.color }}
                    className="w-3 h-3 rounded-full"
                  />
                  <span className="text-sm font-bold font-mono text-white">
                    {runningProcess.id}
                  </span>
                </div>
                <div className="text-right text-[11px] font-mono text-slate-300">
                  <span>Rem: </span>
                  <span className="font-bold text-white">
                    {snapshot?.remainingBursts[runningProcess.id] ?? 0}
                  </span>
                  <span> / {runningProcess.burstTime}</span>
                </div>
              </div>
            ) : snapshot?.isContextSwitch ? (
              <div className="w-full text-center py-1 text-xs font-mono font-bold text-amber-400 bg-amber-950/30 border border-amber-500/30 rounded-lg">
                Context Switch In Progress
              </div>
            ) : (
              <span className="text-[11px] text-slate-600 italic py-1">CPU is currently idle</span>
            )}
          </div>
        </div>

        {/* TERMINATED State Card */}
        <div className="flex flex-col rounded-xl bg-slate-950/80 border border-slate-800 p-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              TERMINATED
            </span>
            <span className="text-[11px] font-mono font-semibold text-cyan-300">
              {terminatedProcesses.length} / {processes.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 min-h-[44px]">
            {terminatedProcesses.length === 0 ? (
              <span className="text-[11px] text-slate-600 italic py-1">None finished yet</span>
            ) : (
              terminatedProcesses.map((p) => {
                const metric = result.metrics.find((m) => m.processId === p.id);
                return (
                  <div
                    key={p.id}
                    className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30"
                    title={`Completed at CT=${metric?.completionTime}, TAT=${metric?.turnaroundTime}, WT=${metric?.waitingTime}`}
                  >
                    {p.id} <span className="text-[9px] text-emerald-400/80">✓</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar of Simulation */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Overall Workload Execution Progress</span>
          <span className="font-mono font-bold text-indigo-300">
            {result.totalTime > 0
              ? Math.min(100, Math.round((currentTime / result.totalTime) * 100))
              : 0}
            %
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
          <div
            style={{
              width: `${
                result.totalTime > 0
                  ? Math.min(100, (currentTime / result.totalTime) * 100)
                  : 0
              }%`,
            }}
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );
};
