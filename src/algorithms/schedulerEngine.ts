import {
  AlgorithmConfig,
  AlgorithmType,
  Process,
  ProcessMetric,
  ProcessState,
  ScheduleResult,
  ScheduleSegment,
  SimulationSnapshot,
} from '../types/scheduler';

export const ALGORITHM_NAMES: Record<AlgorithmType, string> = {
  FCFS: 'First-Come, First-Served (FCFS)',
  SJF: 'Shortest Job First (Non-Preemptive)',
  SRTF: 'Shortest Remaining Time First (Preemptive SJF)',
  RR: 'Round Robin (RR)',
  PRIORITY_NP: 'Priority Scheduling (Non-Preemptive)',
  PRIORITY_P: 'Priority Scheduling (Preemptive)',
};

export const ALGORITHM_DESCRIPTIONS: Record<AlgorithmType, string> = {
  FCFS: 'Non-preemptive algorithm that executes processes in the exact order of their arrival. Simple, fair, but suffers from the Convoy Effect.',
  SJF: 'Non-preemptive algorithm selecting the process with the smallest total burst time. Minimizes average waiting time under non-preemptive conditions.',
  SRTF: 'Preemptive variant of SJF. Preempts the currently running process if a new process arrives with a shorter remaining burst time.',
  RR: 'Preemptive time-sliced algorithm. Each process receives a fixed time quantum in a cyclic FIFO ready queue. Excellent for interactive systems.',
  PRIORITY_NP: 'Non-preemptive algorithm that selects the process with the highest priority (lowest numerical value). Runs to completion without interruption.',
  PRIORITY_P: 'Preemptive algorithm that immediately interrupts execution if a newly arrived process possesses higher priority than the running process.',
};

/**
 * Compare two processes for deterministic tie-breaking.
 * Tie-breaker rule: Earlier arrival time, then alphabetical PID.
 */
function tieBreaker(a: Process, b: Process): number {
  if (a.arrivalTime !== b.arrivalTime) {
    return a.arrivalTime - b.arrivalTime;
  }
  return a.id.localeCompare(b.id, undefined, { numeric: true });
}

/**
 * Main simulation runner that dispatches to specific algorithm logic.
 */
export function runScheduler(
  processes: Process[],
  config: AlgorithmConfig
): ScheduleResult {
  if (!processes || processes.length === 0) {
    return {
      algorithm: config.algorithm,
      timeline: [],
      metrics: [],
      avgWaitingTime: 0,
      avgTurnaroundTime: 0,
      avgResponseTime: 0,
      cpuUtilization: 0,
      throughput: 0,
      contextSwitchCount: 0,
      totalTime: 0,
      idleTime: 0,
      totalBurstTime: 0,
      snapshots: [],
    };
  }

  // Deep clone processes to prevent mutating original objects
  const processList: Process[] = processes.map((p) => ({
    ...p,
    burstTime: Math.max(1, Math.round(p.burstTime)),
    arrivalTime: Math.max(0, Math.round(p.arrivalTime)),
    priority: Math.round(p.priority),
  }));

  switch (config.algorithm) {
    case 'FCFS':
      return simulateFCFS(processList, config);
    case 'SJF':
      return simulateSJF(processList, config);
    case 'SRTF':
      return simulateSRTF(processList, config);
    case 'RR':
      return simulateRR(processList, config);
    case 'PRIORITY_NP':
      return simulatePriorityNP(processList, config);
    case 'PRIORITY_P':
      return simulatePriorityP(processList, config);
    default:
      return simulateFCFS(processList, config);
  }
}

