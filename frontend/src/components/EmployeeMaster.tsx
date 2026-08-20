'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Download,
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
  team?: any;
  reportingManager?: string;
  manager?: string;
  teamLeader?: string;
  teamLead?: string;
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
  bloodGroup?: string;
  permanentAddress?: string;
  documents?: any[];
  ojtStartDate?: string;
  ojtEndDate?: string;
  trainingStartDate?: string;
  trainingEndDate?: string;
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

  // Load employees on mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);

    try {
      let list: EmployeeRecord[] = [];

      // PRIMARY: Fetch from CRM API
      try {
        const crmRes = await fetch('/api/crm-employees');
        if (crmRes.ok) {
          const crmJson = await crmRes.json();
          const crmList: any[] = Array.isArray(crmJson) ? crmJson : (crmJson.employees || crmJson.data || []);

          list = crmList.map((emp: any) => ({
            id: emp.id,
            name: emp.name || 'Employee',
            email: emp.email || '',
            mobile: emp.mobile || '',
            department: emp.department || 'General',
            designation: emp.designation || 'Staff',
            role: emp.role || 'EMPLOYEE',
            employmentType: emp.employmentType || 'FULL_TIME',
            gender: emp.gender || '',
            status: emp.isActive !== false ? 'ACTIVE' : 'INACTIVE',
            isActive: emp.isActive !== false,
            employeeId: emp.employeeId || '',
            joiningDate: emp.joiningDate || '',
            dateOfBirth: emp.dateOfBirth || '',
            reportingManager: emp.reportingManager || '',
            teamId: emp.teamId || '',
            teamName: emp.teamName || '',
            baseSalary: emp.baseSalary || 0,
            bankName: emp.bankName || '',
            bankAccountNumber: emp.bankAccountNumber || '',
            bankIfsc: emp.bankIfsc || '',
            address: emp.address || '',
            emergencyContactName: emp.emergencyContactName || '',
            emergencyContactPhone: emp.emergencyContactPhone || '',
            notes: emp.notes || '',
            weekOff: emp.weekOff || '',
            specialization: emp.specialization || '',
          }));
        }
      } catch (crmErr) {
        console.warn('CRM employee fetch failed:', crmErr);
      }

      // SECONDARY: Also fetch internal DB employees and merge (for specialists/admin who aren't in CRM)
      try {
        const res = await apiRequest('/employees');
        const internalList = Array.isArray(res)
          ? res
          : res?.data && Array.isArray(res.data)
          ? res.data
          : [];

        if (internalList.length > 0) {
          const existingEmails = new Set(list.map(e => (e.email || '').toLowerCase().trim()).filter(Boolean));
          const existingCodes = new Set(list.map(e => String(e.employeeId || '').toLowerCase().trim()).filter(Boolean));

          const dbMapped = internalList
            .filter((emp: any) => {
              const email = (emp.user?.email || emp.email || '').toLowerCase().trim();
              const code = String(emp.employeeCode || '').toLowerCase().trim();
              return (!email || !existingEmails.has(email)) && (!code || !existingCodes.has(code));
            })
            .map((emp: any) => ({
              id: emp.id,
              name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee',
              email: emp.user?.email || emp.email || '',
              mobile: emp.mobileNumber || emp.phone || '',
              department: emp.department?.name || (typeof emp.department === 'string' ? emp.department : 'General'),
              designation: emp.designation?.title || (typeof emp.designation === 'string' ? emp.designation : 'Staff'),
              role: emp.user?.role || emp.role || 'EMPLOYEE',
              employmentType: emp.employmentType || 'FULL_TIME',
              gender: emp.gender || 'MALE',
              status: emp.status || 'ACTIVE',
              isActive: emp.status === 'ACTIVE',
              employeeId: emp.employeeCode || emp.id,
              joiningDate: emp.joiningDate || emp.createdAt,
              dateOfBirth: emp.dateOfBirth || '',
              reportingManager: emp.manager ? `${emp.manager.firstName || ''} ${emp.manager.lastName || ''}`.trim() : '',
              teamId: emp.teamId || emp.team?.id || '',
              teamName: emp.team?.name || '',
              baseSalary: emp.salaryStructure?.basicSalary || 0,
              bankName: emp.bankName || '',
              bankAccountNumber: emp.bankAccountNo || '',
              bankIfsc: emp.ifscCode || '',
              address: emp.address || '',
              emergencyContactName: emp.emergencyContactName || '',
              emergencyContactPhone: emp.emergencyPhone || '',
              documents: emp.documents || [],
              raw: emp,
            }));

          list = [...list, ...dbMapped];
        }
      } catch (dbErr) {
        console.warn('Internal DB fetch failed:', dbErr);
      }

      // If both failed, show error
      if (list.length === 0) {
        setError('No employee data available. Please check your connection.');
      }

      setEmployees(list);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to fetch employees:', err);
      setError(err.message || 'Failed to fetch employee data.');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
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

  // Fetch full employee details from internal API
  const fetchEmployeeDetails = async (emp: EmployeeRecord) => {
    setSelectedEmployee(emp); // Show immediately with available data

    try {
      const empId = emp.id || emp._id || '';
      if (!empId) return;

      const res = await apiRequest(`/employees/${empId}`);
      const detail = res?.data || res;

      if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
        setSelectedEmployee({
          ...emp,
          ...detail,
          name: `${detail.firstName || ''} ${detail.lastName || ''}`.trim() || emp.name,
          email: detail.user?.email || emp.email,
          documents: detail.documents || [],
        });
      }
    } catch (err) {
      console.warn('Failed to fetch employee details:', err);
    }
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
      reportingManager: emp.reportingManager || emp.manager || emp.teamLeader || '',
      isActive: getEmpStatus(emp) === 'ACTIVE',
      employmentType: sanitizeEmploymentType(emp.employmentType),
      gender: emp.gender || '',
      dateOfBirth: formatDateForInput(emp.dateOfBirth),
      joiningDate: formatDateForInput(emp.joiningDate || emp.dateOfJoining),
      onboardingDate: formatDateForInput(emp.onboardingDate),
      baseSalary: Number(emp.baseSalary || emp.salary || emp.ctc || 0),
      bankName: emp.bankName || emp.bank || '',
      bankAccountNumber: emp.bankAccountNumber || emp.accountNumber || emp.bankAccountNo || '',
      bankIfsc: emp.bankIfsc || emp.ifsc || emp.ifscCode || '',
      panNumber: emp.panNumber || emp.pan || '',
      uanNumber: emp.uanNumber || emp.uan || '',
      address: emp.address || emp.currentAddress || '',
      emergencyContactName: emp.emergencyContactName || emp.emergencyContact || emp.emergencyName || '',
      emergencyContactPhone: emp.emergencyContactPhone || emp.emergencyPhone || emp.emergencyMobile || '',
      notes: emp.notes || '',
    } as any);

    setIsFormModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

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
        'SALES_MEMBER',
        'TECH',
        'TECH_LEAD',
        'OPERATIONAL_HEAD',
      ];
      const roleUpper = String(formData.role || '').trim().toUpperCase();
      const sanitizedRole = validRoles.includes(roleUpper) ? roleUpper : 'EMPLOYEE';

      const names = formData.name.trim().split(' ');

      // Detect if this is a CRM employee (non-UUID id format like "cmqi07ux...")
      const isCrmEmployee = formMode === 'edit' && formData.id && !formData.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      if (isCrmEmployee) {
        // Update via CRM API — use CRM-compatible field formats
        const genderForCrm = (g?: string) => {
          const clean = String(g || '').trim().toLowerCase();
          if (clean.startsWith('f')) return 'Female';
          if (clean.startsWith('o')) return 'Other';
          if (clean.startsWith('m')) return 'Male';
          return g || '';
        };

        const crmPayload: any = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          mobile: formData.mobile.trim(),
          employeeId: formData.employeeId.trim(),
          designation: formData.designation.trim(),
          role: sanitizedRole,
          department: formData.department.trim(),
          teamName: formData.teamName.trim(),
          reportingManager: formData.reportingManager.trim(),
          isActive: Boolean(formData.isActive),
          employmentType: sanitizeEmploymentType(formData.employmentType),
          gender: genderForCrm(formData.gender),
          dateOfBirth: formData.dateOfBirth || undefined,
          joiningDate: formData.joiningDate || undefined,
          baseSalary: Number(formData.baseSalary) || 0,
          bankName: formData.bankName.trim() || undefined,
          bankAccountNumber: formData.bankAccountNumber.trim() || undefined,
          bankIfsc: formData.bankIfsc.trim() || undefined,
          address: formData.address.trim() || undefined,
          emergencyContactName: formData.emergencyContactName.trim() || undefined,
          emergencyContactPhone: formData.emergencyContactPhone.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        };

        const res = await fetch(`/api/crm-employees/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(crmPayload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          // If CRM doesn't support PUT, show helpful message
          if (res.status === 404 || res.status === 401) {
            throw new Error('Employee update must be done on the CRM portal (adyapancrm.in). HRMS sync will reflect changes automatically.');
          }
          throw new Error(errData?.message || `CRM update failed (${res.status})`);
        }
      } else {
        // Internal DB employee
        const payload: any = {
          firstName: names[0] || formData.name.trim(),
          lastName: names.slice(1).join(' ') || '',
          email: formData.email.trim(),
          mobileNumber: formData.mobile.trim(),
          employeeCode: formData.employeeId.trim(),
          role: sanitizedRole,
          department: formData.department.trim(),
          designation: formData.designation.trim(),
          status: formData.isActive ? 'ACTIVE' : 'INACTIVE',
          employmentType: sanitizeEmploymentType(formData.employmentType),
          gender: sanitizeGender(formData.gender),
          joiningDate: formData.joiningDate ? new Date(formData.joiningDate).toISOString() : undefined,
          dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
          bankName: formData.bankName.trim() || undefined,
          bankAccountNo: formData.bankAccountNumber.trim() || undefined,
          ifscCode: formData.bankIfsc.trim() || undefined,
          address: formData.address.trim() || undefined,
          emergencyContact: formData.emergencyContactName.trim() || undefined,
          emergencyPhone: formData.emergencyContactPhone.trim() || undefined,
          baseSalary: Number(formData.baseSalary) || 0,
        };

        if (formData.password?.trim()) {
          payload.password = formData.password.trim();
        }

        if (formMode === 'create') {
          if (!payload.password) payload.password = 'Adyapan@123';
          await apiRequest('/employees', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
        } else {
          await apiRequest(`/employees/${formData.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          });
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
        setSelectedEmployee({ ...selectedEmployee, name: formData.name });
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

    try {
      const targetId = deleteTarget.id || deleteTarget._id || '';

      // Detect if CRM employee (non-UUID id)
      const isCrmEmployee = targetId && !String(targetId).match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      if (isCrmEmployee) {
        const res = await fetch(`/api/crm-employees/${targetId}`, { method: 'DELETE' });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || `CRM delete failed (${res.status})`);
        }
      } else {
        await apiRequest(`/employees/${targetId}`, { method: 'DELETE' });
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
    if (clean.includes('INTERN')) return 'INTERN';
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
    const rawDept: any = emp.department;
    if (rawDept && typeof rawDept === 'object') {
      return rawDept.name || rawDept.title || 'General';
    }
    if (typeof rawDept === 'string' && rawDept.trim() !== '' && !rawDept.includes('[object')) {
      return rawDept.trim();
    }
    if (emp.departmentName && typeof emp.departmentName === 'string') return String(emp.departmentName).trim();
    if (emp.dept && typeof emp.dept === 'string') return String(emp.dept).trim();
    if (emp.teamName && typeof emp.teamName === 'string') return String(emp.teamName).trim();
    return 'General';
  };

  const getEmpTeam = (emp: EmployeeRecord) => {
    if (emp.teamName) return emp.teamName;
    if (emp.team && typeof emp.team === 'object') return emp.team.name || '—';
    if (emp.team && typeof emp.team === 'string') return emp.team;
    return '—';
  };

  const getEmpDesignation = (emp: EmployeeRecord) => {
    const rawDesig: any = emp.designation;
    if (rawDesig && typeof rawDesig === 'object') {
      return rawDesig.title || rawDesig.name || 'Staff';
    }
    if (typeof rawDesig === 'string' && rawDesig.trim() !== '' && !rawDesig.includes('[object')) {
      return rawDesig.trim();
    }
    return emp.role || emp.designationTitle || emp.jobTitle || 'Staff';
  };

  const getEmpStatus = (emp: EmployeeRecord) => {
    // 1. If explicitly inactive by status string
    const raw = String(emp.status || emp.employeeStatus || '').trim().toUpperCase();
    if (
      raw === 'INACTIVE' ||
      raw === 'TERMINATED' ||
      raw === 'RESIGNED' ||
      raw === 'EXITED' ||
      raw.includes('INACT') ||
      raw.includes('RESIGN') ||
      raw.includes('EXIT')
    ) {
      return 'INACTIVE';
    }
    if (raw.includes('LEAVE')) return 'ON_LEAVE';

    // 2. Check boolean isActive if explicitly provided (e.g. from CRM)
    const activeVal: any = emp.isActive;
    if (activeVal !== undefined && activeVal !== null) {
      if (
        activeVal === false ||
        activeVal === 0 ||
        activeVal === '0' ||
        String(activeVal).toLowerCase() === 'false'
      ) {
        return 'INACTIVE';
      }
      if (
        activeVal === true ||
        activeVal === 1 ||
        activeVal === '1' ||
        String(activeVal).toLowerCase() === 'true'
      ) {
        return 'ACTIVE';
      }
    }

    // 3. Check status string
    if (raw === 'ACTIVE' || raw === 'CONFIRMED' || raw === 'PROBATION' || raw.includes('ACT')) {
      return 'ACTIVE';
    }

    return 'ACTIVE';
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
      if (d && d !== 'General' && d !== '—' && !d.includes('[object')) set.add(d);
    });

    const standardDepts = [
      'Engineering',
      'Tech',
      'Human Resources',
      'HR',
      'Sales',
      'Inside Sales',
      'Finance',
      'Accounts',
      'Marketing',
      'Digital Marketing',
      'Operations',
      'Quality Assurance',
      'Customer Support',
      'Academic Counselor',
      'Business Development',
      'Design',
      'Management',
      'Legal',
    ];
    standardDepts.forEach((d) => set.add(d));
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
      {/* Page Header - Clean & Simple */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500">Live employee accounts, HR profiles, team assignments and compensation details.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchEmployees()}
            disabled={loading}
            className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center gap-2 font-semibold shadow-sm text-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={employees.length === 0}
            className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center gap-2 font-semibold shadow-sm text-sm cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition flex items-center gap-2 font-semibold shadow-sm text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
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
              onClick={() => fetchEmployees()}
              className="px-3.5 py-2 bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        {/* Search Field */}
        <div className="flex-1 max-w-lg relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, employee ID, email, department or team"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800 placeholder:text-slate-400"
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

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm font-medium text-slate-700 cursor-pointer"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 min-w-[250px]">Employee</th>
                <th className="py-3 px-4 min-w-[150px]">Department</th>
                <th className="py-3 px-4 min-w-[140px]">Team / Manager</th>
                <th className="py-3 px-4 min-w-[100px]">Joined</th>
                <th className="py-3 px-4 min-w-[100px]">Base Salary</th>
                <th className="py-3 px-4 min-w-[90px] text-center">Status</th>
                <th className="py-3 px-4 text-center min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                      <span className="text-sm font-semibold text-slate-600">Loading employee data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-10 h-10 text-slate-300" />
                      <span className="text-sm font-bold text-slate-700">No employees found</span>
                      <span className="text-xs text-slate-400">Try changing your search or filter criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp, idx) => {
                  const empName = getEmpName(emp);
                  const empCode = getEmpCode(emp);
                  const empEmail = getEmpEmail(emp);
                  const empDept = getEmpDept(emp);
                  const empTeam = getEmpTeam(emp);
                  const empDesig = getEmpDesignation(emp);
                  const status = getEmpStatus(emp);
                  const joiningDate = getEmpJoiningDate(emp);
                  const initials = getEmpInitials(empName);

                  return (
                    <tr
                      key={emp.id || emp._id || idx}
                      className="hover:bg-orange-50/30 transition-colors group cursor-pointer"
                      onClick={() => fetchEmployeeDetails(emp)}
                    >
                      {/* Employee */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{empName}</div>
                            <div className="text-[11px] text-slate-400">
                              {empCode !== 'N/A' ? empCode : 'No employee ID'} · {empEmail !== '—' ? empEmail : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 text-sm">{empDept}</div>
                        <div className="text-[11px] text-slate-400">{empDesig}</div>
                      </td>

                      {/* Team / Manager */}
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-700">{empTeam !== '—' ? `Team ${empTeam}` : 'Unassigned'}</div>
                        <div className="text-[11px] text-slate-400">{emp.reportingManager || emp.manager || emp.teamLeader || emp.teamLead || 'No manager'}</div>
                      </td>

                      {/* Joining Date */}
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {joiningDate}
                      </td>

                      {/* Base Salary */}
                      <td className="py-3 px-4 text-sm font-semibold text-slate-700">
                        ₹{Number(emp.baseSalary || emp.ctc || 15000).toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {status === 'ACTIVE' ? (
                          <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                            Active
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold uppercase">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition cursor-pointer"
                            title="Edit Employee"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(emp)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Remove Employee"
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
      </div>
      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalItems={filteredEmployees.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {/* Add / Edit Employee Modal - Single Scroll */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-slate-900">
                {formMode === 'create' ? 'Add Employee' : 'Edit Employee'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error */}
            {formError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form Content - Single Scroll */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Account & Employment */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900">Account & Employment</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Abbu Veena" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                    <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@adyapan.com" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mobile</label>
                    <input type="text" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} placeholder="9876543210" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Employee ID</label>
                    <input type="text" required value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} placeholder="ADP0417" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800 font-mono" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Role</label>
                    <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800 cursor-pointer">
                      <option value="EMPLOYEE">Employee</option>
                      <option value="HR_EXECUTIVE">HR Executive</option>
                      <option value="HR_ADMIN">HR Admin</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="MANAGER">Manager</option>
                      <option value="TEAM_LEAD">Team Lead</option>
                      <option value="TELECALLER">Telecaller</option>
                      <option value="COUNSELOR">Counselor</option>
                      <option value="DEVELOPER">Developer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Designation</label>
                    <input type="text" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} placeholder="HR Talent Acquisition" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Specialization</label>
                    <input type="text" value={(formData as any).specialization || ''} onChange={(e) => setFormData({ ...formData, specialization: e.target.value } as any)} placeholder="HR" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
                    <input type="text" value={(formData as any).department || ''} onChange={(e) => setFormData({ ...formData, department: e.target.value } as any)} placeholder="HR" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Team</label>
                    <select value={formData.teamName || ''} onChange={(e) => setFormData({ ...formData, teamName: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800 cursor-pointer">
                      <option value="">Select Team</option>
                      {teams.map((t: any) => <option key={t.id || t.name} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Joining Date</label>
                    <input type="date" value={formData.joiningDate} onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Onboarding Date</label>
                    <input type="date" value={formData.onboardingDate || ''} onChange={(e) => setFormData({ ...formData, onboardingDate: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Employment Type</label>
                    <select value={formData.employmentType} onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800 cursor-pointer">
                      <option value="FULL_TIME">Full time</option>
                      <option value="PART_TIME">Part time</option>
                      <option value="INTERNSHIP">Intern</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="PROBATION">Probation</option>
                      <option value="FREELANCE">Freelance</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Training & Probation */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h4 className="text-sm font-bold text-slate-900">Training & Probation</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">OJT Start Date</label>
                    <input type="date" value={(formData as any).ojtStartDate || ''} onChange={(e) => setFormData({ ...formData, ojtStartDate: e.target.value } as any)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">OJT End Date</label>
                    <input type="date" value={(formData as any).ojtEndDate || ''} onChange={(e) => setFormData({ ...formData, ojtEndDate: e.target.value } as any)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Training Start Date</label>
                    <input type="date" value={(formData as any).trainingStartDate || ''} onChange={(e) => setFormData({ ...formData, trainingStartDate: e.target.value } as any)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Training End Date</label>
                    <input type="date" value={(formData as any).trainingEndDate || ''} onChange={(e) => setFormData({ ...formData, trainingEndDate: e.target.value } as any)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Probation Period</label>
                    <input type="text" value={(formData as any).probationPeriod || ''} onChange={(e) => setFormData({ ...formData, probationPeriod: e.target.value } as any)} placeholder="e.g. 3 months, 6 months" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                </div>
              </div>

              {/* Personal & Emergency */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h4 className="text-sm font-bold text-slate-900">Personal & Emergency</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date of Birth</label>
                    <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Gender</label>
                    <input type="text" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} placeholder="Male / Female" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Emergency Contact</label>
                    <input type="text" value={formData.emergencyContactName} onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })} placeholder="Name" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Emergency Phone</label>
                    <input type="text" value={formData.emergencyContactPhone} onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })} placeholder="9876543210" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Address</label>
                  <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={3} placeholder="Current address" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800 resize-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Permanent Address</label>
                  <textarea value={(formData as any).permanentAddress || ''} onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value } as any)} rows={3} placeholder="Permanent address" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800 resize-none" />
                </div>
              </div>

              {/* Payroll & Statutory */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h4 className="text-sm font-bold text-slate-900">Payroll & Statutory</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Base Salary</label>
                    <input type="number" value={formData.baseSalary} onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })} placeholder="15000" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bank Name</label>
                    <input type="text" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} placeholder="HDFC" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Account Number</label>
                    <input type="text" value={formData.bankAccountNumber} onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })} placeholder="Account number" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">IFSC</label>
                    <input type="text" value={formData.bankIfsc} onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value })} placeholder="HDFC0000864" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">PAN</label>
                    <input type="text" value={formData.panNumber} onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })} placeholder="CBBPV1902N" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">UAN</label>
                    <input type="text" value={formData.uanNumber} onChange={(e) => setFormData({ ...formData, uanNumber: e.target.value })} placeholder="572104310119" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800" />
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Internal Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} placeholder="Team: HR | Team Leader: Nandini | Type: Intern | Location: Hyderabad" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-slate-800 resize-none" />
                </div>

                {/* Active Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400 cursor-pointer" />
                  <span className="text-sm text-slate-700">Employee account is active</span>
                </label>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-white">
              <button type="button" onClick={() => setIsFormModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                Cancel
              </button>
              <button
                type="submit"
                form="empForm"
                disabled={formSubmitting}
                onClick={(e) => { e.preventDefault(); handleFormSubmit(e as any); }}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {formSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{formSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
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

      {/* Employee Profile Modal - Centered */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-slate-900">Employee Profile</h3>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Profile Banner */}
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center font-black text-base shadow-md">
                    {getEmpInitials(getEmpName(selectedEmployee))}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-base">{getEmpName(selectedEmployee)}</h4>
                    <p className="text-xs text-slate-500">{getEmpDesignation(selectedEmployee)} · {getEmpCode(selectedEmployee)}</p>
                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      getEmpStatus(selectedEmployee) === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {getEmpStatus(selectedEmployee)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenEditModal(selectedEmployee)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                </div>
              </div>

              {/* Contact & Employment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                  <h5 className="text-[11px] font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Contact
                  </h5>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">Email</span><span className="font-semibold text-slate-800 text-right max-w-[180px] truncate">{getEmpEmail(selectedEmployee)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Mobile</span><span className="font-semibold text-slate-800">{getEmpPhone(selectedEmployee)}</span></div>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                  <h5 className="text-[11px] font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Employment
                  </h5>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">Department</span><span className="font-semibold text-slate-800">{getEmpDept(selectedEmployee)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Specialization</span><span className="font-semibold text-slate-800">{selectedEmployee.specialization || getEmpDept(selectedEmployee)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Employment Type</span><span className="font-semibold text-slate-800">{selectedEmployee.employmentType || 'FULL_TIME'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Joining Date</span><span className="font-semibold text-orange-600">{getEmpJoiningDate(selectedEmployee)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Onboarding Date</span><span className="font-semibold text-orange-600">{selectedEmployee.onboardingDate ? new Date(selectedEmployee.onboardingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span></div>
                  </div>
                </div>
              </div>

              {/* Team & Personal */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                  <h5 className="text-[11px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Team
                  </h5>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">Team</span><span className="font-semibold text-slate-800">{getEmpTeam(selectedEmployee)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Reporting Manager</span><span className="font-semibold text-slate-800">{selectedEmployee.reportingManager || selectedEmployee.manager || selectedEmployee.teamLeader || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Role</span><span className="font-semibold text-slate-800">{getEmpDesignation(selectedEmployee)}</span></div>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                  <h5 className="text-[11px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Personal
                  </h5>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">Date of Birth</span><span className="font-semibold text-slate-800">{selectedEmployee.dateOfBirth ? new Date(selectedEmployee.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Gender</span><span className="font-semibold text-slate-800">{selectedEmployee.gender || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Blood Group</span><span className="font-semibold text-slate-800">{selectedEmployee.bloodGroup || '—'}</span></div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <h5 className="text-[11px] font-bold text-green-600 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Address
                </h5>
                <p className="text-xs text-slate-700">
                  {(selectedEmployee.permanentAddress || selectedEmployee.permanent_address) ? `Permanent: ${selectedEmployee.permanentAddress || selectedEmployee.permanent_address}` : ''}
                  {(selectedEmployee.address || selectedEmployee.currentAddress || selectedEmployee.current_address) ? `${(selectedEmployee.permanentAddress || selectedEmployee.permanent_address) ? ' | ' : ''}Current: ${selectedEmployee.address || selectedEmployee.currentAddress || selectedEmployee.current_address}` : ''}
                  {!selectedEmployee.address && !selectedEmployee.permanentAddress && !selectedEmployee.currentAddress && !selectedEmployee.current_address && !selectedEmployee.permanent_address && '—'}
                </p>
              </div>

              {/* Emergency Contact & Bank Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                  <h5 className="text-[11px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Emergency Contact
                  </h5>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">Name</span><span className="font-semibold text-slate-800">{selectedEmployee.emergencyContactName || selectedEmployee.emergencyContact || selectedEmployee.emergencyName || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Phone</span><span className="font-semibold text-slate-800">{selectedEmployee.emergencyContactPhone || selectedEmployee.emergencyPhone || selectedEmployee.emergencyMobile || '—'}</span></div>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                  <h5 className="text-[11px] font-bold text-green-600 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Bank Details
                  </h5>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">Bank</span><span className="font-semibold text-slate-800">{selectedEmployee.bankName || selectedEmployee.bank || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Account</span><span className="font-semibold text-slate-800">{selectedEmployee.bankAccountNumber || selectedEmployee.accountNumber || selectedEmployee.bankAccountNo || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">IFSC</span><span className="font-semibold text-slate-800">{selectedEmployee.bankIfsc || selectedEmployee.ifsc || selectedEmployee.ifscCode || '—'}</span></div>
                  </div>
                </div>
              </div>

              {/* Statutory */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2 max-w-sm">
                <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Statutory
                </h5>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-slate-400">PAN</span><span className="font-mono font-bold text-slate-800">{selectedEmployee.panNumber || selectedEmployee.pan || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">UAN</span><span className="font-mono font-bold text-slate-800">{selectedEmployee.uanNumber || selectedEmployee.uan || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Base Salary</span><span className="font-bold text-slate-800">₹{Number(selectedEmployee.baseSalary || selectedEmployee.salary || selectedEmployee.ctc || 0).toLocaleString('en-IN')}</span></div>
                </div>
              </div>

              {/* Notes */}
              {selectedEmployee.notes && (
                <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                  <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Notes
                  </h5>
                  <p className="text-xs text-slate-700">{selectedEmployee.notes}</p>
                </div>
              )}

              {/* Documents & Certificates */}
              {((selectedEmployee.documents && Array.isArray(selectedEmployee.documents) && selectedEmployee.documents.length > 0) || (selectedEmployee.uploads && Array.isArray(selectedEmployee.uploads) && selectedEmployee.uploads.length > 0)) && (
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Documents & Certificates
                  </h5>
                  <div className="divide-y divide-slate-100">
                    {(selectedEmployee.uploads || selectedEmployee.documents || []).map((doc: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div>
                          <div className="text-xs font-bold text-slate-800">{doc.title || doc.name || doc.fileName || doc.originalName || 'Document'}</div>
                          <div className="text-[10px] text-slate-400 uppercase">{doc.category || doc.type || doc.documentType || ''}</div>
                        </div>
                        {(doc.fileUrl || doc.url || doc.path) && (
                          <a href={doc.fileUrl || doc.url || doc.path} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Open
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* End of component */}
    </div>
  );
}
