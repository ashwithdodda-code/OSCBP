import { Process } from '../types/scheduler';

export const PROCESS_PALETTE = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#a855f7', // Purple
  '#ef4444', // Red
  '#84cc16', // Lime
];

export const PRESET_DEFAULT: Process[] = [
  { id: 'P1', arrivalTime: 0, burstTime: 7, priority: 2, color: PROCESS_PALETTE[0] },
  { id: 'P2', arrivalTime: 1, burstTime: 4, priority: 1, color: PROCESS_PALETTE[1] },
  { id: 'P3', arrivalTime: 2, burstTime: 8, priority: 3, color: PROCESS_PALETTE[2] },
  { id: 'P4', arrivalTime: 3, burstTime: 2, priority: 2, color: PROCESS_PALETTE[3] },
  { id: 'P5', arrivalTime: 5, burstTime: 5, priority: 1, color: PROCESS_PALETTE[4] },
];

export const PRESET_CLASSIC: Process[] = [
  { id: 'P1', arrivalTime: 0, burstTime: 8, priority: 3, color: PROCESS_PALETTE[0] },
  { id: 'P2', arrivalTime: 0, burstTime: 4, priority: 1, color: PROCESS_PALETTE[1] },
  { id: 'P3', arrivalTime: 0, burstTime: 9, priority: 4, color: PROCESS_PALETTE[2] },
  { id: 'P4', arrivalTime: 0, burstTime: 5, priority: 2, color: PROCESS_PALETTE[3] },
];

export const PRESET_MULTIPLE_ARRIVALS: Process[] = [
  { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 2, color: PROCESS_PALETTE[0] },
  { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 1, color: PROCESS_PALETTE[1] },
  { id: 'P3', arrivalTime: 2, burstTime: 8, priority: 4, color: PROCESS_PALETTE[2] },
  { id: 'P4', arrivalTime: 3, burstTime: 6, priority: 3, color: PROCESS_PALETTE[3] },
  { id: 'P5', arrivalTime: 6, burstTime: 2, priority: 1, color: PROCESS_PALETTE[4] },
];

export const PRESET_PREEMPTION_CHALLENGE: Process[] = [
  { id: 'P1', arrivalTime: 0, burstTime: 9, priority: 3, color: PROCESS_PALETTE[0] },
  { id: 'P2', arrivalTime: 1, burstTime: 4, priority: 2, color: PROCESS_PALETTE[1] },
  { id: 'P3', arrivalTime: 2, burstTime: 1, priority: 1, color: PROCESS_PALETTE[2] },
  { id: 'P4', arrivalTime: 4, burstTime: 5, priority: 2, color: PROCESS_PALETTE[3] },
  { id: 'P5', arrivalTime: 6, burstTime: 2, priority: 1, color: PROCESS_PALETTE[4] },
];

export const PRESET_CONVOY_EFFECT: Process[] = [
  { id: 'P1', arrivalTime: 0, burstTime: 24, priority: 3, color: PROCESS_PALETTE[0] },
  { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 2, color: PROCESS_PALETTE[1] },
  { id: 'P3', arrivalTime: 2, burstTime: 3, priority: 1, color: PROCESS_PALETTE[2] },
  { id: 'P4', arrivalTime: 3, burstTime: 2, priority: 1, color: PROCESS_PALETTE[3] },
];

export const PRESET_STARVATION_RISK: Process[] = [
  { id: 'P1', arrivalTime: 0, burstTime: 12, priority: 5, color: PROCESS_PALETTE[0] }, // low priority
  { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 1, color: PROCESS_PALETTE[1] },
  { id: 'P3', arrivalTime: 3, burstTime: 4, priority: 1, color: PROCESS_PALETTE[2] },
  { id: 'P4', arrivalTime: 6, burstTime: 3, priority: 1, color: PROCESS_PALETTE[3] },
  { id: 'P5', arrivalTime: 9, burstTime: 2, priority: 1, color: PROCESS_PALETTE[4] },
];

export interface PresetInfo {
  id: string;
  name: string;
  description: string;
  processes: Process[];
}

export const PRESETS: PresetInfo[] = [
  {
    id: 'default',
    name: 'Operating Systems Standard',
    description: 'Balanced 5-process scenario with staggered arrival times and mixed priorities.',
    processes: PRESET_DEFAULT,
  },
  {
    id: 'classic',
    name: 'Classic Zero Arrival (Simultaneous)',
    description: 'All processes arrive at T=0, highlighting fundamental algorithm behavioral contrasts.',
    processes: PRESET_CLASSIC,
  },
  {
    id: 'multiple-arrivals',
    name: 'Multiple Arrival Waves',
    description: 'Processes arriving in staggered clusters testing queue insertion and tie-breaking.',
    processes: PRESET_MULTIPLE_ARRIVALS,
  },
  {
    id: 'preemption-challenge',
    name: 'Preemption Challenge',
    description: 'Short bursts and high priorities arrive right after long jobs begin.',
    processes: PRESET_PREEMPTION_CHALLENGE,
  },
  {
    id: 'convoy-effect',
    name: 'Convoy Effect Demonstration',
    description: 'A monster CPU-bound job blocks short I/O bound jobs under FCFS.',
    processes: PRESET_CONVOY_EFFECT,
  },
  {
    id: 'starvation-risk',
    name: 'Priority Starvation Risk',
    description: 'Low-priority job P1 continuously deferred as high-priority jobs arrive.',
    processes: PRESET_STARVATION_RISK,
  },
];

/**
 * Generate N random realistic processes with random seed or standard pseudo-random
 */
export function generateRandomProcesses(count = 5, seed?: number): Process[] {
  let s = seed !== undefined ? seed : Date.now();
  const pseudoRandom = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const safeCount = Math.max(2, Math.min(count, 10));
  const result: Process[] = [];

  for (let i = 1; i <= safeCount; i++) {
    const arrivalTime = i === 1 ? 0 : Math.floor(pseudoRandom() * 8);
    const burstTime = Math.floor(pseudoRandom() * 9) + 2; // 2 to 10
    const priority = Math.floor(pseudoRandom() * 4) + 1; // 1 to 4
    result.push({
      id: `P${i}`,
      arrivalTime,
      burstTime,
      priority,
      color: PROCESS_PALETTE[(i - 1) % PROCESS_PALETTE.length],
    });
  }

  // Sort by arrival time for cleaner display
  return result.sort((a, b) => a.arrivalTime - b.arrivalTime);
}
