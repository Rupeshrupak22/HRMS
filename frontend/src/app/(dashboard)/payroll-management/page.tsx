'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Plus, FileSpreadsheet, X, Edit2, Trash2, AlertCircle, Loader2, Users, FileText, DollarSign, TrendingDown, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiRequest } from '@/lib/api';

const HEADERS = [
  'Employee ID',
  'Employee Name',
  'Department',
  'Join Date',
  'Exit Date (if)',
  'Working Days',
  'Attendance Freeze',
  'Freeze Reason',
  'Leaves Taken',
  'LOP Days',
  'Salary Change Date',
  'Old Salary',
  'New Salary',
  'Salary Change Reason',
  'Performance Rating',
  'Performance Comment',
  'Deduction Type',
  'LOP Deduction',
  'NET Pay',
  'Verified By',
  'Verification Date',
  'Head Approval',
  'Head Approval Date',
  'Head Signature'
];

const headerToDBField: Record<string, string> = {
  'Employee ID': 'employeeId',
  'Employee Name': 'employeeName',
  'Department': 'department',
  'Join Date': 'joinDate',
  'Exit Date (if)': 'exitDate',
  'Working Days': 'workingDays',
  'Attendance Freeze': 'attendanceFreeze',
  'Freeze Reason': 'freezeReason',
  'Leaves Taken': 'leavesTaken',
  'LOP Days': 'lopDays',
  'Salary Change Date': 'salaryChangeDate',
  'Old Salary': 'oldSalary',
  'New Salary': 'newSalary',
  'Salary Change Reason': 'salaryChangeReason',
  'Performance Rating': 'performanceRating',
  'Performance Comment': 'performanceComment',
  'Deduction Type': 'deductionType',
  'LOP Deduction': 'lopDeduction',
  'NET Pay': 'netPay',
  'Verified By': 'verifiedBy',
  'Verification Date': 'verificationDate',
  'Head Approval': 'headApproval',
  'Head Approval Date': 'headApprovalDate',
  'Head Signature': 'headSignature',
};

const mapToDB = (entry: any) => {
  const dbRecord: any = {};
  for (const header of HEADERS) {
    const field = headerToDBField[header];
    if (entry[header] !== undefined) {
      dbRecord[field] = String(entry[header]);
    }
  }
  return dbRecord;
};

const mapFromDB = (record: any) => {
  const entry: any = { id: record.id };
  for (const header of HEADERS) {
    const field = headerToDBField[header];
    entry[header] = record[field] || '';
  }
  return entry;
};