// -------------------------------------------------------------
// FCFS (First-Come, First-Served)
// -------------------------------------------------------------
function simulateFCFS(
  processes: Process[],
  config: AlgorithmConfig
): ScheduleResult {
  const sorted = [...processes].sort((a, b) => tieBreaker(a, b));
  const csCost = Math.max(0, config.contextSwitchCost);

  let currentTime = 0;
  const rawSegments: {
    type: 'process' | 'idle' | 'context-switch';
    processId?: string;
    startTime: number;
    endTime: number;
  }[] = [];

  let lastProcessId: string | null = null;
  const firstStartTimes: Record<string, number> = {};
  const completionTimes: Record<string, number> = {};
  let contextSwitchCount = 0;

  for (const proc of sorted) {
    if (currentTime < proc.arrivalTime) {
      rawSegments.push({
        type: 'idle',
        startTime: currentTime,
        endTime: proc.arrivalTime,
      });
      currentTime = proc.arrivalTime;
    }

    if (lastProcessId !== null && lastProcessId !== proc.id && csCost > 0) {
      rawSegments.push({
        type: 'context-switch',
        startTime: currentTime,
        endTime: currentTime + csCost,
      });
      currentTime += csCost;
      contextSwitchCount++;
    }

    if (firstStartTimes[proc.id] === undefined) {
      firstStartTimes[proc.id] = currentTime;
    }

    rawSegments.push({
      type: 'process',
      processId: proc.id,
      startTime: currentTime,
      endTime: currentTime + proc.burstTime,
    });
    currentTime += proc.burstTime;
    completionTimes[proc.id] = currentTime;
    lastProcessId = proc.id;
  }

  return buildScheduleResult(
    'FCFS',
    processes,
    rawSegments,
    firstStartTimes,
    completionTimes,
    contextSwitchCount
  );
}

// -------------------------------------------------------------
// Non-Preemptive Shortest Job First (SJF)
// -------------------------------------------------------------
function simulateSJF(
  processes: Process[],
  config: AlgorithmConfig
): ScheduleResult {
  const csCost = Math.max(0, config.contextSwitchCost);
  const remaining = [...processes];
  let currentTime = 0;
  const rawSegments: {
    type: 'process' | 'idle' | 'context-switch';
    processId?: string;
    startTime: number;
    endTime: number;
  }[] = [];

  let lastProcessId: string | null = null;
  const firstStartTimes: Record<string, number> = {};
  const completionTimes: Record<string, number> = {};
  let contextSwitchCount = 0;

  while (remaining.length > 0) {
    const available = remaining.filter((p) => p.arrivalTime <= currentTime);

    if (available.length === 0) {
      const nextArrival = Math.min(...remaining.map((p) => p.arrivalTime));
      rawSegments.push({
        type: 'idle',
        startTime: currentTime,
        endTime: nextArrival,
      });
      currentTime = nextArrival;
      continue;
    }

    // Pick process with shortest burst, then arrival time, then PID
    available.sort((a, b) => {
      if (a.burstTime !== b.burstTime) {
        return a.burstTime - b.burstTime;
      }
      return tieBreaker(a, b);
    });

    const chosen = available[0];
    const index = remaining.findIndex((p) => p.id === chosen.id);
    remaining.splice(index, 1);

    if (lastProcessId !== null && lastProcessId !== chosen.id && csCost > 0) {
      rawSegments.push({
        type: 'context-switch',
        startTime: currentTime,
        endTime: currentTime + csCost,
      });
      currentTime += csCost;
      contextSwitchCount++;
    }

    if (firstStartTimes[chosen.id] === undefined) {
      firstStartTimes[chosen.id] = currentTime;
    }

    rawSegments.push({
      type: 'process',
      processId: chosen.id,
      startTime: currentTime,
      endTime: currentTime + chosen.burstTime,
    });
    currentTime += chosen.burstTime;
    completionTimes[chosen.id] = currentTime;
    lastProcessId = chosen.id;
  }

  return buildScheduleResult(
    'SJF',
    processes,
    rawSegments,
    firstStartTimes,
    completionTimes,
    contextSwitchCount
  );
}

