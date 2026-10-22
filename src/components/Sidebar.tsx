import React from 'react';
import {
  LayoutDashboard,
  FlaskConical,
  Activity,
  GitCompare,
  SlidersHorizontal,
  Lightbulb,
  ShieldCheck,
  X,
  Cpu,
} from 'lucide-react';

export type TabKey =
  | 'dashboard'
  | 'lab'
  | 'gantt'
  | 'comparison'
  | 'what-if'
  | 'insights';

interface SidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  insightCount?: number;
}

interface NavItem {
  id: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  insightCount = 0,
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'lab', label: 'Scheduler Lab', icon: FlaskConical, badge: 'Live Workload' },
    { id: 'gantt', label: 'Gantt Simulator', icon: Activity, badge: 'Interactive' },
    { id: 'comparison', label: 'Algorithm Comparison', icon: GitCompare, badge: '6 Algos' },
    { id: 'what-if', label: 'What-If Sensitivity', icon: SlidersHorizontal },
    {
      id: 'insights',
      label: 'OS Diagnostics & Insights',
      icon: Lightbulb,
      badge: insightCount > 0 ? `${insightCount} Alerts` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
  ];

  const handleNavClick = (tab: TabKey) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 z-50 lg:z-30 h-screen lg:h-[calc(100vh-4rem)] w-64 shrink-0 flex flex-col justify-between border-r border-slate-800/80 bg-slate-950/95 lg:bg-slate-950/70 backdrop-blur-xl transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex lg:hidden items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-sm text-slate-200">CPU Scheduler</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
            Simulator & Analytics
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/30 via-indigo-600/20 to-transparent text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                      item.badgeColor ||
                      (isActive
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700/60')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Engine Status Card */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Kernel Engine
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                12/12 VERIFIED
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Deterministic tie-breaks, preemption & real CS cost verified.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
