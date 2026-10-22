import React from 'react';
import { Cpu, RefreshCw, Sparkles, Layers, Sliders, Menu } from 'lucide-react';
import { AlgorithmType } from '../types/scheduler';
import { ALGORITHM_NAMES } from '../algorithms/schedulerEngine';
import { PRESETS } from '../data/presetData';

interface NavbarProps {
  algorithm: AlgorithmType;
  onSelectAlgorithm: (alg: AlgorithmType) => void;
  onLoadPreset: (presetId: string) => void;
  onResetDemo: () => void;
  onToggleMobileSidebar: () => void;
  activeTabTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  algorithm,
  onSelectAlgorithm,
  onLoadPreset,
  onResetDemo,
  onToggleMobileSidebar,
  activeTabTitle,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Brand & Mobile Menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              <Cpu className="w-5 h-5 text-white" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  Smart CPU Scheduler
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-cyan-300 bg-cyan-950/70 border border-cyan-800/60 rounded-full">
                  Ultimate Edition
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden md:block">
                OS Dispatcher Simulator • Real Algorithms • Benchmark Workbench
              </p>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-2 ml-4 pl-4 border-l border-slate-800 text-xs text-slate-400 font-medium">
            <span>Current View:</span>
            <span className="text-indigo-300 font-semibold">{activeTabTitle}</span>
          </div>
        </div>

        {/* Right Controls: Algorithm Picker, Presets, Reset */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Algorithm Picker */}
          <div className="relative flex items-center">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 mr-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Algorithm:</span>
            </div>
            <select
              value={algorithm}
              onChange={(e) => onSelectAlgorithm(e.target.value as AlgorithmType)}
              className="h-9 px-3 text-xs font-semibold bg-slate-900 border border-indigo-500/30 hover:border-indigo-400/60 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm cursor-pointer"
            >
              {(Object.keys(ALGORITHM_NAMES) as AlgorithmType[]).map((key) => (
                <option key={key} value={key} className="bg-slate-900 text-slate-100">
                  {key} — {ALGORITHM_NAMES[key].split('(')[0]}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Presets Dropdown */}
          <div className="hidden md:flex items-center">
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  onLoadPreset(e.target.value);
                  e.target.value = '';
                }
              }}
              className="h-9 px-3 text-xs font-medium bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
            >
              <option value="" disabled>
                Load Preset Workload...
              </option>
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={onResetDemo}
            className="flex items-center gap-1.5 h-9 px-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition shadow-sm active:scale-95"
            title="Reset to default benchmark dataset"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