// -------------------------------------------------------------
// Preemptive Shortest Remaining Time First (SRTF)
// -------------------------------------------------------------
function simulateSRTF(
  processes: Process[],
  config: AlgorithmConfig
): ScheduleResult {
  const csCost = Math.max(0, config.contextSwitchCost);
  const remainingBursts: Record<string, number> = {};
  processes.forEach((p) => {
    remainingBursts[p.id] = p.burstTime;
  });

  const totalBurst = processes.reduce((acc, p) => acc + p.burstTime, 0);
  const rawSegments: {
    type: 'process' | 'idle' | 'context-switch';
    processId?: string;
    startTime: number;
    endTime: number;
  }[] = [];

  let currentTime = 0;
  let completedCount = 0;
  let lastProcessId: string | null = null;
  const firstStartTimes: Record<string, number> = {};
  const completionTimes: Record<string, number> = {};
  let contextSwitchCount = 0;

  // Maximum safety horizon to prevent any infinite loops
  const maxTime = totalBurst * 5 + processes.length * (csCost + 10) + 1000;

  while (completedCount < processes.length && currentTime < maxTime) {
    const available = processes.filter(
      (p) => p.arrivalTime <= currentTime && remainingBursts[p.id] > 0
    );

    if (available.length === 0) {
      const pending = processes.filter((p) => remainingBursts[p.id] > 0);
      if (pending.length === 0) break;
      const nextArrival = Math.min(...pending.map((p) => p.arrivalTime));
      rawSegments.push({
        type: 'idle',
        startTime: currentTime,
        endTime: nextArrival,
      });
      currentTime = nextArrival;
      continue;
    }

    // Pick process with shortest remaining time, then arrival time, then PID
    available.sort((a, b) => {
      const remA = remainingBursts[a.id];
      const remB = remainingBursts[b.id];
      if (remA !== remB) {
        return remA - remB;
      }
      return tieBreaker(a, b);
    });

    const chosen = available[0];

    // If switching processes and CS cost > 0
    if (lastProcessId !== null && lastProcessId !== chosen.id && csCost > 0) {
      rawSegments.push({
        type: 'context-switch',
        startTime: currentTime,
        endTime: currentTime + csCost,
      });
      currentTime += csCost;
      contextSwitchCount++;
      // After CS, re-evaluate because new processes may have arrived during CS
      lastProcessId = null; // CS complete, ready to run chosen
      continue;
    }

    if (firstStartTimes[chosen.id] === undefined) {
      firstStartTimes[chosen.id] = currentTime;
    }

    // Determine how long chosen can run before next arrival or completion
    const unarrived = processes.filter(
      (p) => p.arrivalTime > currentTime && remainingBursts[p.id] > 0
    );
    let runTime = remainingBursts[chosen.id];

    if (unarrived.length > 0) {
      const nextArrival = Math.min(...unarrived.map((p) => p.arrivalTime));
      const delta = nextArrival - currentTime;
      if (delta > 0 && delta < runTime) {
        // Can run for delta units, then check if new process can preempt
        runTime = delta;
      }
    }

    // Execute unit or batch
    rawSegments.push({
      type: 'process',
      processId: chosen.id,
      startTime: currentTime,
      endTime: currentTime + runTime,
    });

    currentTime += runTime;
    remainingBursts[chosen.id] -= runTime;
    lastProcessId = chosen.id;

    if (remainingBursts[chosen.id] === 0) {
      completionTimes[chosen.id] = currentTime;
      completedCount++;
    }
  }

  // Merge consecutive process segments for the same PID if no CS intervened
  const mergedSegments = mergeSegments(rawSegments);

  return buildScheduleResult(
    'SRTF',
    processes,
    mergedSegments,
    firstStartTimes,
    completionTimes,
    contextSwitchCount
  );
}

