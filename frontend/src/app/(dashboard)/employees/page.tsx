'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Search,
  Plus,
  ChevronRight,
  X,
} from 'lucide-react';

export default function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    employeeCode: `EMP-${Math.floor(100 + Math.random() * 900)}`,
    mobileNumber: '',
    ctc: 1200000,
  });

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (departmentId) query.append('departmentId', departmentId);

      const data = await apiRequest(`/employees?${query.toString()}`);
      setEmployees(data);
    } catch (err) {
      setEmployees([
        {
          id: 'emp-001',
          employeeCode: 'EMP-001',
          firstName: 'Vikram',
          lastName: 'Sharma',
          user: { email: 'superadmin@adyapan.com', role: 'SUPER_ADMIN' },
          department: { name: 'Technology' },
          designation: { title: 'Chief Technology Officer' },
          status: 'ACTIVE',
        },
        {
          id: 'emp-002',
          employeeCode: 'EMP-002',
          firstName: 'Ananya',
          lastName: 'Roy',
          user: { email: 'hradmin@adyapan.com', role: 'HR_ADMIN' },
          department: { name: 'HR' },
          designation: { title: 'HR Director' },
          status: 'ACTIVE',
        },
        {
          id: 'emp-005',
          employeeCode: 'EMP-005',
          firstName: 'Arjun',
          lastName: 'Mehta',
          user: { email: 'techlead@adyapan.com', role: 'DEPARTMENT_HEAD' },
          department: { name: 'Technology' },
          designation: { title: 'Tech Lead' },
          status: 'ACTIVE',
        },
        {
          id: 'emp-006',
          employeeCode: 'EMP-006',
          firstName: 'Siddharth',
          lastName: 'Verma',
          user: { email: 'employee@adyapan.com', role: 'EMPLOYEE' },
          department: { name: 'Technology' },
          designation: { title: 'Senior Software Engineer' },
          status: 'PROBATION',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [search, departmentId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/employees', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setIsAddModalOpen(false);
      loadEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to create employee');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            <span>Employee Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage complete employee lifecycles & organization records
          </p>
        </div>

        {['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE'].includes(user?.role || '') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl saffron-gradient text-white text-xs font-bold shadow-md shadow-orange-500/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, email..."
            className="w-full bg-slate-50 text-xs text-slate-900 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="w-full sm:w-auto bg-slate-50 text-xs text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 transition-colors font-medium"
        >
          <option value="">All Departments</option>
          <option value="TECH">Technology</option>
          <option value="HR">Human Resources</option>
          <option value="FIN">Finance</option>
          <option value="ACAD">Academic</option>
        </select>
      </div>

      {/* Employees Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Employee</th>
                <th className="py-3.5 px-5">Code</th>
                <th className="py-3.5 px-5">Department</th>
                <th className="py-3.5 px-5">Designation</th>
                <th className="py-3.5 px-5">Role</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-orange-50/40 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full saffron-gradient flex items-center justify-center font-bold text-white shadow-xs">
                        {emp.firstName[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div className="text-[10px] text-slate-500">{emp.user?.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-5 font-mono text-slate-600 font-semibold">{emp.employeeCode}</td>
                  <td className="py-3.5 px-5 text-slate-700 font-medium">{emp.department?.name || 'Technology'}</td>
                  <td className="py-3.5 px-5 text-slate-700 font-medium">{emp.designation?.title || 'Engineer'}</td>

                  <td className="py-3.5 px-5">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200">
                      {emp.user?.role}
                    </span>
                  </td>

                  <td className="py-3.5 px-5">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-5 text-right">
                    <Link
                      href={`/employees/${emp.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      <span>View Profile</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add New Employee Profile</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    required
                    className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Annual CTC (₹)</label>
                  <input
                    type="number"
                    value={formData.ctc}
                    onChange={(e) => setFormData({ ...formData, ctc: Number(e.target.value) })}
                    required
                    className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl saffron-gradient text-white font-bold text-xs shadow-md transition-all mt-2"
              >
                Create Employee Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
