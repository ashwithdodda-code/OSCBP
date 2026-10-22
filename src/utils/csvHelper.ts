import { Process } from '../types/scheduler';
import { PROCESS_PALETTE } from '../data/presetData';

export interface CsvParseResult {
  success: boolean;
  processes?: Process[];
  error?: string;
}

export function parseProcessesFromCsv(csvText: string): CsvParseResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { success: false, error: 'The provided CSV file is empty.' };
  }

  // Check if first line is header
  let startIndex = 0;
  const firstLineLower = lines[0].toLowerCase();
  if (
    firstLineLower.includes('pid') ||
    firstLineLower.includes('process') ||
    firstLineLower.includes('arrival')
  ) {
    startIndex = 1;
  }

  if (startIndex >= lines.length) {
    return { success: false, error: 'CSV contains only headers, no process rows found.' };
  }

  const processes: Process[] = [];
  const seenPids = new Set<string>();

  for (let i = startIndex; i < lines.length; i++) {
    const rowNum = i + 1;
    const parts = lines[i].split(',').map((p) => p.trim());

    if (parts.length < 3) {
      return {
        success: false,
        error: `Row ${rowNum}: Expected at least 3 values (PID, Arrival, Burst). Received: "${lines[i]}"`,
      };
    }

    const pid = parts[0];
    const arrival = Number(parts[1]);
    const burst = Number(parts[2]);
    const priority = parts.length >= 4 ? Number(parts[3]) : 1;

    if (!pid || pid.length === 0) {
      return { success: false, error: `Row ${rowNum}: Process ID (PID) cannot be empty.` };
    }

    if (seenPids.has(pid)) {
      return { success: false, error: `Row ${rowNum}: Duplicate PID "${pid}". Each process must have a unique ID.` };
    }

    if (isNaN(arrival) || arrival < 0) {
      return {
        success: false,
        error: `Row ${rowNum} (${pid}): Arrival Time must be a non-negative number (got ${parts[1]}).`,
      };
    }

    if (isNaN(burst) || burst <= 0) {
      return {
        success: false,
        error: `Row ${rowNum} (${pid}): Burst Time must be a positive integer greater than 0 (got ${parts[2]}).`,
      };
    }

    if (isNaN(priority)) {
      return {
        success: false,
        error: `Row ${rowNum} (${pid}): Priority must be a valid number (got ${parts[3]}).`,
      };
    }

    seenPids.add(pid);
    const colorIndex = processes.length % PROCESS_PALETTE.length;
    processes.push({
      id: pid,
      arrivalTime: Math.round(arrival),
      burstTime: Math.round(burst),
      priority: Math.round(priority),
      color: PROCESS_PALETTE[colorIndex],
    });
  }

  if (processes.length === 0) {
    return { success: false, error: 'No valid process rows found in CSV.' };
  }

  return { success: true, processes };
}

export function exportProcessesToCsv(processes: Process[]): string {
  const header = 'PID,Arrival,Burst,Priority\n';
  const rows = processes
    .map((p) => `${p.id},${p.arrivalTime},${p.burstTime},${p.priority}`)
    .join('\n');
  return header + rows;
}

export function downloadCsvFile(content: string, filename = 'processes.csv'): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