// -------------------------------------------------------------
// Round Robin (RR)
// -------------------------------------------------------------
function simulateRR(
  processes: Process[],
  config: AlgorithmConfig
): ScheduleResult {
  const quantum = Math.max(1, Math.round(config.timeQuantum || 2));
  const csCost = Math.max(0, config.contextSwitchCost);

  const remainingBursts: Record<string, number> = {};
  processes.forEach((p) => {
    remainingBursts[p.id] = p.burstTime;
  });

  const rawSegments: {
    type: 'process' | 'idle' | 'context-switch';
    processId?: string;
    startTime: number;
    endTime: number;
  }[] = [];

  let currentTime = 0;
  let completedCount = 0;
  let lastProcessId: string | null = null;
  const firstStartTimes: Record<string, number> = {};
  const completionTimes: Record<string, number> = {};
  let contextSwitchCount = 0;

  // Real FIFO Ready Queue
  const readyQueue: string[] = [];
  const inReadyQueue = new Set<string>();

  // Helper to add newly arrived processes to ready queue
  const enqueueNewArrivals = (fromTime: number, toTime: number) => {
    const newlyArrived = processes.filter(
      (p) =>
        p.arrivalTime > fromTime &&
        p.arrivalTime <= toTime &&
        remainingBursts[p.id] > 0 &&
        !inReadyQueue.has(p.id)
    );
    newlyArrived.sort((a, b) => tieBreaker(a, b));
    for (const p of newlyArrived) {
      readyQueue.push(p.id);
      inReadyQueue.add(p.id);
    }
  };

  // Initial arrivals at time 0
  const initialArrivals = processes.filter(
    (p) => p.arrivalTime <= 0 && remainingBursts[p.id] > 0
  );
  initialArrivals.sort((a, b) => tieBreaker(a, b));
  for (const p of initialArrivals) {
    readyQueue.push(p.id);
    inReadyQueue.add(p.id);
  }

  const maxTime =
    processes.reduce((acc, p) => acc + p.burstTime, 0) * 8 +
    processes.length * (csCost + 15) +
    2000;

  while (completedCount < processes.length && currentTime < maxTime) {
    if (readyQueue.length === 0) {
      // CPU Idle: Jump to next arrival
      const unarrived = processes.filter(
        (p) => remainingBursts[p.id] > 0 && !inReadyQueue.has(p.id)
      );
      if (unarrived.length === 0) break;
      const nextArrival = Math.min(...unarrived.map((p) => p.arrivalTime));
      rawSegments.push({
        type: 'idle',
        startTime: currentTime,
        endTime: nextArrival,
      });
      const prevTime = currentTime;
      currentTime = nextArrival;
      enqueueNewArrivals(prevTime, currentTime);
      continue;
    }

    const currentPid = readyQueue.shift()!;
    inReadyQueue.delete(currentPid);

    // Context switch if switching from another process
    if (lastProcessId !== null && lastProcessId !== currentPid && csCost > 0) {
      const csStart = currentTime;
      const csEnd = currentTime + csCost;
      rawSegments.push({
        type: 'context-switch',
        startTime: csStart,
        endTime: csEnd,
      });
      currentTime = csEnd;
      contextSwitchCount++;
      // Processes arriving during CS enter ready queue
      enqueueNewArrivals(csStart, csEnd);
    }

    if (firstStartTimes[currentPid] === undefined) {
      firstStartTimes[currentPid] = currentTime;
    }

    const execTime = Math.min(quantum, remainingBursts[currentPid]);
    const execStart = currentTime;
    const execEnd = currentTime + execTime;

    rawSegments.push({
      type: 'process',
      processId: currentPid,
      startTime: execStart,
      endTime: execEnd,
    });

    currentTime = execEnd;
    remainingBursts[currentPid] -= execTime;
    lastProcessId = currentPid;

    // First enqueue processes that arrived during this execution window
    enqueueNewArrivals(execStart, execEnd);

    // Then if current process still has remaining burst, re-enqueue it
    if (remainingBursts[currentPid] > 0) {
      readyQueue.push(currentPid);
      inReadyQueue.add(currentPid);
    } else {
      completionTimes[currentPid] = currentTime;
      completedCount++;
    }
  }

  return buildScheduleResult(
    'RR',
    processes,
    rawSegments,
    firstStartTimes,
    completionTimes,
    contextSwitchCount
  );
}

