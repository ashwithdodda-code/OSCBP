import React from 'react';
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  Compass,
} from 'lucide-react';
import { AlgorithmConfig, Process, ScheduleResult } from '../types/scheduler';
import { generateSmartInsights } from '../utils/smartInsights';
import { ALGORITHM_NAMES } from '../algorithms/schedulerEngine';
import { TabKey } from '../components/Sidebar';

interface SmartInsightsPageProps {
  processes: Process[];
  config: AlgorithmConfig;
  result: ScheduleResult;
  onNavigateTab: (tab: TabKey) => void;
}

export const SmartInsightsPage: React.FC<SmartInsightsPageProps> = ({
  processes,
  config,
  result,
  onNavigateTab,
}) => {
  const insights = generateSmartInsights(processes, config, result);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Lightbulb className="w-6 h-6 text-amber-400" />
            Automated Smart Insights & Diagnostics Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Explainable rule-based heuristics evaluating workload anomalies, starvation risks, and overhead penalties
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
          <span>Active Heuristics:</span>
          <span className="font-mono text-amber-400">{insights.length} Detected</span>
        </div>
      </div>

      {/* Overview Context Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4 text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">
              Target Algorithm: {ALGORITHM_NAMES[config.algorithm]}
            </span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Workload: {processes.length} Processes • Context Cost: {config.contextSwitchCost}u • Quantum: {config.timeQuantum}u
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('comparison')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition"
        >
          <span>Compare All Algorithms</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Insights Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {insights.map((insight) => {
          let badgeBorder = 'border-indigo-500/30';
          let badgeBg = 'bg-indigo-950/40';
          let icon = <Info className="w-5 h-5 text-indigo-400" />;

          if (insight.type === 'warning') {
            badgeBorder = 'border-amber-500/40';
            badgeBg = 'bg-amber-950/20';
            icon = <AlertTriangle className="w-5 h-5 text-amber-400" />;
          } else if (insight.type === 'positive') {
            badgeBorder = 'border-emerald-500/40';
            badgeBg = 'bg-emerald-950/20';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
          }

          return (
            <div
              key={insight.id}
              className={`p-5 rounded-2xl border ${badgeBorder} ${badgeBg} shadow-xl backdrop-blur-md flex flex-col gap-3 transition-all hover:border-opacity-100`}
            >
              {/* Header Title */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    {icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {insight.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 font-medium">
                      {insight.summary}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${
                    insight.type === 'warning'
                      ? 'bg-amber-950 text-amber-300 border-amber-600/40'
                      : insight.type === 'positive'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600/40'
                      : 'bg-indigo-950 text-indigo-300 border-indigo-600/40'
                  }`}
                >
                  {insight.type}
                </span>
              </div>

              {/* Explanatory Grid: Why, Evidence, Recommendation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                {/* Why It Happened */}
                <div className="flex flex-col gap-1 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="font-bold text-slate-400 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    Why It Happened
                  </span>
                  <p className="text-slate-300 mt-1 leading-relaxed">
                    {insight.whyItHappened}
                  </p>
                </div>

                {/* Concrete Evidence */}
                <div className="flex flex-col gap-1 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="font-bold text-slate-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                    Mathematical Evidence
                  </span>
                  <p className="text-slate-300 mt-1 font-mono text-[11px] leading-relaxed">
                    {insight.evidence}
                  </p>
                </div>

                {/* Practical Recommendation */}
                <div className="flex flex-col gap-1 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="font-bold text-slate-400 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-emerald-400" />
                    Engineering Recommendation
                  </span>
                  <p className="text-slate-300 mt-1 leading-relaxed">
                    {insight.recommendation}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
