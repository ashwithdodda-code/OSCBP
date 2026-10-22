import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Clock,
  Layers,
  Zap,
} from 'lucide-react';
import { ScheduleResult, ScheduleSegment } from '../types/scheduler';

interface GanttChartProps {
  result: ScheduleResult;
  currentTime?: number;
  onTimeChange?: (time: number) => void;
  interactivePlayback?: boolean;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  result,
  currentTime: externalTime,
  onTimeChange,
  interactivePlayback = true,
}) => {
  const [internalTime, setInternalTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [hoveredSegment, setHoveredSegment] = useState<ScheduleSegment | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal & external time
  const currentTime = externalTime !== undefined ? externalTime : internalTime;
  const setTime = (t: number) => {
    const clamped = Math.max(0, Math.min(t, result.totalTime));
    setInternalTime(clamped);
    if (onTimeChange) onTimeChange(clamped);
  };

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) return;

    if (currentTime >= result.totalTime) {
      setIsPlaying(false);
      return;
    }

    const intervalMs = Math.max(150, 600 / playbackSpeed);
    const timer = setInterval(() => {
      setTime(currentTime + 1);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, currentTime, result.totalTime, playbackSpeed]);

  const handlePlayPause = () => {
    if (currentTime >= result.totalTime) {
      setTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setTime(0);
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setTime(currentTime + 1);
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    setTime(currentTime - 1);
  };

  // Empty state guard
  if (!result || result.timeline.length === 0 || result.totalTime === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900/60 border border-slate-800 rounded-2xl text-center">
        <Clock className="w-10 h-10 text-slate-600 mb-2" />
        <h4 className="text-sm font-semibold text-slate-300">No Execution Timeline Available</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Add processes in the Scheduler Lab or load a benchmark preset to view the CPU Gantt chart.
        </p>
      </div>
    );
  }

  // Determine active segment at current time
  const activeSegment = result.timeline.find(
    (s) => s.startTime <= currentTime && currentTime < s.endTime
  );

  // Pixel scaling for timeline: width proportional to duration
  // Minimum width per time unit = 42px for clear readability
  const pxPerUnit = 48;
  const totalChartWidth = Math.max(800, result.totalTime * pxPerUnit);

  return (
    <div className="flex flex-col gap-4 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              CPU Execution Gantt Timeline
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Total: {result.totalTime} units
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic cycle visualization • Hover segments for process metadata
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        {interactivePlayback && (
          <div className="flex items-center gap-2">
            {/* Speed Selector */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-semibold">
              {[0.5, 1, 2, 4].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-1 rounded transition ${
                    playbackSpeed === speed
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Playback action buttons */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
              <button
                onClick={handleReset}
                disabled={currentTime === 0}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded transition"
                title="Restart from T=0"
                aria-label="Restart simulation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleStepBack}
                disabled={currentTime <= 0}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded transition"
                title="Step Back 1 Unit"
                aria-label="Step back"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={handlePlayPause}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium flex items-center gap-1.5 text-xs shadow-md shadow-indigo-600/30 transition active:scale-95"
                aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                onClick={handleStepForward}
                disabled={currentTime >= result.totalTime}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded transition"
                title="Step Forward 1 Unit"
                aria-label="Step forward"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Current Time Badge */}
            <div className="flex items-center gap-1 px-3 py-1.5 bg-indigo-950/60 border border-indigo-500/40 rounded-lg text-xs font-mono text-indigo-300">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-bold">T = {currentTime}</span>
              <span className="text-indigo-400/60">/ {result.totalTime}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Gantt Timeline Container (Horizontally Scrollable) */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto overflow-y-hidden border border-slate-800 rounded-xl bg-slate-950/90 p-4 transition-all scroll-smooth"
      >
        <div style={{ width: `${totalChartWidth}px` }} className="relative select-none">
          {/* Gantt Bar Segments */}
          <div className="flex h-16 rounded-xl overflow-hidden border border-slate-700/80 shadow-inner relative bg-slate-900/60">
            {result.timeline.map((segment) => {
              const segWidth = segment.duration * pxPerUnit;
              const isCurrent =
                activeSegment && activeSegment.id === segment.id;
              const isExecuted = segment.endTime <= currentTime;
              const isExecuting =
                segment.startTime <= currentTime && currentTime < segment.endTime;

              let bgStyle: React.CSSProperties = {};
              let label = '';
              let badgeText = '';

              if (segment.type === 'process') {
                label = segment.processId || 'Proc';
                badgeText = `Burst: ${segment.duration}`;
                bgStyle = {
                  backgroundColor: segment.color || '#6366f1',
                };
              } else if (segment.type === 'context-switch') {
                label = 'CS';
                badgeText = `Switch: ${segment.duration}`;
                bgStyle = {
                  background:
                    'repeating-linear-gradient(45deg, #78350f, #78350f 8px, #b45309 8px, #b45309 16px)',
                };
              } else {
                label = 'IDLE';
                badgeText = `Idle: ${segment.duration}`;
                bgStyle = {
                  background:
                    'repeating-linear-gradient(45deg, #1e293b, #1e293b 8px, #334155 8px, #334155 16px)',
                };
              }

              return (
                <div
                  key={segment.id}
                  style={{ width: `${segWidth}px`, ...bgStyle }}
                  onMouseEnter={() => setHoveredSegment(segment)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onClick={() => setTime(segment.startTime)}
                  className={`relative flex flex-col items-center justify-center transition-all cursor-pointer border-r border-slate-950/60 group ${
                    isExecuting
                      ? 'ring-2 ring-white ring-inset brightness-125 z-10'
                      : isExecuted
                      ? 'opacity-100'
                      : 'opacity-40 hover:opacity-80'
                  }`}
                >
                  <span className="font-extrabold text-sm text-white drop-shadow-md tracking-wider">
                    {label}
                  </span>
                  <span className="text-[10px] font-mono text-white/90 drop-shadow-sm font-semibold">
                    {badgeText}
                  </span>

                  {/* Active pulsing glow if currently running */}
                  {isExecuting && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time axis ticks & labels */}
          <div className="relative h-8 mt-2">
            {result.timeline.map((seg) => (
              <React.Fragment key={`axis-${seg.id}`}>
                {/* Start boundary tick */}
                <div
                  style={{ left: `${seg.startTime * pxPerUnit}px` }}
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                >
                  <div className="w-0.5 h-2 bg-slate-600" />
                  <span className="text-[11px] font-mono font-medium text-slate-400 mt-0.5">
                    {seg.startTime}
                  </span>
                </div>

                {/* End boundary tick */}
                <div
                  style={{ left: `${seg.endTime * pxPerUnit}px` }}
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                >
                  <div className="w-0.5 h-2 bg-slate-600" />
                  <span className="text-[11px] font-mono font-medium text-slate-400 mt-0.5">
                    {seg.endTime}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Current Time Playhead Cursor Line */}
          {interactivePlayback && (
            <div
              style={{
                left: `${currentTime * pxPerUnit}px`,
                transition: isPlaying ? 'left 0.15s linear' : 'left 0.2s ease-out',
              }}
              className="absolute top-0 bottom-4 w-0.5 bg-amber-400 shadow-lg shadow-amber-400/80 z-20 pointer-events-none -translate-x-1/2"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-mono font-extrabold text-[10px] px-1.5 py-0.5 rounded shadow">
                T={currentTime}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend & Hover Details Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-300">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-indigo-500 shadow-sm" />
            <span>Process Execution</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3.5 h-3.5 rounded"
              style={{
                background:
                  'repeating-linear-gradient(45deg, #78350f, #78350f 3px, #b45309 3px, #b45309 6px)',
              }}
            />
            <span>Context Switch (CS)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3.5 h-3.5 rounded"
              style={{
                background:
                  'repeating-linear-gradient(45deg, #1e293b, #1e293b 3px, #334155 3px, #334155 6px)',
              }}
            />
            <span>CPU Idle</span>
          </div>
        </div>

        {/* Segment Inspector on Hover */}
        {hoveredSegment && (
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-slate-300 animate-in fade-in">
            <span className="font-bold text-indigo-400">
              {hoveredSegment.type === 'process'
                ? `Process ${hoveredSegment.processId}`
                : hoveredSegment.type.toUpperCase()}
            </span>
            <span>•</span>
            <span>
              Interval: [{hoveredSegment.startTime} - {hoveredSegment.endTime}]
            </span>
            <span>•</span>
            <span>Duration: {hoveredSegment.duration} units</span>
          </div>
        )}
      </div>
    </div>
  );
};