// -------------------------------------------------------------
// Non-Preemptive Priority Scheduling
// (Lower priority number = Higher Priority)
// -------------------------------------------------------------
function simulatePriorityNP(
  processes: Process[],
  config: AlgorithmConfig
): ScheduleResult {
  const csCost = Math.max(0, config.contextSwitchCost);
  const remaining = [...processes];
  let currentTime = 0;
  const rawSegments: {
    type: 'process' | 'idle' | 'context-switch';
    processId?: string;
    startTime: number;
    endTime: number;
  }[] = [];

  let lastProcessId: string | null = null;
  const firstStartTimes: Record<string, number> = {};
  const completionTimes: Record<string, number> = {};
  let contextSwitchCount = 0;

  while (remaining.length > 0) {
    const available = remaining.filter((p) => p.arrivalTime <= currentTime);

    if (available.length === 0) {
      const nextArrival = Math.min(...remaining.map((p) => p.arrivalTime));
      rawSegments.push({
        type: 'idle',
        startTime: currentTime,
        endTime: nextArrival,
      });
      currentTime = nextArrival;
      continue;
    }

    // Lower numeric priority value = higher priority
    available.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return tieBreaker(a, b);
    });

    const chosen = available[0];
    const index = remaining.findIndex((p) => p.id === chosen.id);
    remaining.splice(index, 1);

    if (lastProcessId !== null && lastProcessId !== chosen.id && csCost > 0) {
      rawSegments.push({
        type: 'context-switch',
        startTime: currentTime,
        endTime: currentTime + csCost,
      });
      currentTime += csCost;
      contextSwitchCount++;
    }

    if (firstStartTimes[chosen.id] === undefined) {
      firstStartTimes[chosen.id] = currentTime;
    }

    rawSegments.push({
      type: 'process',
      processId: chosen.id,
      startTime: currentTime,
      endTime: currentTime + chosen.burstTime,
    });
    currentTime += chosen.burstTime;
    completionTimes[chosen.id] = currentTime;
    lastProcessId = chosen.id;
  }

  return buildScheduleResult(
    'PRIORITY_NP',
    processes,
    rawSegments,
    firstStartTimes,
    completionTimes,
    contextSwitchCount
  );
}

// -------------------------------------------------------------
// Preemptive Priority Scheduling
// -------------------------------------------------------------
function simulatePriorityP(
  processes: Process[],
  config: AlgorithmConfig
): ScheduleResult {
  const csCost = Math.max(0, config.contextSwitchCost);
  const remainingBursts: Record<string, number> = {};
  processes.forEach((p) => {
    remainingBursts[p.id] = p.burstTime;
  });

  const totalBurst = processes.reduce((acc, p) => acc + p.burstTime, 0);
  const rawSegments: {
    type: 'process' | 'idle' | 'context-switch';
    processId?: string;
    startTime: number;
    endTime: number;
  }[] = [];

  let currentTime = 0;
  let completedCount = 0;
  let lastProcessId: string | null = null;
  const firstStartTimes: Record<string, number> = {};
  const completionTimes: Record<string, number> = {};
  let contextSwitchCount = 0;

  const maxTime = totalBurst * 5 + processes.length * (csCost + 10) + 1000;

  while (completedCount < processes.length && currentTime < maxTime) {
    const available = processes.filter(
      (p) => p.arrivalTime <= currentTime && remainingBursts[p.id] > 0
    );

    if (available.length === 0) {
      const pending = processes.filter((p) => remainingBursts[p.id] > 0);
      if (pending.length === 0) break;
      const nextArrival = Math.min(...pending.map((p) => p.arrivalTime));
      rawSegments.push({
        type: 'idle',
        startTime: currentTime,
        endTime: nextArrival,
      });
      currentTime = nextArrival;
      continue;
    }

    // Lower number = higher priority
    available.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return tieBreaker(a, b);
    });

    const chosen = available[0];

    // Context switch if switching process
    if (lastProcessId !== null && lastProcessId !== chosen.id && csCost > 0) {
      rawSegments.push({
        type: 'context-switch',
        startTime: currentTime,
        endTime: currentTime + csCost,
      });
      currentTime += csCost;
      contextSwitchCount++;
      lastProcessId = null;
      continue;
    }

    if (firstStartTimes[chosen.id] === undefined) {
      firstStartTimes[chosen.id] = currentTime;
    }

    // Look ahead to next arrival of higher priority process
    const futureArrivals = processes.filter(
      (p) =>
        p.arrivalTime > currentTime &&
        remainingBursts[p.id] > 0 &&
        p.priority < chosen.priority
    );

    let runTime = remainingBursts[chosen.id];
    if (futureArrivals.length > 0) {
      const nextHighPriorityArrival = Math.min(
        ...futureArrivals.map((p) => p.arrivalTime)
      );
      const delta = nextHighPriorityArrival - currentTime;
      if (delta > 0 && delta < runTime) {
        runTime = delta;
      }
    }

    rawSegments.push({
      type: 'process',
      processId: chosen.id,
      startTime: currentTime,
      endTime: currentTime + runTime,
    });

    currentTime += runTime;
    remainingBursts[chosen.id] -= runTime;
    lastProcessId = chosen.id;

    if (remainingBursts[chosen.id] === 0) {
      completionTimes[chosen.id] = currentTime;
      completedCount++;
    }
  }

  const mergedSegments = mergeSegments(rawSegments);

  return buildScheduleResult(
    'PRIORITY_P',
    processes,
    mergedSegments,
    firstStartTimes,
    completionTimes,
    contextSwitchCount
  );
}

