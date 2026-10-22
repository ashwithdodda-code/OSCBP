export type AlgorithmType =
  | 'FCFS'
  | 'SJF'
  | 'SRTF'
  | 'RR'
  | 'PRIORITY_NP'
  | 'PRIORITY_P';

export interface Process {
  id: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  color: string;
}

export interface AlgorithmConfig {
  algorithm: AlgorithmType;
  timeQuantum: number;
  contextSwitchCost: number;
}

export type SegmentType = 'process' | 'idle' | 'context-switch';

export interface ScheduleSegment {
  id: string;
  type: SegmentType;
  processId?: string;
  startTime: number;
  endTime: number;
  duration: number;
  color?: string;
  reason?: string;
}

export interface ProcessMetric {
  processId: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
  responseTime: number;
  firstStartTime: number;
  color: string;
}

export type ProcessState = 'NEW' | 'READY' | 'RUNNING' | 'TERMINATED';

export interface SimulationSnapshot {
  time: number;
  runningProcessId: string | null;
  isContextSwitch: boolean;
  readyQueue: string[];
  completedProcesses: string[];
  processStates: Record<string, ProcessState>;
  remainingBursts: Record<string, number>;
  decisionReason?: string;
}

export interface ScheduleResult {
  algorithm: AlgorithmType;
  timeline: ScheduleSegment[];
  metrics: ProcessMetric[];
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  avgResponseTime: number;
  cpuUtilization: number;
  throughput: number;
  contextSwitchCount: number;
  totalTime: number;
  idleTime: number;
  totalBurstTime: number;
  snapshots: SimulationSnapshot[];
}

export interface AlgorithmComparisonResult {
  algorithm: AlgorithmType;
  name: string;
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  avgResponseTime: number;
  cpuUtilization: number;
  throughput: number;
  contextSwitchCount: number;
  totalTime: number;
}

export interface SmartInsight {
  id: string;
  title: string;
  type: 'warning' | 'positive' | 'info' | 'tip';
  summary: string;
  whyItHappened: string;
  evidence: string;
  recommendation: string;
}
