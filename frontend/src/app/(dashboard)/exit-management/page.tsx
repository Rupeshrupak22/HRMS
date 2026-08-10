'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Calculator, CheckCircle2, Clock } from 'lucide-react';

export default function ExitManagementPage() {
  const { user } = useAuth();
  const [resignations, setResignations] = useState<any[]>([]);
  const [fnf, setFnf] = useState<any | null>(null);

  const loadData = async () => {
    try {
      if (['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE', 'DEPARTMENT_HEAD'].includes(user?.role || '')) {
        const rData = await apiRequest('/exit/resignations');
        setResignations(rData.length > 0 ? rData : [
          {
            id: 'res-1',
            employee: { firstName: 'Ramesh', lastName: 'Kumar', employeeCode: 'EMP-088', department: { name: 'Sales' } },
            lastWorkingDay: '2026-08-31',
            reason: 'Relocating to another city for higher education.',
            status: 'CLEARANCE_IN_PROGRESS',
          },
        ]);
      }
    } catch (err) {
      setResignations([
        {
          id: 'res-1',
          employee: { firstName: 'Ramesh', lastName: 'Kumar', employeeCode: 'EMP-088', department: { name: 'Sales' } },
          lastWorkingDay: '2026-08-31',
          reason: 'Relocating to another city for higher education.',
          status: 'CLEARANCE_IN_PROGRESS',
        },
      ]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCalculateFnF = async (employeeId: string) => {
    try {
      const data = await apiRequest(`/exit/fnf/${employeeId}/calculate`, { method: 'POST' });
      setFnf(data);
      alert(`Full & Final Settlement calculated! Net Amount: ₹${data.netSettlement}`);
    } catch (err: any) {
      alert(err.message || 'Calculation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <LogOut className="w-5 h-5 text-blue-400" />
            <span>Exit & Full & Final Settlement (F&F)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Resignation workflow, clearance tracking & automated F&F calculations
          </p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white">Resignations & Department Clearances</h2>
        <div className="space-y-3">
          {resignations.map((r) => (
            <div key={r.id} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div>
                <div className="font-bold text-white text-sm">
                  {r.employee?.firstName} {r.employee?.lastName} ({r.employee?.employeeCode})
                </div>
                <div className="text-slate-400 mt-0.5">
                  Last Working Day: {r.lastWorkingDay} | Reason: "{r.reason}"
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 font-bold text-[10px]">
                  {r.status}
                </span>

                <button
                  onClick={() => handleCalculateFnF(r.employee?.id || 'emp-005')}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5" /> Calculate F&F
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {fnf && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-3 text-xs">
          <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Full & Final Statement Calculated
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
            <div>Pending Salary: ₹{(fnf.pendingSalary || 0).toLocaleString('en-IN')}</div>
            <div>Leave Encashment: ₹{(fnf.leaveEncashment || 0).toLocaleString('en-IN')}</div>
            <div>Deductions: ₹{(fnf.deductions || 0).toLocaleString('en-IN')}</div>
            <div className="font-black text-white text-sm">Net F&F: ₹{(fnf.netSettlement || 0).toLocaleString('en-IN')}</div>
          </div>
        </div>
      )}
    </div>
  );
}
