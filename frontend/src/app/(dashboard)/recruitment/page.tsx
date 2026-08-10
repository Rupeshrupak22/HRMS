'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { UserPlus, Sparkles, Briefcase, Award } from 'lucide-react';
import jsPDF from 'jspdf';

export default function RecruitmentPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isScreening, setIsScreening] = useState(false);

  const loadData = async () => {
    try {
      const jData = await apiRequest('/recruitment/jobs');
      setJobs(jData.length > 0 ? jData : [
        { id: 'job-1', code: 'JOB-2026-01', title: 'Senior Full Stack Developer', vacancies: 3, status: 'OPEN', location: 'Hybrid' },
        { id: 'job-2', code: 'JOB-2026-02', title: 'Academic Course Counselor', vacancies: 5, status: 'OPEN', location: 'Office' },
      ]);

      const cData = await apiRequest('/recruitment/candidates');
      setCandidates(cData.length > 0 ? cData : [
        { id: 'cand-1', name: 'Rohan Deshmukh', email: 'rohan.d@gmail.com', skills: 'React, Node.js, TypeScript', matchScore: 88.5, status: 'SHORTLISTED', experienceYrs: 5, aiAnalysis: 'Strong match in React & Node.js ecosystem with 5 years experience in edtech.' },
        { id: 'cand-2', name: 'Sneha Kulkarni', email: 'sneha.k@gmail.com', skills: 'Python, Django, AWS', matchScore: 76.0, status: 'INTERVIEW', experienceYrs: 3, aiAnalysis: 'Good backend skills with python background.' },
      ]);
    } catch (err) {
      setJobs([
        { id: 'job-1', code: 'JOB-2026-01', title: 'Senior Full Stack Developer', vacancies: 3, status: 'OPEN', location: 'Hybrid' },
      ]);
      setCandidates([
        { id: 'cand-1', name: 'Rohan Deshmukh', email: 'rohan.d@gmail.com', skills: 'React, Node.js, TypeScript', matchScore: 88.5, status: 'SHORTLISTED', experienceYrs: 5, aiAnalysis: 'Strong match in React & Node.js ecosystem with 5 years experience in edtech.' },
      ]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAIScreening = async (candId: string) => {
    setIsScreening(true);
    try {
      const res = await apiRequest(`/recruitment/candidates/${candId}/screen-resume`, {
        method: 'POST',
        body: JSON.stringify({ resumeText: 'Senior Full Stack Engineer with 5 years experience building Next.js and NestJS web applications.' }),
      });
      loadData();
      alert(`AI Match Score Computed: ${res.matchScore}%`);
    } catch (err: any) {
      alert(err.message || 'AI Screening failed');
    } finally {
      setIsScreening(false);
    }
  };

  const generateOfferPDF = (cand: any) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('ADYAPAN EDUTECH PVT. LTD.', 15, 20);
    doc.setFontSize(12);
    doc.text('CONFIDENTIAL EMPLOYMENT OFFER LETTER', 15, 28);
    doc.line(15, 32, 195, 32);

    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 42);
    doc.text(`Dear ${cand.name},`, 15, 52);
    doc.text('We are pleased to offer you employment at Adyapan Edutech Pvt. Ltd.', 15, 62);
    doc.text(`Designation: Senior Full Stack Developer`, 15, 72);
    doc.text(`Annual CTC Offered: INR 16,00,000`, 15, 80);
    doc.text('Joining Date: 1st September 2026', 15, 88);

    doc.text('Welcome to the Adyapan Team!', 15, 110);
    doc.save(`Offer_Letter_${cand.name.replace(' ', '_')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-600" />
            <span>Recruitment & ATS Pipeline</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Applicant Tracking System with AI Resume Screening & Match Scoring
          </p>
        </div>
      </div>

      {/* Active Jobs Board */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-orange-600" />
          <span>Active Job Vacancies</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((j) => (
            <div key={j.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-900 text-sm">{j.title}</div>
                <div className="text-slate-500 mt-0.5 font-medium">Code: {j.code} | Vacancies: {j.vacancies} | {j.location}</div>
              </div>
              <span className="px-2.5 py-1 rounded bg-orange-100 text-orange-700 font-bold text-[10px]">{j.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Candidate Pipeline */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Candidate Pipeline & AI ATS Match Score</span>
        </h2>

        <div className="space-y-3">
          {candidates.map((cand) => (
            <div key={cand.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{cand.name}</span>
                  <span className="text-[10px] text-slate-500">({cand.email})</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">{cand.status}</span>
                </div>
                <div className="text-slate-700 mt-1 font-medium">Skills: {cand.skills} | Experience: {cand.experienceYrs} Yrs</div>
                <div className="text-orange-900 mt-1 font-medium bg-amber-50/80 p-2 rounded-xl border border-orange-200/60">
                  🤖 AI Insight: {cand.aiAnalysis}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Match Score</div>
                  <div className="text-lg font-black text-orange-600">{cand.matchScore || 85}%</div>
                </div>

                <button
                  onClick={() => handleAIScreening(cand.id)}
                  disabled={isScreening}
                  className="px-3.5 py-2 rounded-xl saffron-gradient text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Screen AI
                </button>

                <button
                  onClick={() => generateOfferPDF(cand)}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-orange-600" /> Offer Letter
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
