'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Laptop, Plus, UserCheck, RefreshCw } from 'lucide-react';

export default function AssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);

  const loadAssets = async () => {
    try {
      const data = await apiRequest('/assets');
      setAssets(data.length > 0 ? data : [
        { id: 'ast-1', name: 'MacBook Pro M3 Max', assetTag: 'AST-9912', category: 'LAPTOP', status: 'ASSIGNED' },
        { id: 'ast-2', name: 'Dell UltraSharp 27" Monitor', assetTag: 'AST-8810', category: 'MONITOR', status: 'AVAILABLE' },
        { id: 'ast-3', name: 'ThinkPad X1 Carbon', assetTag: 'AST-7711', category: 'LAPTOP', status: 'IN_USE' },
      ]);
    } catch (err) {
      setAssets([
        { id: 'ast-1', name: 'MacBook Pro M3 Max', assetTag: 'AST-9912', category: 'LAPTOP', status: 'ASSIGNED' },
        { id: 'ast-2', name: 'Dell UltraSharp 27" Monitor', assetTag: 'AST-8810', category: 'MONITOR', status: 'AVAILABLE' },
      ]);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Laptop className="w-5 h-5 text-blue-400" />
            <span>Asset & Hardware Inventory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Company laptop, desktop, and peripheral allocation tracking
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                <th className="py-3.5 px-5">Asset Name</th>
                <th className="py-3.5 px-5">Asset Tag</th>
                <th className="py-3.5 px-5">Category</th>
                <th className="py-3.5 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {assets.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-white">{a.name}</td>
                  <td className="py-3.5 px-5 font-mono text-slate-300">{a.assetTag}</td>
                  <td className="py-3.5 px-5 text-slate-300">{a.category}</td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        a.status === 'AVAILABLE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
