'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { Target, Award, Plus, CheckCircle, Clock } from 'lucide-react';

export default function PerformancePage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const gData = await apiRequest('/performance/goals');
        setGoals(gData.length > 0 ? gData : [
          { title: 'Migrate HRMS backend to NestJS microservices', targetValue: 100, currentValue: 80, unit: '%', status: 'IN_PROGRESS', dueDate: '2026-09-30' },
          { title: 'Implement AI Resume Matcher & Copilot', targetValue: 100, currentValue: 100, unit: '%', status: 'COMPLETED', dueDate: '2026-08-15' },
        ]);

        const rData = await apiRequest('/performance/reviews');
        setReviews(rData.length > 0 ? rData : [
          { cycleName: 'Annual Review 2026', selfRating: 4, managerRating: 4.5, finalRating: 4.25, recommendation: 'PROMOTION', status: 'COMPLETED' },
        ]);
      } catch (err) {
        setGoals([
          { title: 'Migrate HRMS backend to NestJS microservices', targetValue: 100, currentValue: 80, unit: '%', status: 'IN_PROGRESS', dueDate: '2026-09-30' },
        ]);
        setReviews([
          { cycleName: 'Annual Review 2026', selfRating: 4, managerRating: 4.5, finalRating: 4.25, recommendation: 'PROMOTION', status: 'COMPLETED' },
        ]);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            <span>Performance, KRA & Goals</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Goal tracking, quarterly reviews & 360-degree appraisal ratings
          </p>
        </div>
      </div>

      {/* Goals Tracker */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-violet-400" />
          <span>Active Goals & OKRs</span>
        </h2>

        <div className="space-y-3">
          {goals.map((g, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{g.title}</span>
                <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold text-[10px]">{g.status}</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full transition-all" style={{ width: `${g.currentValue}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Progress: {g.currentValue} / {g.targetValue}{g.unit}</span>
                <span>Due Date: {g.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Appraisals & Reviews */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Performance Reviews & Ratings</span>
        </h2>

        <div className="space-y-3">
          {reviews.map((r, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-white text-sm">{r.cycleName}</div>
                <div className="text-slate-400 mt-0.5">Recommendation: <strong className="text-emerald-400">{r.recommendation}</strong></div>
              </div>
              <div className="text-center bg-slate-900 p-2.5 rounded-xl border border-slate-700">
                <div className="text-[10px] text-slate-400">Rating</div>
                <div className="text-base font-black text-amber-400">{r.finalRating} / 5.0</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
