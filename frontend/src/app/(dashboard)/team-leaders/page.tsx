'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { Users, Search, Mail, Phone, Calendar, CheckCircle2 } from 'lucide-react';

interface TeamLeader {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  mobileNumber?: string;
  joiningDate?: string;
  status: string;
  designation?: string;
  department?: string;
  employeeCode?: string;
}

export default function TeamLeadersPage() {
  const [leaders, setLeaders] = useState<TeamLeader[]>([]);
  const [filtered, setFiltered] = useState<TeamLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadLeaders() {
      setLoading(true);
      try {
        // Fetch employees and filter team leaders by role or designation
        const data = await apiRequest('/employees?status=ACTIVE');
        const allEmployees = data || [];
        // Filter team leaders based on user role in their linked account or designation
        const teamLeaders = allEmployees.filter(
          (emp: any) =>
            emp.user?.role === 'TEAM_LEADER' ||
            emp.designation?.title?.toLowerCase().includes('team lead') ||
            emp.designation?.title?.toLowerCase().includes('manager') ||
            emp.employmentType === 'TEAM_LEADER'
        );
        const mapped: TeamLeader[] = teamLeaders.map((emp: any) => ({
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.personalEmail || emp.user?.email || '',
          mobileNumber: emp.mobileNumber || '',
          joiningDate: emp.joiningDate,
          status: emp.status || 'ACTIVE',
          designation: emp.designation?.title || 'Team Leader',
          department: emp.department?.name || '',
          employeeCode: emp.employeeCode,
        }));
        setLeaders(mapped);
        setFiltered(mapped);
      } catch {
        setLeaders([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    }
    loadLeaders();
  }, []);

  // Search filter
  useEffect(() => {
    if (!searchTerm) {
      setFiltered(leaders);
      return;
    }
    const term = searchTerm.toLowerCase();
    setFiltered(
      leaders.filter(
        (l) =>
          l.firstName.toLowerCase().includes(term) ||
          l.lastName.toLowerCase().includes(term) ||
          (l.email || '').toLowerCase().includes(term) ||
          (l.designation || '').toLowerCase().includes(term)
      )
    );
  }, [searchTerm, leaders]);

  // Get initials for avatar
  const getInitials = (first: string, last: string) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };

  // Get color based on name hash
  const getColor = (name: string) => {
    const colors = ['bg-emerald-500', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-rose-500', 'bg-teal-500', 'bg-amber-500', 'bg-indigo-500'];
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const activeCount = filtered.filter((l) => l.status === 'ACTIVE' || l.status === 'CONFIRMED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            Team Leaders
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {filtered.length} team leaders · {activeCount} active
          </p>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leaders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300"
          />
        </div>
      </div>

      {/* Team Leader Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-sm text-slate-400">Loading team leaders...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-400 italic">No team leaders found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((leader) => (
            <div
              key={leader.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative"
            >
              {/* Status dot */}
              <div className="absolute top-4 right-4">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Active" />
              </div>

              {/* Avatar & Name */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full ${getColor(leader.firstName + leader.lastName)} flex items-center justify-center text-white text-sm font-bold`}>
                  {getInitials(leader.firstName, leader.lastName)}
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">{leader.firstName} {leader.lastName}</div>
                  <div className="text-[10px] text-slate-500">{leader.designation}</div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                {leader.email && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{leader.email}</span>
                  </div>
                )}
                {leader.mobileNumber && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{leader.mobileNumber}</span>
                  </div>
                )}
                {leader.joiningDate && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Joined {new Date(leader.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="mb-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>

              {/* View Calls History Button */}
              <button className="w-full py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                View Calls History
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
