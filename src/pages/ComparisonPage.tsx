import React, { useState, useMemo } from 'react';
import {
  GitCompare,
  Trophy,
  ArrowUpDown,
  CheckCircle2,
  TrendingDown,
  Clock,
  Zap,
  Cpu,
  BarChart3,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import {
  AlgorithmComparisonResult,
  AlgorithmConfig,
  AlgorithmType,
  Process,
} from '../types/scheduler';
import { ALGORITHM_NAMES, runScheduler } from '../algorithms/schedulerEngine';

interface ComparisonPageProps {
  processes: Process[];
  config: AlgorithmConfig;
  onSelectAlgorithm: (alg: AlgorithmType) => void;
}

type SortField =
  | 'algorithm'
  | 'avgWaitingTime'
  | 'avgTurnaroundTime'
  | 'avgResponseTime'
  | 'cpuUtilization'
  | 'throughput'
  | 'contextSwitchCount';

export const ComparisonPage: React.FC<ComparisonPageProps> = ({
  processes,
  config,
  onSelectAlgorithm,
}) => {
  const [sortField, setSortField] = useState<SortField>('avgWaitingTime');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Run all 6 algorithms deterministically on current dataset
  const comparisonResults: AlgorithmComparisonResult[] = useMemo(() => {
    const algorithms: AlgorithmType[] = [
      'FCFS',
      'SJF',
      'SRTF',
      'RR',
      'PRIORITY_NP',
      'PRIORITY_P',
    ];

    return algorithms.map((alg) => {
      const res = runScheduler(processes, { ...config, algorithm: alg });
      return {
        algorithm: alg,
        name: ALGORITHM_NAMES[alg],
        avgWaitingTime: res.avgWaitingTime,
        avgTurnaroundTime: res.avgTurnaroundTime,
        avgResponseTime: res.avgResponseTime,
        cpuUtilization: res.cpuUtilization,
        throughput: res.throughput,
        contextSwitchCount: res.contextSwitchCount,
        totalTime: res.totalTime,
      };
    });
  }, [processes, config]);

  // Find actual minimum/maximum for highlighting the genuine best performers
  const bestWaiting = useMemo(
    () => Math.min(...comparisonResults.map((r) => r.avgWaitingTime)),
    [comparisonResults]
  );
  const bestTurnaround = useMemo(
    () => Math.min(...comparisonResults.map((r) => r.avgTurnaroundTime)),
    [comparisonResults]
  );
  const bestResponse = useMemo(
    () => Math.min(...comparisonResults.map((r) => r.avgResponseTime)),
    [comparisonResults]
  );
  const bestUtilization = useMemo(
    () => Math.max(...comparisonResults.map((r) => r.cpuUtilization)),
    [comparisonResults]
  );

  // Sorting
  const sortedData = useMemo(() => {
    return [...comparisonResults].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        return sortAsc
          ? (valA as string).localeCompare(valB as string)
          : (valB as string).localeCompare(valA as string);
      }
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [comparisonResults, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const chartData = comparisonResults.map((r) => ({
    name: r.algorithm,
    'Avg Waiting': r.avgWaitingTime,
    'Avg Turnaround': r.avgTurnaroundTime,
    'Avg Response': r.avgResponseTime,
    'Context Switches': r.contextSwitchCount,
  }));

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <GitCompare className="w-6 h-6 text-violet-400" />
            Comprehensive Algorithm Benchmarking
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Simultaneous multi-algorithm execution across identical workloads • Provable optimality ranking
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          Dataset: {processes.length} Processes • Quantum: {config.timeQuantum} • CS Cost: {config.contextSwitchCost}
        </div>
      </div>

      {/* Best Algorithm Accolades Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Best Waiting Time */}
        <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-3.5 shadow-lg">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">
              Optimal Waiting Time
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-extrabold text-white font-mono">
                {bestWaiting} units
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-200 border border-cyan-700/50">
                {comparisonResults.find((r) => r.avgWaitingTime === bestWaiting)?.algorithm}
              </span>
            </div>
          </div>
        </div>

        {/* Best Turnaround Time */}
        <div className="p-4 rounded-2xl bg-violet-950/40 border border-violet-500/30 flex items-center gap-3.5 shadow-lg">
          <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-violet-400 uppercase tracking-wider block">
              Optimal Turnaround Time
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-extrabold text-white font-mono">
                {bestTurnaround} units
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-violet-900/60 text-violet-200 border border-violet-700/50">
                {comparisonResults.find((r) => r.avgTurnaroundTime === bestTurnaround)?.algorithm}
              </span>
            </div>
          </div>
        </div>

        {/* Best Response Time */}
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3.5 shadow-lg">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
              Optimal Response Time
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-extrabold text-white font-mono">
                {bestResponse} units
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700/50">
                {comparisonResults.find((r) => r.avgResponseTime === bestResponse)?.algorithm}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Practical Workload-to-Algorithm Recommendation Advice */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white block">
              Dispatcher Selection Guide for this Workload:
            </span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              • For <strong className="text-cyan-300">minimum queue wait</strong>, choose <strong>{comparisonResults.find((r) => r.avgWaitingTime === bestWaiting)?.algorithm}</strong>.
              <br className="hidden sm:inline" />
              • For <strong className="text-emerald-300">interactive UI responsiveness</strong>, choose <strong>{comparisonResults.find((r) => r.avgResponseTime === bestResponse)?.algorithm}</strong>.
              <br className="hidden sm:inline" />
              • Under high context switch overhead (CS &gt; 1), non-preemptive algorithms (SJF, FCFS) conserve valuable compute cycles.
            </p>
          </div>
        </div>
      </div>

      {/* Sortable Comparison Table */}
      <div className="flex flex-col gap-4 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Side-by-Side Algorithm Comparison Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Click table column headers to sort ascending / descending
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800 select-none">
              <tr>
                <th
                  onClick={() => handleSort('algorithm')}
                  className="py-3 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Algorithm</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('avgWaitingTime')}
                  className="py-3 px-4 cursor-pointer hover:text-cyan-300"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Avg Waiting</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('avgTurnaroundTime')}
                  className="py-3 px-4 cursor-pointer hover:text-violet-300"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Avg Turnaround</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('avgResponseTime')}
                  className="py-3 px-4 cursor-pointer hover:text-emerald-300"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Avg Response</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cpuUtilization')}
                  className="py-3 px-4 cursor-pointer hover:text-amber-300"
                >
                  <div className="flex items-center gap-1.5">
                    <span>CPU Util</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('throughput')}
                  className="py-3 px-4 cursor-pointer hover:text-blue-300"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Throughput</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('contextSwitchCount')}
                  className="py-3 px-4 cursor-pointer hover:text-rose-300"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Context Switches</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedData.map((row) => {
                const isBestWait = row.avgWaitingTime === bestWaiting;
                const isBestTat = row.avgTurnaroundTime === bestTurnaround;
                const isBestResp = row.avgResponseTime === bestResponse;
                const isActive = config.algorithm === row.algorithm;

                return (
                  <tr
                    key={row.algorithm}
                    className={`transition-colors ${
                      isActive
                        ? 'bg-indigo-950/40 border-l-2 border-indigo-500'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-white font-sans">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                          {row.algorithm}
                        </span>
                        <span className="hidden md:inline text-xs font-normal text-slate-300">
                          {row.name.split('(')[0]}
                        </span>
                      </div>
                    </td>

                    {/* Waiting Time */}
                    <td className="py-3.5 px-4 text-cyan-300 font-bold">
                      <div className="flex items-center gap-1.5">
                        <span>{row.avgWaitingTime}</span>
                        {isBestWait && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                            Best
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Turnaround Time */}
                    <td className="py-3.5 px-4 text-violet-300 font-bold">
                      <div className="flex items-center gap-1.5">
                        <span>{row.avgTurnaroundTime}</span>
                        {isBestTat && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-violet-950 text-violet-300 border border-violet-500/40">
                            Best
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Response Time */}
                    <td className="py-3.5 px-4 text-emerald-300 font-bold">
                      <div className="flex items-center gap-1.5">
                        <span>{row.avgResponseTime}</span>
                        {isBestResp && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                            Best
                          </span>
                        )}
                      </div>
                    </td>

                    {/* CPU Utilization */}
                    <td className="py-3.5 px-4 text-amber-300">
                      {row.cpuUtilization}%
                    </td>

                    {/* Throughput */}
                    <td className="py-3.5 px-4 text-blue-300">
                      {row.throughput}
                    </td>

                    {/* Context Switches */}
                    <td className="py-3.5 px-4 text-rose-300">
                      {row.contextSwitchCount}
                    </td>

                    {/* Apply Algorithm Button */}
                    <td className="py-3.5 px-4 text-right">
                      {isActive ? (
                        <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-500/30 font-sans">
                          Current
                        </span>
                      ) : (
                        <button
                          onClick={() => onSelectAlgorithm(row.algorithm)}
                          className="text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition font-sans"
                        >
                          Select
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Chart Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiting & Turnaround Comparative Chart */}
        <div className="flex flex-col gap-4 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Average Latency Comparison (Lower is Better)
              </h3>
              <p className="text-xs text-slate-400">
                Average Waiting Time vs Average Turnaround Time
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-violet-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
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
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Avg Waiting" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Avg Turnaround" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Context Switches & Response Time Comparison */}
        <div className="flex flex-col gap-4 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Context Switch Overhead & Initial Response
              </h3>
              <p className="text-xs text-slate-400">
                Context switch frequency vs average first response latency
              </p>
            </div>
            <Zap className="w-4 h-4 text-rose-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
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
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Avg Response" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Context Switches" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
