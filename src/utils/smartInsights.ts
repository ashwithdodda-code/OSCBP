import { AlgorithmConfig, Process, ScheduleResult, SmartInsight } from '../types/scheduler';
import { runScheduler } from '../algorithms/schedulerEngine';

export function generateSmartInsights(
  processes: Process[],
  config: AlgorithmConfig,
  currentResult: ScheduleResult
): SmartInsight[] {
  const insights: SmartInsight[] = [];
  if (processes.length === 0 || currentResult.totalTime === 0) {
    return [
      {
        id: 'no-data',
        title: 'No Process Workload',
        type: 'info',
        summary: 'No processes are currently loaded into the simulation.',
        whyItHappened: 'The process table is empty.',
        evidence: 'Active process count is 0.',
        recommendation: 'Add processes or load an OS preset from the Scheduler Lab.',
      },
    ];
  }

  // Run comparative benchmarks to gather concrete evidence
  const fcfsResult = runScheduler(processes, { ...config, algorithm: 'FCFS' });
  const srtfResult = runScheduler(processes, { ...config, algorithm: 'SRTF' });
  const sjfResult = runScheduler(processes, { ...config, algorithm: 'SJF' });
  const rrResult = runScheduler(processes, { ...config, algorithm: 'RR' });

  // 1. Context switch impact analysis
  if (config.contextSwitchCost > 0) {
    const csTime = currentResult.contextSwitchCount * config.contextSwitchCost;
    const csPercentage = ((csTime / currentResult.totalTime) * 100).toFixed(1);
    if (csTime > 0) {
      insights.push({
        id: 'context-switch-penalty',
        title: 'Context Switch Overhead Penalty',
        type: csPercentage > '15' ? 'warning' : 'info',
        summary: `Context switching consumed ${csTime} units (${csPercentage}% of total CPU runtime).`,
        whyItHappened: `With a context switch cost of ${config.contextSwitchCost} per switch across ${currentResult.contextSwitchCount} switches, the CPU spent time preserving and restoring process control blocks (PCBs).`,
        evidence: `Total duration: ${currentResult.totalTime} units. Context switch overhead: ${csTime} units across ${currentResult.contextSwitchCount} switches.`,
        recommendation:
          config.algorithm === 'RR'
            ? 'Increase the Time Quantum in Round Robin to reduce excessive preemption cycles and context switch overhead.'
            : 'If context switch cost is high, consider non-preemptive algorithms like SJF or batching where acceptable.',
      });
    }
  }

  // 2. CPU Idle Period detection
  if (currentResult.idleTime > 0) {
    const idlePercentage = ((currentResult.idleTime / currentResult.totalTime) * 100).toFixed(1);
    insights.push({
      id: 'cpu-idle-anomaly',
      title: 'CPU Idle Gaps Detected',
      type: 'warning',
      summary: `The CPU remained idle for ${currentResult.idleTime} time units (${idlePercentage}% idle).`,
      whyItHappened: 'There were gaps where previous processes completed or arrived late, leaving the ready queue completely empty.',
      evidence: `Idle intervals occurred on the timeline, totaling ${currentResult.idleTime} units out of ${currentResult.totalTime}.`,
      recommendation:
        'In production OS design, admission schedulers prevent idle waste by admitting lower-priority batch jobs or background daemons.',
    });
  }

  // 3. Convoy Effect in FCFS
  if (config.algorithm === 'FCFS' && processes.length > 2) {
    const sortedByArr = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    if (sortedByArr[0].burstTime >= 10 && sortedByArr.slice(1).some((p) => p.burstTime <= 3)) {
      const longJob = sortedByArr[0];
      insights.push({
        id: 'convoy-effect',
        title: 'Severe Convoy Effect Observed',
        type: 'warning',
        summary: `Process ${longJob.id} arrived first with a long burst (${longJob.burstTime}), stalling smaller jobs.`,
        whyItHappened:
          'Under FCFS, CPU-bound processes hold the CPU indefinitely, forcing short I/O-bound processes to wait extensively.',
        evidence: `Average waiting time is ${currentResult.avgWaitingTime} units under FCFS, whereas SRTF achieves ${srtfResult.avgWaitingTime} units.`,
        recommendation:
          'Switch to Preemptive SRTF or Round Robin to give short interactive tasks immediate execution windows.',
      });
    }
  }

  // 4. SRTF vs FCFS optimality comparison
  if (config.algorithm === 'SRTF' && currentResult.avgWaitingTime < fcfsResult.avgWaitingTime) {
    const savedWait = (fcfsResult.avgWaitingTime - currentResult.avgWaitingTime).toFixed(2);
    insights.push({
      id: 'srtf-optimality',
      title: 'SRTF Waiting Time Minimization',
      type: 'positive',
      summary: `SRTF saved an average of ${savedWait} units in waiting time compared to FCFS.`,
      whyItHappened:
        'By prioritizing processes with the shortest remaining burst time, SRTF clears queued jobs quickly, reducing the denominator in queue wait times.',
      evidence: `SRTF Avg Waiting Time: ${currentResult.avgWaitingTime} vs FCFS: ${fcfsResult.avgWaitingTime}.`,
      recommendation:
        'SRTF is theoretically optimal for waiting time, though practical OS kernels approximate it via multi-level feedback queues because future burst times cannot be known in advance.',
    });
  }

  // 5. Round Robin Quantum Balance
  if (config.algorithm === 'RR') {
    const q = config.timeQuantum;
    const maxBurst = Math.max(...processes.map((p) => p.burstTime));
    const minBurst = Math.min(...processes.map((p) => p.burstTime));

    if (q <= 1 && maxBurst >= 8) {
      insights.push({
        id: 'rr-quantum-too-small',
        title: 'Time Quantum Dangerously Low',
        type: 'warning',
        summary: `A quantum of ${q} causes high context-switch frequency relative to burst lengths.`,
        whyItHappened: `Large jobs need many slices to complete (e.g., job with burst ${maxBurst} needs ${Math.ceil(maxBurst / q)} slices).`,
        evidence: `Total context switches triggered: ${currentResult.contextSwitchCount}.`,
        recommendation: 'Increase the quantum to roughly 80% of average burst time to strike a balance between response time and throughput.',
      });
    } else if (q >= maxBurst) {
      insights.push({
        id: 'rr-quantum-degenerate',
        title: 'Round Robin Degenerates into FCFS',
        type: 'info',
        summary: `Quantum of ${q} equals or exceeds the maximum process burst (${maxBurst}).`,
        whyItHappened: 'No process is ever preempted by the timer slice; each process runs to completion on its first turn.',
        evidence: `Round Robin metrics (${currentResult.avgWaitingTime} wait) match or approach FCFS (${fcfsResult.avgWaitingTime} wait).`,
        recommendation: 'Reduce the quantum if you desire interactive responsiveness and fair time-sharing.',
      });
    } else {
      insights.push({
        id: 'rr-responsiveness',
        title: 'Interactive Responsiveness Achieved',
        type: 'positive',
        summary: `Round Robin offers low response time (${currentResult.avgResponseTime} units) across all processes.`,
        whyItHappened: 'Time-slicing ensures every ready process gets a CPU turn rapidly without waiting for prior jobs to finish completely.',
        evidence: `Average response time is ${currentResult.avgResponseTime} units.`,
        recommendation: 'Use Round Robin for desktop and interactive operating systems where user UI responsiveness is paramount.',
      });
    }
  }

  // 6. Priority Starvation Risk
  if (config.algorithm === 'PRIORITY_NP' || config.algorithm === 'PRIORITY_P') {
    const maxPriority = Math.max(...processes.map((p) => p.priority));
    const minPriority = Math.min(...processes.map((p) => p.priority));
    const lowPriorityProcesses = processes.filter((p) => p.priority === maxPriority);

    if (maxPriority > minPriority + 2 && lowPriorityProcesses.length > 0) {
      const starved = lowPriorityProcesses[0];
      const starvedMetric = currentResult.metrics.find((m) => m.processId === starved.id);
      if (starvedMetric && starvedMetric.waitingTime > currentResult.avgWaitingTime * 1.3) {
        insights.push({
          id: 'priority-starvation',
          title: 'Starvation Vulnerability for Low-Priority Jobs',
          type: 'warning',
          summary: `Process ${starved.id} (Priority ${starved.priority}) suffered high waiting time (${starvedMetric.waitingTime} units).`,
          whyItHappened:
            'Higher priority processes monopolized the CPU as they arrived, continuously pushing low-priority jobs to the back.',
          evidence: `Process ${starved.id} waited ${starvedMetric.waitingTime} units, significantly exceeding the average (${currentResult.avgWaitingTime} units).`,
          recommendation:
            'Implement Aging: gradually increment the priority of waiting processes over time to guarantee eventual execution.',
        });
      }
    }
  }

  // 7. General Throughput Assessment
  if (currentResult.throughput > 0) {
    insights.push({
      id: 'throughput-analysis',
      title: 'System Throughput Performance',
      type: 'info',
      summary: `Throughput is ${currentResult.throughput} processes/unit time (Total runtime: ${currentResult.totalTime} units).`,
      whyItHappened: `${processes.length} processes completed across ${currentResult.totalTime} units of timeline execution.`,
      evidence: `CPU Utilization: ${currentResult.cpuUtilization}%. Idle duration: ${currentResult.idleTime} units.`,
      recommendation:
        'To optimize throughput in batch processing, prioritize Shortest Job First to clear short jobs quickly.',
    });
  }

  return insights;
}
