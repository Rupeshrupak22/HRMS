'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Download,
  Key,
  Eye,
  Building2,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  X,
  UserCheck,
  UserX,
  Layers,
  CreditCard,
  MapPin,
  Plus,
  Pencil,
  Save,
  Loader2,
  AlertTriangle,
  Trash2,
  Lock,
  EyeOff,
  UserPlus,
  Filter,
  DollarSign,
  ChevronRight,
  Shield,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Pagination } from '@/components/Pagination';
import { apiRequest } from '@/lib/api';

interface EmployeeRecord {
  id?: string | number;
  _id?: string | number;
  empId?: string;
  employeeId?: string;
  employeeCode?: string;
  empCode?: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  officialEmail?: string;
  personalEmail?: string;
  mobile?: string;
  phone?: string;
  mobileNumber?: string;
  contactNumber?: string;
  department?: string;
  departmentName?: string;
  designation?: string;
  role?: string;
  specialization?: string;
  teamId?: string;
  teamName?: string;
  reportingManager?: string;
  isActive?: boolean;
  status?: string;
  employeeStatus?: string;
  joiningDate?: string;
  dateOfJoining?: string;
  onboardingDate?: string;
  dateOfBirth?: string;
  gender?: string;
  employmentType?: string;
  baseSalary?: number | string;
  ctc?: number | string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  panNumber?: string;
  uanNumber?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  probationPeriod?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

const INITIAL_FORM_DATA = {
  id: '',
  name: '',
  email: '',
  password: 'Adyapan@123',
  mobile: '',
  employeeId: '',
  designation: '',
  role: 'EMPLOYEE',
  department: '',
  teamName: '',
  teamId: '',
  reportingManager: '',
  isActive: true,
  employmentType: 'FULL_TIME',
  gender: 'MALE',
  dateOfBirth: '',
  joiningDate: '',
  onboardingDate: '',
  baseSalary: 0,
  bankName: '',
  bankAccountNumber: '',
  bankIfsc: '',
  panNumber: '',
  uanNumber: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  notes: '',
};

export function EmployeeMaster() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal states
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [customToken, setCustomToken] = useState<string>('');

  // Add / Edit Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<typeof INITIAL_FORM_DATA>(INITIAL_FORM_DATA);
  const [showPassword, setShowPassword] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'job' | 'payroll' | 'contact'>('basic');

