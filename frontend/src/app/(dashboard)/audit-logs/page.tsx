'use client';

import React from 'react';
import { Shield, Clock, FileText } from 'lucide-react';

export default function AuditLogsPage() {
  const logs = [
    { timestamp: '2026-08-10 15:30:12', user: 'superadmin@adyapan.com', action: 'PAYROLL_PROCESSED', module: 'Payroll', details: 'Monthly payroll for August 2026 calculated for 110 employees' },
    { timestamp: '2026-08-10 14:15:05', user: 'hradmin@adyapan.com', action: 'EMPLOYEE_CREATED', module: 'Employee Management', details: 'Added new employee Siddharth Verma (EMP-006)' },
    { timestamp: '2026-08-10 11:20:44', user: 'techlead@adyapan.com', action: 'LEAVE_APPROVED', module: 'Leave Management', details: 'Approved Casual Leave request for EMP-006' },
    { timestamp: '2026-08-09 18:45:00', user: 'finance@adyapan.com', action: 'EXPENSE_REIMBURSED', module: 'Expense Management', details: 'Reimbursed travel claim ₹3,500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span>Immutable System Audit Logs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete security trail of critical operational actions across modules
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-5">User</th>
                <th className="py-3.5 px-5">Module</th>
                <th className="py-3.5 px-5">Action</th>
                <th className="py-3.5 px-5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((l, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-5 font-mono text-slate-400">{l.timestamp}</td>
                  <td className="py-3.5 px-5 font-semibold text-white">{l.user}</td>
                  <td className="py-3.5 px-5 text-slate-300">{l.module}</td>
                  <td className="py-3.5 px-5">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold text-[10px]">
                      {l.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-300">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
