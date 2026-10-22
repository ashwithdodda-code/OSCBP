import { runScheduler } from './schedulerEngine';
import { Process } from '../types/scheduler';

export interface TestCaseResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

export function runAllSchedulerTests(): {
  total: number;
  passed: number;
  failed: number;
  results: TestCaseResult[];
} {
  const results: TestCaseResult[] = [];

  const assert = (name: string, condition: boolean, expected: string, actual: string) => {
    results.push({
      name,
      passed: condition,
      expected,
      actual,
    });
  };

  // Test 1: FCFS Basic (all at 0)
  try {
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 4, priority: 1, color: '#6366f1' },
      { id: 'P2', arrivalTime: 0, burstTime: 3, priority: 1, color: '#8b5cf6' },
    ];
    const res = runScheduler(procs, { algorithm: 'FCFS', timeQuantum: 2, contextSwitchCost: 0 });
    const p1 = res.metrics.find((m) => m.processId === 'P1')!;
    const p2 = res.metrics.find((m) => m.processId === 'P2')!;
    assert(
      'FCFS Basic Completion Times',
      p1.completionTime === 4 && p2.completionTime === 7,
      'P1 CT=4, P2 CT=7',
      `P1 CT=${p1.completionTime}, P2 CT=${p2.completionTime}`
    );
    assert(
      'FCFS Basic Waiting Times',
      p1.waitingTime === 0 && p2.waitingTime === 4,
      'P1 WT=0, P2 WT=4',
      `P1 WT=${p1.waitingTime}, P2 WT=${p2.waitingTime}`
    );
  } catch (e: any) {
    results.push({ name: 'FCFS Basic', passed: false, expected: 'Valid run', actual: 'Error', error: e.message });
  }

  // Test 2: FCFS with CPU Idle
  try {
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 2, burstTime: 3, priority: 1, color: '#6366f1' },
    ];
    const res = runScheduler(procs, { algorithm: 'FCFS', timeQuantum: 2, contextSwitchCost: 0 });
    const idleSeg = res.timeline.find((s) => s.type === 'idle');
    assert(
      'FCFS Idle CPU Timeline',
      Boolean(idleSeg && idleSeg.startTime === 0 && idleSeg.endTime === 2),
      'Idle from 0 to 2',
      idleSeg ? `Idle from ${idleSeg.startTime} to ${idleSeg.endTime}` : 'No idle found'
    );
  } catch (e: any) {
    results.push({ name: 'FCFS Idle CPU', passed: false, expected: 'Idle seg', actual: 'Error', error: e.message });
  }

  // Test 3: SJF Non-Preemptive
  try {
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 7, priority: 1, color: '#6366f1' },
      { id: 'P2', arrivalTime: 1, burstTime: 2, priority: 1, color: '#8b5cf6' },
      { id: 'P3', arrivalTime: 2, burstTime: 1, priority: 1, color: '#06b6d4' },
    ];
    // In SJF (non-preemptive): P1 arrives at 0 and runs 0..7 uninterrupted.
    // At T=7, P2 and P3 are available; P3 has burst 1, P2 has burst 2. So P3 runs 7..8, P2 runs 8..10.
    const res = runScheduler(procs, { algorithm: 'SJF', timeQuantum: 2, contextSwitchCost: 0 });
    const p1 = res.metrics.find((m) => m.processId === 'P1')!;
    const p3 = res.metrics.find((m) => m.processId === 'P3')!;
    const p2 = res.metrics.find((m) => m.processId === 'P2')!;
    assert(
      'SJF Non-preemptive execution order',
      p1.completionTime === 7 && p3.completionTime === 8 && p2.completionTime === 10,
      'P1 CT=7, P3 CT=8, P2 CT=10',
      `P1 CT=${p1.completionTime}, P3 CT=${p3.completionTime}, P2 CT=${p2.completionTime}`
    );
  } catch (e: any) {
    results.push({ name: 'SJF Non-preemptive', passed: false, expected: 'Correct CTs', actual: 'Error', error: e.message });
  }

  // Test 4: SRTF Preemption
  try {
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 8, priority: 1, color: '#6366f1' },
      { id: 'P2', arrivalTime: 1, burstTime: 2, priority: 1, color: '#8b5cf6' },
    ];
    // In SRTF: P1 runs [0..1], at T=1 P2 arrives with burst 2 < remaining 7 for P1.
    // P2 preempts P1 and runs [1..3]. Then P1 finishes [3..10].
    const res = runScheduler(procs, { algorithm: 'SRTF', timeQuantum: 2, contextSwitchCost: 0 });
    const p2 = res.metrics.find((m) => m.processId === 'P2')!;
    const p1 = res.metrics.find((m) => m.processId === 'P1')!;
    assert(
      'SRTF Preemption & Completion',
      p2.completionTime === 3 && p1.completionTime === 10,
      'P2 CT=3, P1 CT=10',
      `P2 CT=${p2.completionTime}, P1 CT=${p1.completionTime}`
    );
    assert(
      'SRTF Response Time on Preemption',
      p2.responseTime === 0,
      'P2 RT=0 (started immediately at arrival T=1)',
      `P2 RT=${p2.responseTime}`
    );
  } catch (e: any) {
    results.push({ name: 'SRTF Preemption', passed: false, expected: 'Preemption occurred', actual: 'Error', error: e.message });
  }

  // Test 5: Round Robin FIFO Queue & Time Quantum
  try {
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 1, color: '#6366f1' },
      { id: 'P2', arrivalTime: 0, burstTime: 3, priority: 1, color: '#8b5cf6' },
    ];
    // Q=2:
    // P1 runs [0..2] (rem 3)
    // P2 runs [2..4] (rem 1)
    // P1 runs [4..6] (rem 1)
    // P2 runs [6..7] (rem 0, finishes CT=7)
    // P1 runs [7..8] (rem 0, finishes CT=8)
    const res = runScheduler(procs, { algorithm: 'RR', timeQuantum: 2, contextSwitchCost: 0 });
    const p2 = res.metrics.find((m) => m.processId === 'P2')!;
    const p1 = res.metrics.find((m) => m.processId === 'P1')!;
    assert(
      'Round Robin Quantum Slicing',
      p2.completionTime === 7 && p1.completionTime === 8,
      'P2 CT=7, P1 CT=8',
      `P2 CT=${p2.completionTime}, P1 CT=${p1.completionTime}`
    );
  } catch (e: any) {
    results.push({ name: 'Round Robin Quantum', passed: false, expected: 'Sliced timeline', actual: 'Error', error: e.message });
  }

  // Test 6: Non-Preemptive Priority
  try {
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 4, priority: 3, color: '#6366f1' }, // Low priority
      { id: 'P2', arrivalTime: 1, burstTime: 2, priority: 1, color: '#8b5cf6' }, // High priority
      { id: 'P3', arrivalTime: 1, burstTime: 2, priority: 2, color: '#06b6d4' }, // Med priority
    ];
    // Non-preemptive: P1 starts at 0, finishes at 4. At T=4, P2 (prio 1) runs 4..6. Then P3 (prio 2) runs 6..8.
    const res = runScheduler(procs, { algorithm: 'PRIORITY_NP', timeQuantum: 2, contextSwitchCost: 0 });
    const p2 = res.metrics.find((m) => m.processId === 'P2')!;
    const p3 = res.metrics.find((m) => m.processId === 'P3')!;
    assert(
      'Priority Non-Preemptive Ordering',
      p2.completionTime === 6 && p3.completionTime === 8,
      'P2 CT=6, P3 CT=8',
      `P2 CT=${p2.completionTime}, P3 CT=${p3.completionTime}`
    );
  } catch (e: any) {
    results.push({ name: 'Priority Non-Preemptive', passed: false, expected: 'Prio ordering', actual: 'Error', error: e.message });
  }

  // Test 7: Preemptive Priority
  try {
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 10, priority: 4, color: '#6366f1' },
      { id: 'P2', arrivalTime: 2, burstTime: 3, priority: 1, color: '#8b5cf6' },
    ];
    // P1 runs [0..2]. At T=2, P2 arrives with higher priority (1 < 4). P2 preempts P1, runs [2..5].
    // P1 resumes at 5 and finishes at 13.
    const res = runScheduler(procs, { algorithm: 'PRIORITY_P', timeQuantum: 2, contextSwitchCost: 0 });
    const p2 = res.metrics.find((m) => m.processId === 'P2')!;
    const p1 = res.metrics.find((m) => m.processId === 'P1')!;
    assert(
      'Preemptive Priority Immediate Preemption',
      p2.completionTime === 5 && p1.completionTime === 13,
      'P2 CT=5, P1 CT=13',
      `P2 CT=${p2.completionTime}, P1 CT=${p1.completionTime}`
    );
  } catch (e: any) {
    results.push({ name: 'Preemptive Priority', passed: false, expected: 'Preemption verified', actual: 'Error', error: e.message });
  }

  // Test 8: Context Switch Cost Overhead
  try {
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 2, priority: 1, color: '#6366f1' },
      { id: 'P2', arrivalTime: 0, burstTime: 2, priority: 1, color: '#8b5cf6' },
    ];
    // FCFS with CS=1:
    // P1 runs [0..2]
    // CS occurs [2..3]
    // P2 runs [3..5]
    const res = runScheduler(procs, { algorithm: 'FCFS', timeQuantum: 2, contextSwitchCost: 1 });
    const csSeg = res.timeline.find((s) => s.type === 'context-switch');
    const p2 = res.metrics.find((m) => m.processId === 'P2')!;
    assert(
      'Context Switch Overhead in Timeline',
      Boolean(csSeg && csSeg.startTime === 2 && csSeg.endTime === 3 && p2.completionTime === 5),
      'CS at [2..3] and P2 CT=5',
      `CS=${csSeg ? `[${csSeg.startTime}..${csSeg.endTime}]` : 'None'}, P2 CT=${p2.completionTime}`
    );
  } catch (e: any) {
    results.push({ name: 'Context Switch Overhead', passed: false, expected: 'CS segment present', actual: 'Error', error: e.message });
  }

  // Test 9: Deterministic Tie Breaking
  try {
    const procs: Process[] = [
      { id: 'P2', arrivalTime: 0, burstTime: 3, priority: 1, color: '#6366f1' },
      { id: 'P1', arrivalTime: 0, burstTime: 3, priority: 1, color: '#8b5cf6' },
    ];
    // Equal arrival and equal burst: tie-breaker chooses P1 before P2 (alphabetical ID)
    const res = runScheduler(procs, { algorithm: 'FCFS', timeQuantum: 2, contextSwitchCost: 0 });
    assert(
      'Deterministic Tie Breaking by PID',
      res.timeline[0].processId === 'P1',
      'P1 runs first',
      `${res.timeline[0].processId} ran first`
    );
  } catch (e: any) {
    results.push({ name: 'Tie Breaking', passed: false, expected: 'P1 first', actual: 'Error', error: e.message });
  }

  // Test 10: Single Process Edge Case
  try {
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 1, color: '#6366f1' },
    ];
    const res = runScheduler(procs, { algorithm: 'RR', timeQuantum: 2, contextSwitchCost: 1 });
    const p1 = res.metrics[0];
    assert(
      'Single Process Edge Case',
      p1.completionTime === 5 && p1.waitingTime === 0 && res.contextSwitchCount === 0,
      'CT=5, WT=0, CS=0',
      `CT=${p1.completionTime}, WT=${p1.waitingTime}, CS=${res.contextSwitchCount}`
    );
  } catch (e: any) {
    results.push({ name: 'Single Process', passed: false, expected: 'Runs cleanly', actual: 'Error', error: e.message });
  }

  const passedCount = results.filter((r) => r.passed).length;
  return {
    total: results.length,
    passed: passedCount,
    failed: results.length - passedCount,
    results,
  };
}
