'use client';

import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Building2,
  Upload,
  Search,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Trash2,
  Eye,
  X,
  ExternalLink,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  CheckCircle2,
} from 'lucide-react';
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

const DOCUMENT_TYPES = [
  { value: 'IDENTITY', label: 'Identity Proof / Aadhar Card' },
  { value: 'OFFER_LETTER', label: 'Offer Letter' },
  { value: 'RESUME', label: 'Resume / CV' },
  { value: 'EDUCATION', label: 'Education Certificate / Marksheet' },
  { value: 'EXPERIENCE', label: 'Experience Letter' },
  { value: 'SALARY_SLIP', label: 'Salary Slip' },
  { value: 'BANK_DETAILS', label: 'Bank Details / Passbook' },
  { value: 'ADDRESS_PROOF', label: 'Address Proof' },
  { value: 'PASSPORT_PHOTO', label: 'Passport Photo' },
  { value: 'OTHER', label: 'Other Document' },
];

const DOCUMENT_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<'employee' | 'corporate' | 'uploads'>('employee');
  const [employees, setEmployees] = useState<EmployeeWithDocs[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  // Add Document Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [docForm, setDocForm] = useState({
    employeeId: '',
    name: '',
    documentType: 'IDENTITY',
    fileUrl: '',
    issuedAt: '',
    expiresAt: '',
    status: 'ACTIVE',
    notes: '',
  });
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployeeDocs();
  }, []);

  const fetchEmployeeDocs = async () => {
    setLoading(true);
    try {
      // Fetch CRM employees
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
        const initials =
          name
            .split(' ')
            .filter(Boolean)
            .map((n: string) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'EM';

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

        // Merge from allDocs for this employee
        const empDocs = allDocs.filter(
          (d: any) => d.employeeId === emp.id || d.employeeCrmId === emp.id || d.userId === emp.id
        );
        for (const d of empDocs) {
          const exists = docs.some((existing) => existing.id === d.id);
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

  const handleOpenAddModal = (empId?: string) => {
    setDocForm({
      employeeId: empId || employees[0]?.id || '',
      name: '',
      documentType: 'IDENTITY',
      fileUrl: '',
      issuedAt: '',
      expiresAt: '',
      status: 'ACTIVE',
      notes: '',
    });
    setDocError(null);
    setShowAddModal(true);
  };

  const handleSubmitDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.employeeId) {
      setDocError('Please select an employee');
      return;
    }
    if (!docForm.name.trim()) {
      setDocError('Please enter document name');
      return;
    }
    if (!docForm.fileUrl.trim()) {
      setDocError('Please enter the document link / File URL');
      return;
    }

    setSubmittingDoc(true);
    setDocError(null);

    try {
      const res = await fetch('/api/crm-documents/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: docForm.employeeId,
          name: docForm.name.trim(),
          documentType: docForm.documentType,
          fileUrl: docForm.fileUrl.trim(),
          issuedAt: docForm.issuedAt || undefined,
          expiresAt: docForm.expiresAt || undefined,
          status: docForm.status,
          notes: docForm.notes.trim() || undefined,
        }),
      });

      const resData = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(resData?.message || `Failed to add document (${res.status})`);
      }

      setSuccessToast(`Document "${docForm.name}" added successfully to CRM & HRMS!`);
      setTimeout(() => setSuccessToast(null), 4000);

      // Auto-expand the employee row that received the document
      setExpandedId(docForm.employeeId);

      // Refresh list
      await fetchEmployeeDocs();
      setShowAddModal(false);
    } catch (err: any) {
      console.error('CRM doc add error:', err);
      setDocError(err.message || 'Failed to save document. Please check the fields and try again.');
    } finally {
      setSubmittingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId: string, docName: string) => {
    if (!confirm(`Are you sure you want to delete "${docName}"? This will remove it from both CRM and HRMS.`)) {
      return;
    }

    setDeletingDocId(docId);
    try {
      const res = await fetch(`/api/crm-documents/${docId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'Failed to delete document from CRM');
      }

      setSuccessToast(`Document "${docName}" deleted successfully.`);
      setTimeout(() => setSuccessToast(null), 4000);

      // Refresh list
      await fetchEmployeeDocs();
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    } finally {
      setDeletingDocId(null);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Employee documents and verification records ({totalDocs} total documents).
          </p>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}
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
            placeholder="Search employee, ID, document name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
        </div>
        <button
          onClick={() => handleOpenAddModal()}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Document
        </button>
        <button
          onClick={fetchEmployeeDocs}
          title="Refresh Documents"
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Employee Documents Tab */}
      {activeTab === 'employee' && (
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
              <span>Loading documents from CRM...</span>
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm bg-white rounded-2xl border border-slate-100 p-8">
              No employees or documents found.
            </div>
          ) : (
            paginated.map((emp) => (
              <div
                key={emp.id}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs transition hover:border-slate-200"
              >
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-black shrink-0">
                      {emp.initials}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{emp.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{emp.employeeId || 'No ID'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex items-center gap-1.5 text-xs font-bold ${
                        emp.docs.length > 0 ? 'text-orange-600' : 'text-slate-400'
                      }`}
                    >
                      <FolderOpen className="w-3.5 h-3.5" /> {emp.docs.length} docs
                    </span>
                    <button
                      onClick={() => handleOpenAddModal(emp.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition cursor-pointer"
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
                      <div
                        key={doc.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded-xl border border-slate-100 text-xs shadow-2xs hover:border-slate-200 transition"
                      >
                        <div className="flex items-start gap-2.5">
                          <FileText className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-2">
                              <span>{doc.name}</span>
                              {doc.fileUrl && (
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open Link"
                                  className="text-orange-500 hover:text-orange-700 hover:underline flex items-center gap-0.5 text-[11px] font-semibold"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                              <span className="font-medium text-slate-600">{doc.documentType}</span>
                              {doc.issuedAt && <span>• Issued: {doc.issuedAt.split('T')[0]}</span>}
                              {doc.expiresAt && <span>• Expires: {doc.expiresAt.split('T')[0]}</span>}
                              {doc.notes && <span className="italic text-slate-400">"{doc.notes}"</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              doc.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-700'
                                : doc.status === 'EXPIRED'
                                ? 'bg-rose-100 text-rose-700'
                                : doc.status === 'REJECTED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {doc.status}
                          </span>

                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </a>
                          )}

                          <button
                            onClick={() => handleDeleteDoc(doc.id, doc.name)}
                            disabled={deletingDocId === doc.id}
                            title="Delete Document"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                          >
                            {deletingDocId === doc.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {expandedId === emp.id && emp.docs.length === 0 && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 text-xs text-slate-400 text-center">
                    No documents uploaded yet.{' '}
                    <button
                      onClick={() => handleOpenAddModal(emp.id)}
                      className="text-orange-600 font-bold underline hover:text-orange-700 cursor-pointer ml-1"
                    >
                      Add first document
                    </button>
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

      {/* Add Employee Document Modal - Exactly Matching CRM */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Add Employee Document</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Alert */}
            {docError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{docError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSubmitDoc} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Employee Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Employee *
                </label>
                <select
                  value={docForm.employeeId}
                  onChange={(e) => setDocForm({ ...docForm, employeeId: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-slate-800 cursor-pointer"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.employeeId ? `(${emp.employeeId})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Document Name *
                </label>
                <input
                  type="text"
                  required
                  value={docForm.name}
                  onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                  placeholder="e.g. Aadhar Card, Offer Letter, Resume..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-slate-800"
                />
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Document Type
                </label>
                <select
                  value={docForm.documentType}
                  onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-slate-800 cursor-pointer"
                >
                  {DOCUMENT_TYPES.map((dt) => (
                    <option key={dt.value} value={dt.value}>
                      {dt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* File URL (Google Drive / Online Link) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  File URL *
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    required
                    value={docForm.fileUrl}
                    onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
                    placeholder="https://drive.google.com/file/d/... or document URL"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-slate-800"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Paste Google Drive, Dropbox, OneDrive, or document view link.
                </p>
              </div>

              {/* Issued Date & Expiry Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Issued Date
                  </label>
                  <input
                    type="date"
                    value={docForm.issuedAt}
                    onChange={(e) => setDocForm({ ...docForm, issuedAt: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={docForm.expiresAt}
                    onChange={(e) => setDocForm({ ...docForm, expiresAt: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-slate-800"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={docForm.status}
                  onChange={(e) => setDocForm({ ...docForm, status: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-slate-800 cursor-pointer"
                >
                  {DOCUMENT_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={docForm.notes}
                  onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                  rows={2}
                  placeholder="Any additional notes..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none text-slate-800"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDoc}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{submittingDoc ? 'Saving...' : 'Save Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