  // Delete Modal states
  const [deleteTarget, setDeleteTarget] = useState<EmployeeRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load custom token from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored =
        localStorage.getItem('adyapan_crm_bearer_token') ||
        localStorage.getItem('adyapan_access_token') ||
        localStorage.getItem('token') ||
        '';
      if (stored) {
        setCustomToken(stored);
      }
      fetchEmployees(stored);
    }
  }, []);

  const fetchEmployees = async (overrideToken?: string) => {
    setLoading(true);
    setError(null);

    const tokenToUse =
      overrideToken !== undefined
        ? overrideToken
        : customToken ||
          (typeof window !== 'undefined'
            ? localStorage.getItem('adyapan_crm_bearer_token') ||
              localStorage.getItem('adyapan_access_token') ||
              localStorage.getItem('token') ||
              ''
            : '');

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (tokenToUse) {
      headers['Authorization'] = tokenToUse.startsWith('Bearer ')
        ? tokenToUse
        : `Bearer ${tokenToUse}`;
    }

    try {
      let list: EmployeeRecord[] = [];
      let teamList: any[] = [];

      try {
        const endpoint = `/api/crm/employees${tokenToUse ? `?token=${encodeURIComponent(tokenToUse)}` : ''}`;
        const res = await fetch(endpoint, {
          method: 'GET',
          headers,
        });

        const json = await res.json().catch(() => null);

        if (res.ok && json) {
          if (Array.isArray(json)) {
            list = json;
          } else if (json && Array.isArray(json.employees)) {
            list = json.employees;
            if (Array.isArray(json.teams)) teamList = json.teams;
          } else if (json && Array.isArray(json.data)) {
            list = json.data;
            if (Array.isArray(json.teams)) teamList = json.teams;
          } else if (json && json.data && Array.isArray(json.data.employees)) {
            list = json.data.employees;
            if (Array.isArray(json.data.teams)) teamList = json.data.teams;
          } else if (json && typeof json === 'object') {
            const potentialArray = Object.values(json).find((val) => Array.isArray(val));
            if (potentialArray && Array.isArray(potentialArray)) {
              list = potentialArray as EmployeeRecord[];
            }
          }
        }
      } catch (crmErr) {
        console.warn('CRM proxy fetch error, falling back to internal HRMS DB:', crmErr);
      }

      // Fallback to internal HRMS database if CRM list is empty or failed
      if (list.length === 0) {
        try {
          const internalRes = await apiRequest('/employees');
          const internalList = Array.isArray(internalRes)
            ? internalRes
            : internalRes?.data && Array.isArray(internalRes.data)
            ? internalRes.data
            : [];

          if (internalList.length > 0) {
            list = internalList.map((emp: any) => ({
              id: emp.id,
              name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || 'Employee',
              email: emp.user?.email || emp.email || '',
              phone: emp.phone || emp.mobileNumber || '',
              department: emp.department?.name || (typeof emp.department === 'string' ? emp.department : 'General'),
              designation: emp.designation?.title || (typeof emp.designation === 'string' ? emp.designation : 'Staff'),
              role: emp.user?.role || emp.role || 'EMPLOYEE',
              employmentType: emp.employmentType || 'FULL_TIME',
              gender: emp.gender || 'MALE',
              status: emp.status || 'ACTIVE',
              employeeId: emp.employeeCode || emp.id,
              joiningDate: emp.dateOfJoining || emp.createdAt,
              manager: emp.manager ? `${emp.manager.firstName || ''} ${emp.manager.lastName || ''}`.trim() : '-',
              salary: emp.salaryStructure?.netSalary ? String(emp.salaryStructure.netSalary) : '-',
              teamId: emp.teamId || emp.team?.id,
              teamName: emp.team?.name,
              isTeamLead: emp.isTeamLead || false,
              raw: emp,
            }));
          }
        } catch (dbErr) {
          console.warn('Internal DB employee fetch error:', dbErr);
        }
      }

      setEmployees(list);
      if (teamList.length > 0) setTeams(teamList);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to fetch employee master:', err);
      setError(err.message || 'Failed to fetch employee master data.');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToken = (token: string) => {
    const cleanToken = token.trim();
    setCustomToken(cleanToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('adyapan_crm_bearer_token', cleanToken);
    }
    setShowTokenModal(false);
    fetchEmployees(cleanToken);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormMode('create');
    setFormData({ ...INITIAL_FORM_DATA, password: 'Adyapan@123' });
    setFormError(null);
    setShowPassword(false);
    setActiveFormTab('basic');
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (emp: EmployeeRecord) => {
    setFormMode('edit');
    setFormError(null);
    setShowPassword(false);
    setActiveFormTab('basic');

    const formatDateForInput = (d?: string) => {
      if (!d) return '';
      try {
        return d.split('T')[0];
      } catch {
        return '';
      }
    };

    setFormData({
      id: String(emp.id || emp._id || ''),
      name: getEmpName(emp),
      email: getEmpEmail(emp) !== '—' ? getEmpEmail(emp) : '',
      password: '',
      mobile: getEmpPhone(emp) !== '—' ? getEmpPhone(emp) : '',
      employeeId: String(getEmpCode(emp) !== 'N/A' ? getEmpCode(emp) : ''),
      designation: getEmpDesignation(emp) !== 'Staff' ? getEmpDesignation(emp) : '',
      role: emp.role || 'EMPLOYEE',
      department: getEmpDept(emp) !== 'General' ? getEmpDept(emp) : '',
      teamName: getEmpTeam(emp) !== '—' ? getEmpTeam(emp) : '',
      teamId: emp.teamId || '',
      reportingManager: emp.reportingManager || '',
      isActive: getEmpStatus(emp) === 'ACTIVE',
      employmentType: sanitizeEmploymentType(emp.employmentType),
      gender: sanitizeGender(emp.gender),
      dateOfBirth: formatDateForInput(emp.dateOfBirth),
      joiningDate: formatDateForInput(emp.joiningDate || emp.dateOfJoining),
      onboardingDate: formatDateForInput(emp.onboardingDate),
      baseSalary: Number(emp.baseSalary || 0),
      bankName: emp.bankName || '',
      bankAccountNumber: emp.bankAccountNumber || '',
      bankIfsc: emp.bankIfsc || '',
      panNumber: emp.panNumber || '',
      uanNumber: emp.uanNumber || '',
      address: emp.address || '',
      emergencyContactName: emp.emergencyContactName || '',
      emergencyContactPhone: emp.emergencyContactPhone || '',
      notes: emp.notes || '',
    });

    setIsFormModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    const tokenToUse =
      customToken ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('adyapan_crm_bearer_token') ||
          localStorage.getItem('adyapan_access_token') ||
          localStorage.getItem('token') ||
          ''
        : '');

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (tokenToUse) {
      headers['Authorization'] = tokenToUse.startsWith('Bearer ')
        ? tokenToUse
        : `Bearer ${tokenToUse}`;
    }

    try {
      const validRoles = [
        'EMPLOYEE',
        'ADMIN',
        'SUPER_ADMIN',
        'HR_ADMIN',
        'HR_EXECUTIVE',
        'HR',
        'MANAGER',
        'TEAM_LEAD',
        'TEAM_LEADER',
        'COUNSELOR',
        'TELECALLER',
        'DEVELOPER',
      ];
      const roleUpper = String(formData.role || '').trim().toUpperCase();
      const sanitizedRole = validRoles.includes(roleUpper) ? roleUpper : 'EMPLOYEE';

      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        employeeId: formData.employeeId.trim(),
        designation: formData.designation.trim(),
        role: sanitizedRole,
        department: formData.department.trim(),
        teamName: formData.teamName.trim(),
        teamId: formData.teamId || undefined,
        reportingManager: formData.reportingManager.trim(),
        isActive: Boolean(formData.isActive),
        status: formData.isActive ? 'ACTIVE' : 'INACTIVE',
        employmentType: sanitizeEmploymentType(formData.employmentType),
        gender: sanitizeGender(formData.gender),
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
        joiningDate: formData.joiningDate ? new Date(formData.joiningDate).toISOString() : undefined,
        onboardingDate: formData.onboardingDate ? new Date(formData.onboardingDate).toISOString() : undefined,
        baseSalary: Number(formData.baseSalary) || 0,
        bankName: formData.bankName.trim(),
        bankAccountNumber: formData.bankAccountNumber.trim(),
        bankIfsc: formData.bankIfsc.trim(),
        panNumber: formData.panNumber.trim(),
        uanNumber: formData.uanNumber.trim(),
        address: formData.address.trim(),
        emergencyContactName: formData.emergencyContactName.trim(),
        emergencyContactPhone: formData.emergencyContactPhone.trim(),
        notes: formData.notes.trim(),
      };

      // Always supply password to satisfy CRM API validation
      payload.password = formData.password?.trim() || 'Adyapan@123';

      let endpoint = `/api/crm/employees${tokenToUse ? `?token=${encodeURIComponent(tokenToUse)}` : ''}`;
      let method = 'POST';

      if (formMode === 'edit') {
        method = 'PUT';
        const separator = endpoint.includes('?') ? '&' : '?';
        endpoint += `${separator}id=${encodeURIComponent(formData.id)}`;
        payload.id = formData.id;
      }

      let isSuccess = false;
      let result: any = null;

      try {
        const res = await fetch(endpoint, {
          method,
          headers,
          body: JSON.stringify(payload),
        });

        result = await res.json().catch(() => null);

        if (res.ok) {
          isSuccess = true;
        } else {
          console.warn('CRM API responded with error:', result);
        }
      } catch (crmErr) {
        console.warn('CRM API submission failed, using internal database fallback:', crmErr);
      }

      // If CRM failed (e.g. role is invalid or unauthorized), fallback to internal HRMS PostgreSQL database
      if (!isSuccess) {
        try {
          const names = formData.name.trim().split(' ');
          const internalBody: any = {
            firstName: names[0] || formData.name.trim(),
            lastName: names.slice(1).join(' ') || '',
            email: formData.email.trim(),
            phone: formData.mobile.trim(),
            employeeCode: formData.employeeId.trim(),
            role: sanitizedRole,
            department: formData.department.trim(),
            designation: formData.designation.trim(),
            status: formData.isActive ? 'ACTIVE' : 'INACTIVE',
            employmentType: sanitizeEmploymentType(formData.employmentType),
            gender: sanitizeGender(formData.gender),
            dateOfJoining: formData.joiningDate ? new Date(formData.joiningDate).toISOString() : undefined,
          };

          if (formMode === 'create') {
            await apiRequest('/employees', {
              method: 'POST',
              body: JSON.stringify(internalBody),
            });
          } else if (formData.id) {
            await apiRequest(`/employees/${formData.id}`, {
              method: 'PATCH',
              body: JSON.stringify(internalBody),
            }).catch(() => {
              return apiRequest('/employees', {
                method: 'POST',
                body: JSON.stringify(internalBody),
              });
            });
          }
          isSuccess = true;
        } catch (dbErr: any) {
          throw new Error(result?.message || dbErr?.message || `Failed to ${formMode === 'create' ? 'create' : 'update'} employee`);
        }
      }

      setIsFormModalOpen(false);
      setSuccessMessage(
        formMode === 'create'
          ? `Employee ${formData.name} added successfully!`
          : `Employee ${formData.name} updated successfully!`
      );
      setTimeout(() => setSuccessMessage(null), 4000);

      // Refresh list
      fetchEmployees();
      if (selectedEmployee && selectedEmployee.id === formData.id) {
        setSelectedEmployee({ ...selectedEmployee, ...payload });
      }
    } catch (err: any) {
      console.error('Form submission error:', err);
      setFormError(err.message || 'Operation failed. Please verify your fields.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Employee Handler
  const handleDeleteEmployee = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const tokenToUse =
      customToken ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('adyapan_crm_bearer_token') ||
          localStorage.getItem('adyapan_access_token') ||
          localStorage.getItem('token') ||
          ''
        : '');

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (tokenToUse) {
      headers['Authorization'] = tokenToUse.startsWith('Bearer ')
        ? tokenToUse
        : `Bearer ${tokenToUse}`;
    }

    try {
      const targetId = deleteTarget.id || deleteTarget._id || '';
      const endpoint = `/api/crm/employees?id=${encodeURIComponent(String(targetId))}${tokenToUse ? `&token=${encodeURIComponent(tokenToUse)}` : ''}`;

      let isDeleted = false;
      try {
        const res = await fetch(endpoint, {
          method: 'DELETE',
          headers,
        });
        if (res.ok) isDeleted = true;
      } catch (crmErr) {
        console.warn('CRM delete failed, deleting from internal DB:', crmErr);
      }

      if (!isDeleted && targetId) {
        await apiRequest(`/employees/${targetId}`, { method: 'DELETE' }).catch(() => {});
      }

      setEmployees((prev) => prev.filter((e) => (e.id || e._id) !== targetId));
      if (selectedEmployee && (selectedEmployee.id || selectedEmployee._id) === targetId) {
        setSelectedEmployee(null);
      }
      setSuccessMessage(`Employee ${getEmpName(deleteTarget)} has been removed successfully.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete employee.');
    } finally {
      setDeleting(false);
    }
  };

  const getEmpInitials = (name: string) => {
    return (
      name
        .split(' ')
        .filter((n: string) => Boolean(n))
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'EM'
    );
  };

  function sanitizeEmploymentType(type?: string) {
    const clean = String(type || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (clean.includes('FULL') || clean === 'FT') return 'FULL_TIME';
    if (clean.includes('PART') || clean === 'PT') return 'PART_TIME';
    if (clean.includes('INTERN')) return 'INTERNSHIP';
    if (clean.includes('CONTRACT')) return 'CONTRACT';
    if (clean.includes('PROBATION')) return 'PROBATION';
    if (clean.includes('FREELANCE')) return 'FREELANCE';
    return 'FULL_TIME';
  }

  function sanitizeGender(gender?: string) {
    const clean = String(gender || '').trim().toUpperCase();
    if (clean.startsWith('F')) return 'FEMALE';
    if (clean.startsWith('O')) return 'OTHER';
    return 'MALE';
  }

  // Normalizer helpers
  const getEmpName = (emp: EmployeeRecord) => {
    if (emp.name) return emp.name;
    if (emp.fullName) return emp.fullName;
    if (emp.firstName || emp.lastName) {
      return `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
    }
    if (emp.employeeName) return emp.employeeName;
    return 'Unnamed Employee';
  };

  const getEmpCode = (emp: EmployeeRecord) => {
    return emp.employeeId || emp.employeeCode || emp.empCode || emp.empId || emp.code || emp.id || 'N/A';
  };

  const getEmpEmail = (emp: EmployeeRecord) => {
    return emp.email || emp.officialEmail || emp.personalEmail || '—';
  };

  const getEmpPhone = (emp: EmployeeRecord) => {
    return emp.mobile || emp.phone || emp.mobileNumber || emp.contactNumber || '—';
  };

  const getEmpDept = (emp: EmployeeRecord) => {
    return emp.department || emp.departmentName || emp.dept || emp.teamName || 'General';
  };

  const getEmpTeam = (emp: EmployeeRecord) => {
    return emp.teamName || (emp.team && typeof emp.team === 'object' ? emp.team.name : '') || '—';
  };

  const getEmpDesignation = (emp: EmployeeRecord) => {
    return emp.designation || emp.role || emp.designationTitle || emp.jobTitle || 'Staff';
  };

  const getEmpStatus = (emp: EmployeeRecord) => {
    if (emp.isActive !== undefined) {
      return emp.isActive ? 'ACTIVE' : 'INACTIVE';
    }
    const raw = String(emp.status || emp.employeeStatus || 'Active').toUpperCase();
    if (raw.includes('ACT') || raw === '1' || raw === 'TRUE') return 'ACTIVE';
    if (raw.includes('INACT') || raw.includes('RESIGN') || raw.includes('EXIT') || raw === '0') return 'INACTIVE';
    if (raw.includes('LEAVE')) return 'ON_LEAVE';
    return raw;
  };

  const getEmpJoiningDate = (emp: EmployeeRecord) => {
    const d = emp.joiningDate || emp.dateOfJoining || emp.onboardingDate || emp.createdAt;
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(d);
    }
  };

  // Distinct filters
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      const d = getEmpDept(e);
      if (d && d !== 'General' && d !== '—') set.add(d);
    });
    return Array.from(set).sort();
  }, [employees]);

  const teamListNames = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      const t = getEmpTeam(e);
      if (t && t !== '—') set.add(t);
    });
    teams.forEach((t) => {
      if (t.name) set.add(t.name);
    });
    return Array.from(set).sort();
  }, [employees, teams]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const q = search.toLowerCase().trim();
      const name = getEmpName(emp).toLowerCase();
      const code = String(getEmpCode(emp)).toLowerCase();
      const email = getEmpEmail(emp).toLowerCase();
      const phone = getEmpPhone(emp).toLowerCase();
      const dept = getEmpDept(emp);
      const team = getEmpTeam(emp);
      const desig = getEmpDesignation(emp).toLowerCase();
      const status = getEmpStatus(emp);

      const matchesSearch =
        !q ||
        name.includes(q) ||
        code.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        desig.includes(q);

      const matchesDept = selectedDepartment === 'ALL' || dept === selectedDepartment;
      const matchesTeam = selectedTeam === 'ALL' || team === selectedTeam;
      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && status === 'ACTIVE') ||
        (selectedStatus === 'INACTIVE' && status === 'INACTIVE');

      return matchesSearch && matchesDept && matchesTeam && matchesStatus;
    });
  }, [employees, search, selectedDepartment, selectedTeam, selectedStatus]);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setPage(1);
  }, [search, selectedDepartment, selectedTeam, selectedStatus]);

  const paginatedEmployees = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredEmployees.slice(start, start + PAGE_SIZE);
  }, [filteredEmployees, page]);

  // Metrics
  const metrics = useMemo(() => {
    const total = employees.length;
    let active = 0;
    let inactive = 0;
    employees.forEach((e) => {
      if (getEmpStatus(e) === 'ACTIVE') active++;
      else inactive++;
    });
    return {
      total,
      active,
      inactive,
      departmentsCount: departments.length,
      teamsCount: teamListNames.length,
    };
  }, [employees, departments, teamListNames]);

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredEmployees.length === 0) {
      alert('No employee records available to export.');
      return;
    }

    const rows = filteredEmployees.map((emp, index) => ({
      'Sl No': index + 1,
      'Employee ID': getEmpCode(emp),
      'Full Name': getEmpName(emp),
      'Email': getEmpEmail(emp),
      'Mobile': getEmpPhone(emp),
      'Gender': emp.gender || '—',
      'Date of Birth': emp.dateOfBirth ? String(emp.dateOfBirth).split('T')[0] : '—',
      'Department': getEmpDept(emp),
      'Designation': getEmpDesignation(emp),
      'Role': emp.role || '—',
      'Team': getEmpTeam(emp),
      'Reporting Manager': emp.reportingManager || '—',
      'Status': getEmpStatus(emp),
      'Employment Type': emp.employmentType || 'Full Time',
      'Joining Date': getEmpJoiningDate(emp),
      'Base Salary': emp.baseSalary || 0,
      'Bank Name': emp.bankName || '—',
      'Account Number': emp.bankAccountNumber || '—',
      'IFSC Code': emp.bankIfsc || '—',
      'PAN': emp.panNumber || '—',
      'UAN': emp.uanNumber || '—',
      'Address': emp.address || '—',
      'Emergency Contact': emp.emergencyContactName
        ? `${emp.emergencyContactName} (${emp.emergencyContactPhone || '—'})`
        : '—',
      'Notes': emp.notes || '—',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employee_Master');
    const now = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Employee_Master_${now}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 lg:p-8 text-white shadow-xl shadow-indigo-950/20 border border-slate-800/80 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl pointer-events-none -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30">
              <Shield className="w-3.5 h-3.5" />
              <span>HR Central Master Directory</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Employee Master
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Complete organizational employee roster with job roles, compensation, and direct record management.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchEmployees()}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              title="Refresh Master List"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={employees.length === 0}
              className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-emerald-300 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 border border-indigo-500/50"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-white">{metrics.total}</div>
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Staff</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-emerald-400">{metrics.active}</div>
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Staff</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 border border-rose-500/30">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-rose-400">{metrics.inactive}</div>
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Inactive / Left</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-purple-300">{metrics.departmentsCount}</div>
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Departments</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wider">Unable to load employee master</h4>
              <p className="text-xs text-rose-700 mt-1">{error}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTokenModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Configure Auth Key</span>
            </button>
            <button
              onClick={() => fetchEmployees()}
              className="px-3.5 py-2 bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department:</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Departments ({departments.length})</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Team Filter */}
          {teamListNames.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Team:</span>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Teams ({teamListNames.length})</option>
                {teamListNames.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Staff</option>
              <option value="INACTIVE">Inactive / Archived</option>
            </select>
          </div>
        </div>

        {/* Search Field */}
        <div className="flex-1 min-w-[240px] max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Name, Employee Code, Email, Role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Status Badge */}
      {(selectedDepartment !== 'ALL' || selectedTeam !== 'ALL' || selectedStatus !== 'ALL' || search) && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1 -mt-3">
          <span>
            Showing <strong className="text-slate-800">{filteredEmployees.length}</strong> of{' '}
            <strong className="text-slate-800">{employees.length}</strong> master records
            {selectedDepartment !== 'ALL' && <span> • Dept: <strong>{selectedDepartment}</strong></span>}
            {selectedTeam !== 'ALL' && <span> • Team: <strong>{selectedTeam}</strong></span>}
            {selectedStatus !== 'ALL' && <span> • Status: <strong>{selectedStatus}</strong></span>}
          </span>
          <button
            onClick={() => {
              setSelectedDepartment('ALL');
              setSelectedTeam('ALL');
              setSelectedStatus('ALL');
              setSearch('');
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Main Employee Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sticky left-0 bg-slate-50/95 z-10 min-w-[70px]">Sl No</th>
                <th className="py-3.5 px-4 min-w-[110px]">Emp Code</th>
                <th className="py-3.5 px-4 min-w-[200px]">Employee Name</th>
                <th className="py-3.5 px-4 min-w-[150px]">Designation & Role</th>
                <th className="py-3.5 px-4 min-w-[140px]">Department</th>
                <th className="py-3.5 px-4 min-w-[130px]">Team</th>
                <th className="py-3.5 px-4 min-w-[160px]">Contact Info</th>
                <th className="py-3.5 px-4 min-w-[110px]">Joining Date</th>
                <th className="py-3.5 px-4 min-w-[100px] text-center">Status</th>
                <th className="py-3.5 px-4 text-center sticky right-0 bg-slate-50/95 z-10 min-w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                      <span className="text-xs font-semibold text-slate-600">Loading master employee directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-10 h-10 text-slate-300" />
                      <span className="text-sm font-bold text-slate-700">No employees found</span>
                      <span className="text-xs text-slate-400">Try changing your search or filter criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp, idx) => {
                  const slNo = (page - 1) * PAGE_SIZE + idx + 1;
                  const empName = getEmpName(emp);
                  const empCode = getEmpCode(emp);
                  const empEmail = getEmpEmail(emp);
                  const empPhone = getEmpPhone(emp);
                  const empDept = getEmpDept(emp);
                  const empTeam = getEmpTeam(emp);
                  const empDesig = getEmpDesignation(emp);
                  const status = getEmpStatus(emp);
                  const joiningDate = getEmpJoiningDate(emp);
                  const initials = getEmpInitials(empName);

                  return (
                    <tr
                      key={emp.id || emp._id || idx}
                      className="hover:bg-indigo-50/30 transition-colors group text-slate-700"
                    >
                      {/* Sl No */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-400 sticky left-0 bg-white group-hover:bg-indigo-50/30 z-10">
                        {slNo}
                      </td>

                      {/* Code */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-indigo-900 bg-indigo-50/80 px-2 py-0.5 rounded-lg border border-indigo-100 text-[11px]">
                          {empCode}
                        </span>
                      </td>

                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                            {initials}
                          </div>
                          <div>
                            <button
                              onClick={() => setSelectedEmployee(emp)}
                              className="font-bold text-slate-900 hover:text-indigo-600 transition text-left cursor-pointer flex items-center gap-1 group-hover:underline"
                            >
                              {empName}
                            </button>
                            <div className="text-[11px] text-slate-400">{emp.gender || 'Employee'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Designation */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{empDesig}</div>
                        {emp.role && emp.role !== empDesig && (
                          <div className="text-[10px] text-slate-400">{emp.role}</div>
                        )}
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {empDept}
                        </span>
                      </td>

                      {/* Team */}
                      <td className="py-3 px-4">
                        <span className="text-slate-600 font-medium text-[11px]">{empTeam}</span>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {empEmail !== '—' && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[150px]">{empEmail}</span>
                            </div>
                          )}
                          {empPhone !== '—' && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{empPhone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Joining Date */}
                      <td className="py-3 px-4 text-slate-600 font-medium text-[11px]">
                        {joiningDate}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            INACTIVE
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center sticky right-0 bg-white group-hover:bg-indigo-50/30 z-10">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedEmployee(emp)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="View Profile Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="Edit Employee"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(emp)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalItems={filteredEmployees.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {/* Add / Edit Employee Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                  {formMode === 'create' ? <UserPlus className="w-5 h-5 text-indigo-400" /> : <Pencil className="w-5 h-5 text-indigo-400" />}
                  {formMode === 'create' ? 'Add New Employee' : `Edit Employee: ${formData.name}`}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {formMode === 'create'
                    ? 'Enter employee details and default password to add to the Master Directory.'
                    : 'Update employee information and roles.'}
                </p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message inside Modal */}
            {formError && (
              <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form Tabs */}
            <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50/50 flex gap-2 overflow-x-auto">
              {[
                { id: 'basic', label: '1. Basic Info' },
                { id: 'job', label: '2. Job & Department' },
                { id: 'payroll', label: '3. Payroll & KYC' },
                { id: 'contact', label: '4. Address & Notes' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFormTab(tab.id as any)}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                    activeFormTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Form Content */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Tab 1: Basic Info */}
              {activeFormTab === 'basic' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Employee ID / Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        placeholder="e.g. ADP0417"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. rahul@adyapan.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Password {formMode === 'create' && <span className="text-rose-500">*</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required={formMode === 'create'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder={formMode === 'create' ? 'Default: Adyapan@123' : 'Leave empty to keep unchanged'}
                          className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formMode === 'create' ? 'Default login password will be set for the employee.' : 'Enter new password only if you want to reset it.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="text"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        placeholder="e.g. 9876543210"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Gender
                      </label>
                      <select
                        value={formData.gender || 'MALE'}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 cursor-pointer"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Job & Department */}
              {activeFormTab === 'job' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Department <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="e.g. Sales, HR, Engineering"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Designation <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        placeholder="e.g. Inside Sales Specialist"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Role <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.role || 'EMPLOYEE'}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 cursor-pointer"
                      >
                        <option value="EMPLOYEE">EMPLOYEE (Staff)</option>
                        <option value="ADMIN">ADMIN (Administrator)</option>
                        <option value="HR_ADMIN">HR_ADMIN (HR Admin)</option>
                        <option value="HR_EXECUTIVE">HR_EXECUTIVE (HR Executive)</option>
                        <option value="MANAGER">MANAGER (Manager)</option>
                        <option value="TEAM_LEAD">TEAM_LEAD (Team Leader)</option>
                        <option value="COUNSELOR">COUNSELOR (Counselor)</option>
                        <option value="TELECALLER">TELECALLER (Telecaller)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Team Name
                      </label>
                      <input
                        type="text"
                        value={formData.teamName}
                        onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                        placeholder="e.g. Team Alpha"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Reporting Manager
                      </label>
                      <input
                        type="text"
                        value={formData.reportingManager}
                        onChange={(e) => setFormData({ ...formData, reportingManager: e.target.value })}
                        placeholder="e.g. Aravind / Pavitra"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Employment Type
                      </label>
                      <select
                        value={formData.employmentType || 'FULL_TIME'}
                        onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 cursor-pointer"
                      >
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="INTERNSHIP">Internship</option>
                        <option value="PROBATION">Probation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Joining Date
                      </label>
                      <input
                        type="date"
                        value={formData.joiningDate}
                        onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Status
                      </label>
                      <select
                        value={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'ACTIVE' })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 cursor-pointer"
                      >
                        <option value="ACTIVE">Active Staff</option>
                        <option value="INACTIVE">Inactive / Resigned</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Payroll & KYC */}
              {activeFormTab === 'payroll' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Base Salary (Monthly / INR)
                    </label>
                    <input
                      type="number"
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) || 0 })}
                      placeholder="e.g. 25000"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        placeholder="e.g. HDFC Bank"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={formData.bankAccountNumber}
                        onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                        placeholder="e.g. 501002345678"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={formData.bankIfsc}
                        onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value.toUpperCase() })}
                        placeholder="e.g. HDFC0001234"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono uppercase text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        value={formData.panNumber}
                        onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                        placeholder="e.g. ABCDE1234F"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono uppercase text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        UAN / PF Number
                      </label>
                      <input
                        type="text"
                        value={formData.uanNumber}
                        onChange={(e) => setFormData({ ...formData, uanNumber: e.target.value })}
                        placeholder="e.g. 101234567890"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Address & Contact */}
              {activeFormTab === 'contact' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Residential Address
                    </label>
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Full residential address..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContactName}
                        onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                        placeholder="e.g. Sunita Sharma (Mother)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Emergency Contact Phone
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContactPhone}
                        onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                        placeholder="e.g. 9876543210"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Notes / Remarks
                    </label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any additional notes or HR remarks..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  {activeFormTab !== 'contact' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeFormTab === 'basic') setActiveFormTab('job');
                        else if (activeFormTab === 'job') setActiveFormTab('payroll');
                        else if (activeFormTab === 'payroll') setActiveFormTab('contact');
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
                  >
                    {formSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{formMode === 'create' ? 'Save Employee' : 'Update Record'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Employee</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove <strong className="text-slate-800">{getEmpName(deleteTarget)}</strong> ({getEmpCode(deleteTarget)}) from the Master Directory?
              </p>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-700">
              ⚠️ This action will remove the employee record. Please confirm your decision.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteEmployee}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{deleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Detail Drawer */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-base shadow-md">
                  {getEmpInitials(getEmpName(selectedEmployee))}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">{getEmpName(selectedEmployee)}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-indigo-300 bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-700/50">
                      {getEmpCode(selectedEmployee)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        getEmpStatus(selectedEmployee) === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                      }`}
                    >
                      {getEmpStatus(selectedEmployee)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Actions row inside drawer */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEditModal(selectedEmployee);
                  }}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => {
                    setDeleteTarget(selectedEmployee);
                  }}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              {/* Organization & Role */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Organization & Job Role
                </h4>
                <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Designation</span>
                      <span className="font-bold text-slate-900">{getEmpDesignation(selectedEmployee)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Department</span>
                      <span className="font-bold text-slate-900">{getEmpDept(selectedEmployee)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Team</span>
                      <span className="font-bold text-slate-900">{getEmpTeam(selectedEmployee)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Role</span>
                      <span className="font-bold text-slate-900">{selectedEmployee.role || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Reporting Manager</span>
                      <span className="font-bold text-slate-900">{selectedEmployee.reportingManager || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Joining Date</span>
                      <span className="font-bold text-slate-900">{getEmpJoiningDate(selectedEmployee)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Contact Information
                </h4>
                <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Official Email</span>
                      <span className="font-mono font-semibold text-slate-800">{getEmpEmail(selectedEmployee)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Mobile Phone</span>
                      <span className="font-mono font-semibold text-slate-800">{getEmpPhone(selectedEmployee)}</span>
                    </div>
                    {selectedEmployee.address && (
                      <div className="pt-2 border-t border-slate-200/60">
                        <span className="text-slate-400 text-[11px] block">Address</span>
                        <span className="text-slate-700">{selectedEmployee.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Banking & KYC */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Payroll, Banking & KYC
                </h4>
                <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Base Salary</span>
                      <span className="font-mono font-bold text-emerald-700">
                        ₹{Number(selectedEmployee.baseSalary || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Bank Name</span>
                      <span className="font-bold text-slate-900">{selectedEmployee.bankName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Number</span>
                      <span className="font-mono font-bold text-slate-900">{selectedEmployee.bankAccountNumber || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">IFSC Code</span>
                      <span className="font-mono font-bold text-slate-900">{selectedEmployee.bankIfsc || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">PAN Number</span>
                      <span className="font-mono font-bold text-slate-900">{selectedEmployee.panNumber || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">UAN Number</span>
                      <span className="font-mono font-bold text-slate-900">{selectedEmployee.uanNumber || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {selectedEmployee.emergencyContactName && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Emergency Contact
                  </h4>
                  <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">{selectedEmployee.emergencyContactName}</span>
                      <span className="font-mono font-bold text-slate-900">{selectedEmployee.emergencyContactPhone || '—'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedEmployee.notes && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes</h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedEmployee.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Key Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Configure Master Key</h3>
              </div>
              <button onClick={() => setShowTokenModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Provide your API authentication session key to synchronize with the Master Employee Directory.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = (e.currentTarget.elements.namedItem('token') as HTMLInputElement).value;
                handleSaveToken(input);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Bearer Token
                </label>
                <textarea
                  name="token"
                  defaultValue={customToken}
                  rows={3}
                  placeholder="Paste JWT / Bearer token here..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono text-slate-800"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTokenModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save & Connect</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
