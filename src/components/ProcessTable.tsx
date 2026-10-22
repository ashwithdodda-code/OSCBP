import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  Dices,
  Upload,
  Download,
  AlertCircle,
  Edit2,
  Check,
  X,
  Palette,
} from 'lucide-react';
import { Process } from '../types/scheduler';
import { PROCESS_PALETTE, generateRandomProcesses, PRESETS } from '../data/presetData';
import {
  parseProcessesFromCsv,
  exportProcessesToCsv,
  downloadCsvFile,
} from '../utils/csvHelper';
import { useToast } from './Toast';

interface ProcessTableProps {
  processes: Process[];
  onChangeProcesses: (procs: Process[]) => void;
  onResetDemo: () => void;
}

export const ProcessTable: React.FC<ProcessTableProps> = ({
  processes,
  onChangeProcesses,
  onResetDemo,
}) => {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New process form state
  const [newPid, setNewPid] = useState<string>('');
  const [newArrival, setNewArrival] = useState<string>('0');
  const [newBurst, setNewBurst] = useState<string>('4');
  const [newPriority, setNewPriority] = useState<string>('1');
  const [newColor, setNewColor] = useState<string>(PROCESS_PALETTE[0]);
  const [isAddingOpen, setIsAddingOpen] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Editing process state
  const [editingPid, setEditingPid] = useState<string | null>(null);
  const [editArrival, setEditArrival] = useState<number>(0);
  const [editBurst, setEditBurst] = useState<number>(1);
  const [editPriority, setEditPriority] = useState<number>(1);
  const [editColor, setEditColor] = useState<string>('#6366f1');

  // Random generation count state
  const [randomCount, setRandomCount] = useState<number>(5);

  const startEditing = (p: Process) => {
    setEditingPid(p.id);
    setEditArrival(p.arrivalTime);
    setEditBurst(p.burstTime);
    setEditPriority(p.priority);
    setEditColor(p.color);
  };

  const cancelEditing = () => {
    setEditingPid(null);
  };

  const saveEditing = (originalId: string) => {
    if (editArrival < 0) {
      addToast('error', 'Validation Error', 'Arrival time cannot be negative.');
      return;
    }
    if (editBurst <= 0) {
      addToast('error', 'Validation Error', 'Burst time must be greater than 0.');
      return;
    }

    const updated = processes.map((p) => {
      if (p.id === originalId) {
        return {
          ...p,
          arrivalTime: Math.round(editArrival),
          burstTime: Math.round(editBurst),
          priority: Math.round(editPriority),
          color: editColor,
        };
      }
      return p;
    });

    onChangeProcesses(updated);
    setEditingPid(null);
    addToast('success', 'Process Updated', `Saved parameters for ${originalId}`);
  };

  const handleAddProcess = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Auto-generate PID if empty
    let pidToUse = newPid.trim();
    if (!pidToUse) {
      let candidateNum = processes.length + 1;
      while (processes.some((p) => p.id === `P${candidateNum}`)) {
        candidateNum++;
      }
      pidToUse = `P${candidateNum}`;
    }

    // Check uniqueness
    if (processes.some((p) => p.id.toLowerCase() === pidToUse.toLowerCase())) {
      setValidationError(`Process ID "${pidToUse}" already exists. PIDs must be unique.`);
      return;
    }

    const arrival = Number(newArrival);
    const burst = Number(newBurst);
    const priority = Number(newPriority);

    if (isNaN(arrival) || arrival < 0) {
      setValidationError('Arrival Time must be a valid number >= 0.');
      return;
    }
    if (isNaN(burst) || burst <= 0) {
      setValidationError('Burst Time must be a positive number > 0.');
      return;
    }
    if (isNaN(priority)) {
      setValidationError('Priority must be a valid numeric integer.');
      return;
    }

    const newProc: Process = {
      id: pidToUse,
      arrivalTime: Math.round(arrival),
      burstTime: Math.round(burst),
      priority: Math.round(priority),
      color: newColor || PROCESS_PALETTE[processes.length % PROCESS_PALETTE.length],
    };

    const nextList = [...processes, newProc].sort((a, b) => a.arrivalTime - b.arrivalTime);
    onChangeProcesses(nextList);

    // Reset form
    setNewPid('');
    setNewArrival('0');
    setNewBurst('4');
    setNewPriority('1');
    setNewColor(PROCESS_PALETTE[(processes.length + 1) % PROCESS_PALETTE.length]);
    setIsAddingOpen(false);
    addToast('success', 'Process Added', `Created ${pidToUse} (AT: ${newProc.arrivalTime}, BT: ${newProc.burstTime})`);
  };

  const handleDelete = (pid: string) => {
    const nextList = processes.filter((p) => p.id !== pid);
    onChangeProcesses(nextList);
    addToast('info', 'Process Deleted', `Removed ${pid} from the workload.`);
  };

  const handleDuplicate = (p: Process) => {
    let copyNum = 1;
    let candidateId = `${p.id}_copy`;
    while (processes.some((proc) => proc.id === candidateId)) {
      copyNum++;
      candidateId = `${p.id}_copy${copyNum}`;
    }

    const duplicated: Process = {
      ...p,
      id: candidateId,
      color: PROCESS_PALETTE[(processes.length + 1) % PROCESS_PALETTE.length],
    };

    onChangeProcesses([...processes, duplicated]);
    addToast('success', 'Process Duplicated', `Created duplicate as ${candidateId}`);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all processes?')) {
      onChangeProcesses([]);
      addToast('warning', 'Workload Cleared', 'All processes have been removed.');
    }
  };

  const handleGenerateRandom = () => {
    const generated = generateRandomProcesses(randomCount);
    onChangeProcesses(generated);
    addToast('success', 'Generated Workload', `Generated ${randomCount} random processes.`);
  };

  const handleExportCsv = () => {
    if (processes.length === 0) {
      addToast('error', 'Export Failed', 'There are no processes to export.');
      return;
    }
    const csvData = exportProcessesToCsv(processes);
    downloadCsvFile(csvData, 'cpu_processes_benchmark.csv');
    addToast('success', 'CSV Exported', 'Downloaded cpu_processes_benchmark.csv');
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parseRes = parseProcessesFromCsv(content);
      if (parseRes.success && parseRes.processes) {
        onChangeProcesses(parseRes.processes);
        addToast(
          'success',
          'CSV Imported Successfully',
          `Loaded ${parseRes.processes.length} processes from file.`
        );
      } else {
        addToast('error', 'CSV Import Failed', parseRes.error || 'Failed to parse file.');
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be uploaded again if needed
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-4 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            Process Workload Management
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
              {processes.length} Processes
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Configure arrival times, bursts, priorities, colors, and batch import/export
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Process Button */}
          <button
            onClick={() => {
              setIsAddingOpen(!isAddingOpen);
              setValidationError(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Process</span>
          </button>

          {/* Random Generator */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <select
              value={randomCount}
              onChange={(e) => setRandomCount(Number(e.target.value))}
              className="bg-transparent text-xs text-slate-300 px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value={3} className="bg-slate-900">3 procs</option>
              <option value={5} className="bg-slate-900">5 procs</option>
              <option value={8} className="bg-slate-900">8 procs</option>
            </select>
            <button
              onClick={handleGenerateRandom}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 rounded transition"
              title="Generate random processes"
            >
              <Dices className="w-3.5 h-3.5 text-cyan-400" />
              <span>Random</span>
            </button>
          </div>

          {/* CSV Import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportCsv}
            accept=".csv,text/csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
            title="Import from CSV (PID, Arrival, Burst, Priority)"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Import CSV</span>
          </button>

          {/* CSV Export */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
            title="Export current workload to CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Clear All */}
          <button
            onClick={handleClearAll}
            disabled={processes.length === 0}
            className="p-1.5 text-slate-400 hover:text-rose-400 disabled:opacity-30 rounded-lg transition"
            title="Clear all processes"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Process Form Panel (Collapsible) */}
      {isAddingOpen && (
        <form
          onSubmit={handleAddProcess}
          className="p-4 rounded-xl bg-slate-950/90 border border-indigo-500/30 flex flex-col gap-3 animate-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300">Add New Process</span>
            <button
              type="button"
              onClick={() => setIsAddingOpen(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {validationError && (
            <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/80 border border-rose-500/40 p-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Process ID (PID)
              </label>
              <input
                type="text"
                placeholder={`P${processes.length + 1}`}
                value={newPid}
                onChange={(e) => setNewPid(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Arrival Time (AT)
              </label>
              <input
                type="number"
                min="0"
                value={newArrival}
                onChange={(e) => setNewArrival(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Burst Time (BT)
              </label>
              <input
                type="number"
                min="1"
                value={newBurst}
                onChange={(e) => setNewBurst(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Priority (1 = Highest)
              </label>
              <input
                type="number"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-1 flex flex-col justify-end">
              <button
                type="submit"
                className="w-full h-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
              >
                Insert Process
              </button>
            </div>
          </div>

          {/* Color Selector */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-400 font-medium">Color:</span>
            <div className="flex items-center gap-1.5">
              {PROCESS_PALETTE.slice(0, 8).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setNewColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full transition ${
                    newColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>
        </form>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Color</th>
              <th className="py-3 px-4">PID</th>
              <th className="py-3 px-4">Arrival Time (AT)</th>
              <th className="py-3 px-4">Burst Time (BT)</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {processes.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-500 font-sans">
                  No processes loaded. Click &quot;Add Process&quot; or select a preset workload above.
                </td>
              </tr>
            ) : (
              processes.map((p) => {
                const isEditing = editingPid === p.id;
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Color Swatch */}
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          {PROCESS_PALETTE.slice(0, 5).map((col) => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => setEditColor(col)}
                              style={{ backgroundColor: col }}
                              className={`w-4 h-4 rounded-full ${
                                editColor === col ? 'ring-2 ring-white' : 'opacity-70'
                              }`}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            style={{ backgroundColor: p.color }}
                            className="w-3.5 h-3.5 rounded-full shadow-sm"
                          />
                        </div>
                      )}
                    </td>

                    {/* PID */}
                    <td className="py-3 px-4 font-bold text-white font-sans">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono">
                        {p.id}
                      </span>
                    </td>

                    {/* Arrival Time */}
                    <td className="py-3 px-4 text-slate-200">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editArrival}
                          onChange={(e) => setEditArrival(Number(e.target.value))}
                          className="w-16 bg-slate-900 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white"
                        />
                      ) : (
                        <span>{p.arrivalTime}</span>
                      )}
                    </td>

                    {/* Burst Time */}
                    <td className="py-3 px-4 text-slate-200 font-bold">
                      {isEditing ? (
                        <input
                          type="number"
                          min="1"
                          value={editBurst}
                          onChange={(e) => setEditBurst(Number(e.target.value))}
                          className="w-16 bg-slate-900 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white"
                        />
                      ) : (
                        <span>{p.burstTime}</span>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4 text-slate-200">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editPriority}
                          onChange={(e) => setEditPriority(Number(e.target.value))}
                          className="w-16 bg-slate-900 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white"
                        />
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-slate-300">
                          {p.priority}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => saveEditing(p.id)}
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                            title="Save changes"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Cancel edit"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            onClick={() => startEditing(p)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                            title="Edit process"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(p)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition"
                            title="Duplicate process"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                            title="Delete process"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
