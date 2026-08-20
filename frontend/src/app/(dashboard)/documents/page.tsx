'use client';

import React, { useState, useEffect } from 'react';
import { FolderOpen, Building2, Upload, Search, Plus, RefreshCw, ChevronDown, ChevronUp, FileText, Trash2, Eye, X } from 'lucide-react';
import { Pagination } from '@/components/Pagination';

type DocRecord = {
  id: string;
  name: string;
  documentType: string;
  fileUrl: string;
  issuedAt?: string;
  expiresAt?: string;
  status: string;
  notes?: string;
};

type EmployeeWithDocs = {
  id: string;
  name: string;
  employeeId: string;
  initials: string;
  docs: DocRecord[];
};

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<'employee' | 'corporate' | 'uploads'>('employee');
  const [employees, setEmployees] = useState<EmployeeWithDocs[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  // Add Document Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTarget, setAddTarget] = useState<string | null>(null); // employee id
  const [docForm, setDocForm] = useState({ name: '', documentType: 'ID_PROOF', notes: '' });
  const [fileInput, setFileInput] = useState<File | null>(null);

  useEffect(() => {
    fetchEmployeeDocs();
  }, []);

  const fetchEmployeeDocs = async () => {
    setLoading(true);
    try {
      // Fetch CRM employees (they have document info)
      const crmRes = await fetch('/api/crm-employees');
      let empList: any[] = [];
      if (crmRes.ok) {
        const crmJson = await crmRes.json();
        empList = Array.isArray(crmJson) ? crmJson : (crmJson.employees || crmJson.data || []);
      }

      // Fetch all documents from CRM
      let allDocs: any[] = [];
      try {
        const docsRes = await fetch('/api/crm-documents');
        if (docsRes.ok) {
          const docsJson = await docsRes.json();
          allDocs = Array.isArray(docsJson) ? docsJson : (docsJson.documents || docsJson.data || []);
        }
      } catch {}

      const mapped: EmployeeWithDocs[] = empList.map((emp: any) => {
        const name = emp.name || 'Employee';
        const initials = name.split(' ').filter(Boolean).map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'EM';

        // Get documents for this employee — from inline or from allDocs
        let docs: DocRecord[] = [];

        // Check inline documents array first
        if (Array.isArray(emp.documents) && emp.documents.length > 0) {
          docs = emp.documents.map((d: any) => ({
            id: d.id || `${emp.id}-${Math.random().toString(36).slice(2)}`,
            name: d.name || d.title || 'Document',
            documentType: d.documentType || d.category || 'GENERAL',
            fileUrl: d.fileUrl ? (d.fileUrl.startsWith('http') ? d.fileUrl : `https://adyapancrm.in${d.fileUrl}`) : '',
            issuedAt: d.issuedAt || '',
            expiresAt: d.expiresAt || '',
            status: d.status || 'ACTIVE',
            notes: d.notes || '',
          }));
        }

        // Also merge from allDocs for this employee
        const empDocs = allDocs.filter((d: any) => d.employeeId === emp.id || d.employeeCrmId === emp.id || d.userId === emp.id);
        for (const d of empDocs) {
          const exists = docs.some(existing => existing.id === d.id);
          if (!exists) {
            docs.push({
              id: d.id || `${emp.id}-${Math.random().toString(36).slice(2)}`,
              name: d.name || d.title || 'Document',
              documentType: d.documentType || d.category || 'GENERAL',
              fileUrl: d.fileUrl ? (d.fileUrl.startsWith('http') ? d.fileUrl : `https://adyapancrm.in${d.fileUrl}`) : '',
              issuedAt: d.issuedAt || '',
              expiresAt: d.expiresAt || '',
              status: d.status || 'ACTIVE',
              notes: d.notes || '',
            });
          }
        }

        return {
          id: emp.id,
          name,
          employeeId: emp.employeeId || '',
          initials,
          docs,
        };
      });

      setEmployees(mapped);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = employees.filter((emp) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return emp.name.toLowerCase().includes(q) || emp.employeeId.toLowerCase().includes(q);
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAddDoc = (empId: string) => {
    setAddTarget(empId);
    setDocForm({ name: '', documentType: 'ID_PROOF', notes: '' });
    setFileInput(null);
    setShowAddModal(true);
  };

  const handleSubmitDoc = async () => {
    if (!docForm.name.trim()) {
      alert('Please enter document name');
      return;
    }

    const targetEmpId = addTarget;

    // Push to CRM
    if (targetEmpId) {
      try {
        const res = await fetch('/api/crm-documents/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: targetEmpId,
            name: docForm.name.trim(),
            documentType: docForm.documentType,
            fileUrl: fileInput ? `/uploads/docs/${fileInput.name}` : '',
            status: 'PENDING_REVIEW',
            notes: docForm.notes.trim(),
          }),
        });
        if (res.ok) {
          // Refresh list
          fetchEmployeeDocs();
          setShowAddModal(false);
          return;
        }
      } catch (err) {
        console.warn('CRM doc add failed, adding locally:', err);
      }
    }

    // Fallback: add to local state
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === targetEmpId) {
          return {
            ...emp,
            docs: [...emp.docs, {
              id: `new-${Date.now()}`,
              name: docForm.name,
              documentType: docForm.documentType,
              fileUrl: fileInput ? URL.createObjectURL(fileInput) : '',
              status: 'PENDING_REVIEW',
              notes: docForm.notes,
            }],
          };
        }
        return emp;
      })
    );
    setShowAddModal(false);
  };

  const totalDocs = employees.reduce((sum, emp) => sum + emp.docs.length, 0);

  const tabs = [
    { key: 'employee' as const, label: 'Employee Documents', icon: FolderOpen },
    { key: 'corporate' as const, label: 'Corporate Files', icon: Building2 },
    { key: 'uploads' as const, label: 'Employee Uploads', icon: Upload },
  ];

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900">Documents</h1>
        <p className="text-sm text-slate-500 mt-0.5">Employee documents grouped by person.</p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-full bg-slate-100 p-1 border border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition cursor-pointer ${
              activeTab === tab.key
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Add */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, ID, document..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
        </div>
        <button
          onClick={() => { setAddTarget(null); setShowAddModal(true); }}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Document
        </button>
        <button
          onClick={fetchEmployeeDocs}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Employee Documents Tab */}
      {activeTab === 'employee' && (
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-sm">Loading documents...</div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">No employees found.</div>
          ) : (
            paginated.map((emp) => (
              <div key={emp.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-black">
                      {emp.initials}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{emp.name}</div>
                      <div className="text-[11px] text-slate-500">{emp.employeeId}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-orange-600">
                      <FolderOpen className="w-3.5 h-3.5" /> {emp.docs.length} docs
                    </span>
                    <button
                      onClick={() => handleAddDoc(emp.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      + Add
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    >
                      {expandedId === emp.id ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded docs list */}
                {expandedId === emp.id && emp.docs.length > 0 && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 space-y-2">
                    {emp.docs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 text-xs">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-orange-400" />
                          <div>
                            <div className="font-bold text-slate-800">{doc.name}</div>
                            <div className="text-[10px] text-slate-500">{doc.documentType} • {doc.status}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {doc.fileUrl && (
                            <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 cursor-pointer">
                              <Eye className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            doc.status === 'ACTIVE' ? 'bg-green-100 text-green-700'
                            : doc.status === 'EXPIRED' ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {expandedId === emp.id && emp.docs.length === 0 && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 text-xs text-slate-400 text-center">
                    No documents uploaded yet.
                  </div>
                )}
              </div>
            ))
          )}

          <Pagination
            currentPage={page}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Corporate Files Tab */}
      {activeTab === 'corporate' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Corporate Files</h3>
          <p className="text-xs text-slate-400 mt-1">Company policies, handbooks, and organizational documents.</p>
          <p className="text-xs text-slate-400 mt-3">Coming soon...</p>
        </div>
      )}

      {/* Employee Uploads Tab */}
      {activeTab === 'uploads' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Employee Uploads</h3>
          <p className="text-xs text-slate-400 mt-1">Self-uploaded documents by employees for verification.</p>
          <p className="text-xs text-slate-400 mt-3">Coming soon...</p>
        </div>
      )}

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Add New Document</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-white/20 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Name *</label>
                <input
                  type="text"
                  value={docForm.name}
                  onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                  placeholder="e.g. Aadhar Card, PAN Card..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Type</label>
                <select
                  value={docForm.documentType}
                  onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="ID_PROOF">ID Proof</option>
                  <option value="ADDRESS_PROOF">Address Proof</option>
                  <option value="EDUCATION">Education Certificate</option>
                  <option value="EXPERIENCE">Experience Letter</option>
                  <option value="SALARY_SLIP">Salary Slip</option>
                  <option value="BANK_DETAILS">Bank Details</option>
                  <option value="OFFER_LETTER">Offer Letter</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Upload File</label>
                <input
                  type="file"
                  onChange={(e) => setFileInput(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 file:font-bold file:text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes (optional)</label>
                <textarea
                  value={docForm.notes}
                  onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                  rows={2}
                  placeholder="Any additional notes..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDoc}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-md transition cursor-pointer"
              >
                Save Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