// -------------------------------------------------------------
// Utilities: Merge adjacent identical segments & build results
// -------------------------------------------------------------
function mergeSegments(
  segments: {
    type: 'process' | 'idle' | 'context-switch';
    processId?: string;
    startTime: number;
    endTime: number;
  }[]
) {
  const merged: typeof segments = [];
  for (const seg of segments) {
    if (seg.startTime === seg.endTime) continue;
    const prev = merged[merged.length - 1];
    if (
      prev &&
      prev.type === seg.type &&
      prev.processId === seg.processId &&
      prev.endTime === seg.startTime
    ) {
      prev.endTime = seg.endTime;
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}

function buildScheduleResult(
  algorithm: AlgorithmType,
  processes: Process[],
  rawSegments: {
    type: 'process' | 'idle' | 'context-switch';
    processId?: string;
    startTime: number;
    endTime: number;
  }[],
  firstStartTimes: Record<string, number>,
  completionTimes: Record<string, number>,
  contextSwitchCount: number
): ScheduleResult {
  const colorMap = new Map<string, string>();
  processes.forEach((p) => colorMap.set(p.id, p.color));

  const timeline: ScheduleSegment[] = rawSegments.map((seg, idx) => ({
    id: `seg-${idx}-${seg.startTime}-${seg.endTime}`,
    type: seg.type,
    processId: seg.processId,
    startTime: seg.startTime,
    endTime: seg.endTime,
    duration: seg.endTime - seg.startTime,
    color: seg.processId ? colorMap.get(seg.processId) : undefined,
  }));

  const totalTime =
    timeline.length > 0 ? timeline[timeline.length - 1].endTime : 0;
  const totalBurstTime = processes.reduce((acc, p) => acc + p.burstTime, 0);

  const idleTime = timeline
    .filter((s) => s.type === 'idle')
    .reduce((acc, s) => acc + s.duration, 0);

  // Compute metrics per process
  const metrics: ProcessMetric[] = processes.map((p) => {
    const ct = completionTimes[p.id] ?? 0;
    const tat = ct - p.arrivalTime;
    const wt = tat - p.burstTime;
    const rt = (firstStartTimes[p.id] ?? p.arrivalTime) - p.arrivalTime;

    return {
      processId: p.id,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority,
      completionTime: ct,
      turnaroundTime: Math.max(0, tat),
      waitingTime: Math.max(0, wt),
      responseTime: Math.max(0, rt),
      firstStartTime: firstStartTimes[p.id] ?? p.arrivalTime,
      color: p.color,
    };
  });

  const n = processes.length;
  const avgWaitingTime = n > 0 ? metrics.reduce((acc, m) => acc + m.waitingTime, 0) / n : 0;
  const avgTurnaroundTime = n > 0 ? metrics.reduce((acc, m) => acc + m.turnaroundTime, 0) / n : 0;
  const avgResponseTime = n > 0 ? metrics.reduce((acc, m) => acc + m.responseTime, 0) / n : 0;

  // CPU Utilization = Active process time / total time
  const cpuUtilization = totalTime > 0 ? (totalBurstTime / totalTime) * 100 : 0;
  const throughput = totalTime > 0 ? n / totalTime : 0;

  // Generate granular step-by-step snapshots for Gantt playback
  const snapshots = generateSnapshots(processes, timeline, totalTime);

  return {
    algorithm,
    timeline,
    metrics,
    avgWaitingTime: Number(avgWaitingTime.toFixed(2)),
    avgTurnaroundTime: Number(avgTurnaroundTime.toFixed(2)),
    avgResponseTime: Number(avgResponseTime.toFixed(2)),
    cpuUtilization: Number(cpuUtilization.toFixed(2)),
    throughput: Number(throughput.toFixed(4)),
    contextSwitchCount,
    totalTime,
    idleTime,
    totalBurstTime,
    snapshots,
  };
}

/**
 * Generate snapshots for every timeline change point (0, 1, 2... or discrete segment boundaries)
 */
function generateSnapshots(
  processes: Process[],
  timeline: ScheduleSegment[],
  totalTime: number
): SimulationSnapshot[] {
  const snapshots: SimulationSnapshot[] = [];
  if (totalTime === 0 || processes.length === 0) return snapshots;

  // Generate snapshots at each integer time step up to totalTime
  // If totalTime is large (> 200), we take segment boundaries + integer steps
  const maxSteps = Math.min(totalTime, 200);
  const timePoints = new Set<number>();
  for (let t = 0; t <= maxSteps; t++) {
    timePoints.add(t);
  }
  timeline.forEach((seg) => {
    timePoints.add(seg.startTime);
    timePoints.add(seg.endTime);
  });

  const sortedTimes = Array.from(timePoints).sort((a, b) => a - b);

  for (const t of sortedTimes) {
    // Determine active segment at time t (or segment starting at t)
    const activeSeg = timeline.find((s) => s.startTime <= t && t < s.endTime);

    const runningPid =
      activeSeg && activeSeg.type === 'process'
        ? activeSeg.processId || null
        : null;
    const isContextSwitch = activeSeg ? activeSeg.type === 'context-switch' : false;

    // Calculate completed processes up to time t
    const completedProcesses: string[] = [];
    const remainingBursts: Record<string, number> = {};
    const processStates: Record<string, ProcessState> = {};

    processes.forEach((p) => {
      // Calculate how much burst p has executed strictly before time t
      let executedUnits = 0;
      timeline.forEach((s) => {
        if (s.type === 'process' && s.processId === p.id) {
          if (s.endTime <= t) {
            executedUnits += s.duration;
          } else if (s.startTime < t && t < s.endTime) {
            executedUnits += t - s.startTime;
          }
        }
      });

      const rem = Math.max(0, p.burstTime - executedUnits);
      remainingBursts[p.id] = rem;

      if (rem === 0 && executedUnits >= p.burstTime) {
        completedProcesses.push(p.id);
        processStates[p.id] = 'TERMINATED';
      } else if (t < p.arrivalTime) {
        processStates[p.id] = 'NEW';
      } else if (runningPid === p.id) {
        processStates[p.id] = 'RUNNING';
      } else {
        processStates[p.id] = 'READY';
      }
    });

    const readyQueue = processes
      .filter((p) => processStates[p.id] === 'READY')
      .map((p) => p.id);

    let decisionReason = '';
    if (isContextSwitch) {
      decisionReason = `Context switch penalty (${activeSeg?.duration}u) in progress. CPU is busy updating kernel registers and swapping Process Control Blocks (PCB).`;
    } else if (runningPid) {
      const rem = remainingBursts[runningPid] ?? 0;
      const totalB = processes.find((p) => p.id === runningPid)?.burstTime ?? 0;
      decisionReason = `Process ${runningPid} executing on CPU (${totalB - rem}/${totalB} units completed). ${
        readyQueue.length > 0
          ? `Ready queue holding [${readyQueue.join(', ')}].`
          : 'No other processes currently in ready queue.'
      }`;
    } else {
      const upcoming = processes.filter((p) => p.arrivalTime > t);
      if (upcoming.length > 0) {
        const nextTime = Math.min(...upcoming.map((p) => p.arrivalTime));
        decisionReason = `CPU is IDLE. Next process arrival is at T=${nextTime}.`;
      } else {
        decisionReason = 'All processes in workload have reached TERMINATED state.';
      }
    }

    snapshots.push({
      time: t,
      runningProcessId: runningPid,
      isContextSwitch,
      readyQueue,
      completedProcesses,
      processStates,
      remainingBursts,
      decisionReason,
    });
  }

  return snapshots;
}
