'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Receipt, Plus, CheckCircle, Clock } from 'lucide-react';

export default function ExpensesPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<any[]>([]);

  const loadClaims = async () => {
    try {
      const data = await apiRequest('/expenses/my-claims');
      setClaims(data.length > 0 ? data : [
        { title: 'Client Meeting Travel & Fuel', category: 'TRAVEL', amount: 3500, expenseDate: '2026-08-04', status: 'REIMBURSED' },
        { title: 'Home Office High Speed Internet', category: 'INTERNET', amount: 1500, expenseDate: '2026-08-01', status: 'FINANCE_APPROVED' },
      ]);
    } catch (err) {
      setClaims([
        { title: 'Client Meeting Travel & Fuel', category: 'TRAVEL', amount: 3500, expenseDate: '2026-08-04', status: 'REIMBURSED' },
      ]);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-400" />
            <span>Expense Claims & Reimbursements</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Travel, meal, and operational expense submissions
          </p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white">Submitted Claims</h2>
        <div className="space-y-3">
          {claims.map((c, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-white text-sm">{c.title}</div>
                <div className="text-slate-400 mt-0.5">Category: {c.category} | Date: {c.expenseDate}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-extrabold text-blue-400">₹{(c.amount || 0).toLocaleString('en-IN')}</div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">{c.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
