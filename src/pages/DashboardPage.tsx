import React from 'react';
import {
  Clock,
  Cpu,
  Layers,
  Zap,
  TrendingUp,
  Activity,
  ArrowRight,
  Sparkles,
  BarChart3,
  FlaskConical,
  GitCompare,
  SlidersHorizontal,
  Lightbulb,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { AlgorithmConfig, Process, ScheduleResult } from '../types/scheduler';
import { ALGORITHM_NAMES, ALGORITHM_DESCRIPTIONS } from '../algorithms/schedulerEngine';
import { GanttChart } from '../components/GanttChart';
import { TabKey } from '../components/Sidebar';

interface DashboardPageProps {
  processes: Process[];
  config: AlgorithmConfig;
  result: ScheduleResult;
  onNavigateTab: (tab: TabKey) => void;
  onSelectAlgorithm: (alg: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  processes,
  config,
  result,
  onNavigateTab,
  onSelectAlgorithm,
}) => {
  // Metric data for per-process charts
  const processChartData = result.metrics.map((m) => ({
    name: m.processId,
    Waiting: m.waitingTime,
    Turnaround: m.turnaroundTime,
    Response: m.responseTime,
    color: m.color,
  }));

  const totalCsTime = result.contextSwitchCount * config.contextSwitchCost;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real-Time Kernel Dispatch & Scheduling Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Smart CPU Scheduler
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-200">
                Ultimate Edition
              </span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300">
              Interactive operating system dispatcher simulation • Real mathematical execution • Deterministic tie-breaking • Zero dummy metrics.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap sm:flex-col gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={() => onNavigateTab('lab')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Configure Workload</span>
            </button>
            <button
              onClick={() => onNavigateTab('gantt')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 transition active:scale-95"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Run Gantt Simulator</span>
            </button>
            <button
              onClick={() => onNavigateTab('comparison')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 transition active:scale-95"
            >
              <GitCompare className="w-4 h-4 text-violet-400" />
              <span>Compare 6 Algorithms</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (Clickable & Annotated with exact formulas) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Processes */}
        <div
          onClick={() => onNavigateTab('lab')}
          className="group flex flex-col justify-between p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-indigo-500/50 transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Workload</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {processes.length}{' '}
              <span className="text-xs font-sans text-slate-400 font-normal">processes</span>
            </span>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-indigo-400">
              <span>Burst Sum: {result.totalBurstTime}u</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </div>

        {/* Avg Waiting Time */}
        <div
          onClick={() => onNavigateTab('comparison')}
          className="group flex flex-col justify-between p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-cyan-500/50 transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400">Avg Waiting Time</span>
              <span className="text-[10px] font-mono text-cyan-400 block">WT = TAT - BT</span>
            </div>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-cyan-300 font-mono">
              {result.avgWaitingTime}{' '}
              <span className="text-xs font-sans text-slate-400 font-normal">units</span>
            </span>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-cyan-400">
              <span>View benchmark ranking</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </div>

        {/* Avg Turnaround Time */}
        <div
          onClick={() => onNavigateTab('comparison')}
          className="group flex flex-col justify-between p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-violet-500/50 transition-all cursor-pointer shadow-lg hover:shadow-violet-500/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400">Avg Turnaround Time</span>
              <span className="text-[10px] font-mono text-violet-400 block">TAT = CT - AT</span>
            </div>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 group-hover:scale-110 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-violet-300 font-mono">
              {result.avgTurnaroundTime}{' '}
              <span className="text-xs font-sans text-slate-400 font-normal">units</span>
            </span>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-violet-400">
              <span>Total elapsed lifespan</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </div>

        {/* Avg Response Time */}
        <div
          onClick={() => onNavigateTab('gantt')}
          className="group flex flex-col justify-between p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-emerald-500/50 transition-all cursor-pointer shadow-lg hover:shadow-emerald-500/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400">Avg Response Time</span>
              <span className="text-[10px] font-mono text-emerald-400 block">RT = FirstStart - AT</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono">
              {result.avgResponseTime}{' '}
              <span className="text-xs font-sans text-slate-400 font-normal">units</span>
            </span>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-emerald-400">
              <span>Interactive latency</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </div>

        {/* CPU Utilization */}
        <div
          onClick={() => onNavigateTab('what-if')}
          className="group flex flex-col justify-between p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-amber-500/50 transition-all cursor-pointer shadow-lg hover:shadow-amber-500/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400">CPU Utilization</span>
              <span className="text-[10px] font-mono text-amber-400 block">Burst / TotalTime</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">
              {result.cpuUtilization}%
            </span>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-amber-400">
              <span>Idle: {result.idleTime}u ({result.totalTime > 0 ? ((result.idleTime / result.totalTime) * 100).toFixed(1) : 0}%)</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </div>

        {/* Throughput */}
        <div
          onClick={() => onNavigateTab('comparison')}
          className="group flex flex-col justify-between p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-blue-500/50 transition-all cursor-pointer shadow-lg hover:shadow-blue-500/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400">Throughput</span>
              <span className="text-[10px] font-mono text-blue-400 block">N / TotalTime</span>
            </div>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-300 font-mono">
              {result.throughput}{' '}
              <span className="text-xs font-sans text-slate-400 font-normal">p/u</span>
            </span>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-blue-400">
              <span>{processes.length} completed in {result.totalTime}u</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </div>

        {/* Context Switches */}
        <div
          onClick={() => onNavigateTab('what-if')}
          className="group flex flex-col justify-between p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-rose-500/50 transition-all cursor-pointer shadow-lg hover:shadow-rose-500/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400">Context Switches</span>
              <span className="text-[10px] font-mono text-rose-400 block">Cost = {config.contextSwitchCost}u</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-300 font-mono">
              {result.contextSwitchCount}
            </span>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-rose-400">
              <span>Total CS penalty: {totalCsTime}u</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </div>

        {/* Active Algorithm */}
        <div
          onClick={() => onNavigateTab('lab')}
          className="group flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/40 hover:border-indigo-400 transition-all cursor-pointer shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300">Active Algorithm</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Running
            </span>
          </div>
          <div className="mt-4">
            <span className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {config.algorithm}
            </span>
            <p className="text-[11px] text-slate-400 truncate mt-1">
              {ALGORITHM_NAMES[config.algorithm]}
            </p>
          </div>
        </div>
      </div>

      {/* Mini Gantt Preview */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Execution Timeline Quick Preview
          </h2>
          <button
            onClick={() => onNavigateTab('gantt')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <span>Full Interactive Simulator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <GanttChart result={result} interactivePlayback={false} />
      </div>

      {/* Real Process Metrics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiting vs Turnaround Time Chart */}
        <div className="flex flex-col gap-4 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Process Latency Breakdown (Waiting vs Turnaround)
              </h3>
              <p className="text-xs text-slate-400">
                Calculated per process for {config.algorithm}
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={processChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
                <Bar dataKey="Waiting" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Waiting Time" />
                <Bar dataKey="Turnaround" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Turnaround Time" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Response Time by Process Chart */}
        <div className="flex flex-col gap-4 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Initial Response Latency by Process
              </h3>
              <p className="text-xs text-slate-400">
                Time elapsed before first CPU dispatch
              </p>
            </div>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={processChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="Response" radius={[4, 4, 0, 0]} name="Response Time">
                  {processChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
