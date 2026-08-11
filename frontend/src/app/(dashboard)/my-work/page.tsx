'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  CheckSquare,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  AlertCircle,
  TrendingUp,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import { ActionBar } from '@/components/ActionBar';

export default function MyWorkPage() {
  const { user } = useAuth();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'MEDIUM',
      completed: false,
    };
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm('Delete this task?')) setTasks(tasks.filter((t) => t.id !== id));
  };

  const exportTasks = () => {
    const headers = ['ID', 'Task', 'Due Date', 'Priority', 'Status'];
    const rows = tasks.map((t) => [t.id, t.title, t.dueDate, t.priority, t.completed ? 'DONE' : 'PENDING']);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `my-tasks-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const handleImportCSV = (text: string) => {
    const lines = text.split('\n').filter(Boolean);
    if (lines.length < 2) return;
    const newTasks = lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.replace(/"/g, '').trim());
      return { id: `task-${Date.now()}-${Math.random()}`, title: cols[1] || cols[0] || '', dueDate: cols[2] || new Date().toISOString().split('T')[0], priority: cols[3] || 'MEDIUM', completed: false };
    });
    setTasks([...newTasks, ...tasks]);
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPct = Math.round((completedCount / tasks.length) * 100) || 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            <span>My Work & Personal Task Workspace</span>
          </h1>
          <p className="text-xs text-orange-100 mt-1">
            Personal task checklists, pending action items & daily productivity tracking for {user?.firstName || 'User'}
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl bg-white/20 backdrop-blur-xs text-xs font-bold text-white border border-white/30 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span>{progressPct}% Completion Rate</span>
        </div>
      </div>

      {/* Action Bar */}
      <ActionBar
        onRefresh={() => setTasks([...tasks])}
        onImportCSV={handleImportCSV}
        onExport={exportTasks}
        onAdd={() => document.getElementById('task-input')?.focus()}
        addLabel="Add New Task"
      />

      {/* Task Creation & List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Add Task Form (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Add New Work Task
          </h2>
          <form onSubmit={handleAddTask} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Task Description *</label>
              <textarea
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                required
                rows={3}
                id="task-input"
                placeholder="What needs to be done today..."
                className="w-full bg-slate-50 text-slate-900 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl saffron-gradient text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add to My Work List</span>
            </button>
          </form>
        </div>

        {/* Right: Task Checkable List (8 Cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900">Active Task Checklist</h2>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
              {completedCount} of {tasks.length} Completed
            </span>
          </div>

          <div className="space-y-2.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 text-xs ${
                  task.completed
                    ? 'bg-slate-50/70 border-slate-200 text-slate-400 line-through'
                    : 'bg-white border-slate-200 text-slate-900 hover:border-orange-300'
                }`}
              >
                <div className="mt-0.5">
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-bold">{task.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Due: {task.dueDate}
                    </span>
                    <span
                      className={`font-extrabold ${
                        task.priority === 'HIGH' ? 'text-orange-600' : 'text-slate-500'
                      }`}
                    >
                      {task.priority} PRIORITY
                    </span>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} title="Delete" className="p-1.5 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