export default function PayrollManagementPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentEntry, setCurrentEntry] = useState<any>({});

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: 'EDIT' | 'DELETE'; index: number | null }>({ isOpen: false, type: 'DELETE', index: null });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/payroll/manual');
      setEntries(data.map(mapFromDB));
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([HEADERS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Payroll_Import_Template.xlsx');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setLoading(true);
        const dataBuffer = evt.target?.result;
        if (!dataBuffer || typeof dataBuffer === 'string') return;
        
        const dataArr = new Uint8Array(dataBuffer as ArrayBuffer);
        const wb = XLSX.read(dataArr, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (data.length > 1) {
          const rows = data.slice(1).map((row: any) => {
            const entry: any = {};
            HEADERS.forEach((header, index) => {
              entry[header] = row[index] !== undefined && row[index] !== null ? String(row[index]) : '';
            });
            return entry;
          });
          
          const dbRecords = rows.map(mapToDB);
          await apiRequest('/payroll/manual/bulk', {
            method: 'POST',
            body: JSON.stringify({ records: dbRecords }),
          });
          await fetchRecords();
        }
      } catch (error) {
        console.error('Failed to import records:', error);
        alert('Failed to import records. Check console for details.');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const openAddModal = () => {
    const newEntry: any = {};
    HEADERS.forEach((header) => (newEntry[header] = ''));
    setCurrentEntry(newEntry);
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const openEditModal = (index: number) => {
    setCurrentEntry({ ...entries[index] });
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleModalChange = (header: string, value: string) => {
    setCurrentEntry({ ...currentEntry, [header]: value });
  };

  const handleModalSave = async () => {
    try {
      setIsSubmitting(true);
      const dbData = mapToDB(currentEntry);
      
      if (editingIndex !== null) {
        const id = currentEntry.id;
        const updatedRecord = await apiRequest(`/payroll/manual/${id}`, {
          method: 'PUT',
          body: JSON.stringify(dbData),
        });
        const updated = [...entries];
        updated[editingIndex] = mapFromDB(updatedRecord);
        setEntries(updated);
      } else {
        const newRecord = await apiRequest('/payroll/manual', {
          method: 'POST',
          body: JSON.stringify(dbData),
        });
        setEntries([mapFromDB(newRecord), ...entries]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save record:', error);
      alert('Failed to save record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreSave = () => {
    if (editingIndex !== null) {
      setConfirmModal({ isOpen: true, type: 'EDIT', index: editingIndex });
    } else {
      handleModalSave();
    }
  };

  const handleConfirmAction = async () => {
    if (confirmModal.type === 'DELETE' && confirmModal.index !== null) {
      try {
        setIsSubmitting(true);
        const id = entries[confirmModal.index].id;
        if (id) {
          await apiRequest(`/payroll/manual/${id}`, { method: 'DELETE' });
        }
        const newEntries = [...entries];
        newEntries.splice(confirmModal.index, 1);
        setEntries(newEntries);
      } catch (error) {
        console.error('Failed to delete record:', error);
        alert('Failed to delete record.');
      } finally {
        setIsSubmitting(false);
      }
    } else if (confirmModal.type === 'EDIT') {
      await handleModalSave();
    }
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  // KPI Calculation
  const totalEmployees = entries.length;
  let totalLopDays = 0;
  let totalLopDeduction = 0;
  let totalNetPay = 0;
  let totalGross = 0;

  entries.forEach(entry => {
    totalLopDays += parseFloat(entry['LOP Days'] || '0') || 0;
    totalLopDeduction += parseFloat(entry['LOP Deduction'] || '0') || 0;
    totalNetPay += parseFloat(entry['NET Pay'] || '0') || 0;
    totalGross += parseFloat(entry['New Salary'] || entry['Old Salary'] || '0') || 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-orange-600" />
            <span>Payroll Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage comprehensive payroll data, manual entries, and bulk import (XLSX/CSV).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Demo Template</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading && fileInputRef.current?.value ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>Import (XLSX/CSV)</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl saffron-gradient text-white text-xs font-bold shadow-md shadow-orange-500/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manually</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-16 h-16 text-slate-900" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Total Employees</div>
          <div className="text-3xl font-black text-slate-900">{totalEmployees}</div>
          <div className="text-[11px] text-emerald-600 mt-2 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Records Uploaded
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingDown className="w-16 h-16 text-red-600" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Total LOP Days</div>
          <div className="text-3xl font-black text-red-600">{totalLopDays.toFixed(1)}</div>
          <div className="text-[11px] text-slate-500 mt-2 font-medium">Loss of Pay Logs</div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <FileText className="w-16 h-16 text-amber-600" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Total LOP Deduction</div>
          <div className="text-3xl font-black text-amber-600">₹{totalLopDeduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-[11px] text-slate-500 mt-2 font-medium">Deducted from Gross</div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="w-16 h-16 text-emerald-600" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Net Pay Disbursement</div>
          <div className="text-3xl font-black text-emerald-600">₹{totalNetPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-[11px] text-emerald-600 mt-2 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Ready for Credit
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
        {loading && entries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-orange-500" />
            <p className="text-sm font-medium">Loading payroll records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-max">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-700 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    Actions
                  </th>
                  {HEADERS.map((header) => (
                    <th key={header} className="px-4 py-3 font-bold text-slate-700">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={HEADERS.length + 1} className="px-4 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <FileSpreadsheet className="w-10 h-10 text-slate-300 mb-3" />
                        <p className="font-medium text-sm text-slate-600">No payroll entries found.</p>
                        <p className="mt-1 text-xs">Add manually or import from a file to get started.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, rowIndex) => (
                    <tr key={entry.id || rowIndex} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 flex items-center gap-1 min-w-[90px]">
                        <button
                          onClick={() => openEditModal(rowIndex)}
                          className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit Entry"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmModal({ isOpen: true, type: 'DELETE', index: rowIndex })}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                      {HEADERS.map((header) => (
                        <td key={header} className="px-4 py-3 text-slate-700">
                          {entry[header] || <span className="text-slate-300">-</span>}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                {editingIndex !== null ? (
                  <><Edit2 className="w-5 h-5 text-orange-600" /> Edit Payroll Entry</>
                ) : (
                  <><Plus className="w-5 h-5 text-orange-600" /> Add Payroll Entry</>
                )}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {HEADERS.map(header => (
                  <div key={header} className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{header}</label>
                    <input
                      type="text"
                      value={currentEntry[header] || ''}
                      onChange={(e) => handleModalChange(header, e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder-slate-500 shadow-sm"
                      placeholder={`Enter ${header}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePreSave}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white saffron-gradient shadow-md shadow-orange-500/20 hover:shadow-orange-500/40 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingIndex !== null ? 'Save Changes' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col p-6 text-center">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-4">
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
              ) : (
                <AlertCircle className="w-6 h-6 text-orange-600" />
              )}
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">
              {confirmModal.type === 'DELETE' ? 'Delete Entry?' : 'Save Changes?'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {confirmModal.type === 'DELETE' 
                ? 'Are you sure you want to delete this payroll entry? This action cannot be undone.'
                : 'Are you sure you want to apply these changes to the payroll entry?'}
            </p>
            <div className="flex items-center gap-3 w-full">
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmAction}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md disabled:opacity-50 ${
                  confirmModal.type === 'DELETE' 
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                    : 'saffron-gradient shadow-orange-500/20'
                }`}
              >
                Yes, {confirmModal.type === 'DELETE' ? 'Delete' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
