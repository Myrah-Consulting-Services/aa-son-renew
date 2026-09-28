import { Injectable } from '@angular/core';
import {
  NABLUS_BRANCHES,
  NABLUS_DEPARTMENTS,
  NABLUS_DESIGNATIONS,
  NABLUS_HR_EMPLOYEES,
  NABLUS_LEAVE_REQUESTS,
  NABLUS_PAY_RUNS,
  NABLUS_PAYROLL_HISTORY,
  buildNablusAttendance,
} from './nablus-lists.data';
import { NABLUS_PAYROLL_DASHBOARD as DASH } from './nablus-road-contracting.data';

const STORAGE_KEY = 'aa_payroll_demo_v1';

const SALARY_BASE: Record<string, number> = {
  NRC001: 24000, NRC002: 9500, NRC003: 12000, NRC004: 6500, NRC005: 11000,
  NRC006: 5800, NRC007: 8500, NRC008: 7200, NRC009: 9000, NRC010: 6200,
};

@Injectable({ providedIn: 'root' })
export class PayrollLocalStore {
  private state: any;

  constructor() {
    this.state = this.load();
  }

  isPayrollUrl(url: string): boolean {
    const path = this.pathOf(url);
    return (
      path.startsWith('/employee/') ||
      path.startsWith('/attendance/') ||
      path.startsWith('/payroll/') ||
      path.startsWith('/leave/')
    );
  }

  handleRequest(method: string, url: string, body: any = {}, extraParams: Record<string, string> = {}): any {
    const path = this.pathOf(url);
    const query = { ...this.queryOf(url), ...extraParams };
    const payload = this.normalizeBody(body);
    const verb = (method || 'GET').toUpperCase();
    const id = this.idFrom(path);

    try {
      const handled = this.route(verb, path, payload, query, id);
      if (handled !== undefined) {
        this.save();
        return handled;
      }
    } catch (err) {
      console.error('Payroll demo store error', err);
      return { status: 500, error: String(err) };
    }

    this.save();
    if (verb === 'GET' || verb === 'DELETE') {
      return this.ok([]);
    }
    return this.ok({ id: this.nextId() }, 'Saved locally');
  }

  private route(verb: string, path: string, body: any, query: Record<string, string>, id: string | null): any {
    // ── Masters ──────────────────────────────────────────────────────────
    if (path.includes('/list_departments')) return this.ok(this.state.departments);
    if (path.includes('/create_department') && verb === 'POST') {
      const row = { id: this.nextId(), active: true, ...body };
      this.state.departments.push(row);
      return this.ok(row, 'Department created');
    }
    if (path.includes('/list_designations')) return this.ok(this.state.designations);
    if (path.includes('/create_designation') && verb === 'POST') {
      const row = { id: this.nextId(), ...body };
      this.state.designations.push(row);
      return this.ok(row, 'Designation created');
    }
    if (path.includes('/list_branches')) return this.ok(this.state.branches);
    if (path.includes('/create_branch') && verb === 'POST') {
      const row = { id: this.nextId(), ...body };
      this.state.branches.push(row);
      return this.ok(row, 'Branch created');
    }
    if (path.includes('/list_locations')) return this.ok(this.state.locations);
    if (path.includes('/create_location') && verb === 'POST') {
      const row = { id: this.nextId(), Location_name: body.Location_name || body.location_name || body.name, ...body };
      this.state.locations.push(row);
      return this.ok(row, 'Location created');
    }

    // ── Employees ────────────────────────────────────────────────────────
    if (path.includes('/list_employees') && (verb === 'POST' || verb === 'GET')) {
      return this.listEmployees(body, query);
    }
    if (path.includes('/employee-next-number')) {
      const n = this.state.employees.length + 1;
      return this.ok(`NRC${String(n).padStart(3, '0')}`);
    }
    if (path.includes('/create_employee') && verb === 'POST') {
      const emp = this.createEmployee(body);
      return this.ok(emp.id, 'Employee created');
    }
    if (path.includes('/update_employee/') && (verb === 'PUT' || verb === 'POST')) {
      this.patchById('employees', id, body);
      const emp = this.byId('employees', id);
      this.hydrateEmployee(emp);
      return this.ok(emp, 'Employee updated');
    }
    if (path.includes('/get_employee/')) {
      const emp = this.byId('employees', id);
      return emp ? this.ok(emp) : { status: 404, error: 'Employee not found' };
    }
    if (path.includes('/delete_employee/')) {
      this.state.employees = this.state.employees.filter((e: any) => String(e.id) !== String(id));
      return this.ok(true, 'Employee deleted');
    }
    if (path.includes('/create_employee_personal_details')) {
      return this.attachEmployeeSlice(body.employee, 'personalDetails', body);
    }
    if (path.includes('/update_employee_personal_details')) {
      return this.attachEmployeeSlice(body.employee, 'personalDetails', { ...body, id: id || body.id });
    }
    if (path.includes('/create_employee_payment_details') || path.includes('/update_bank/')) {
      return this.attachEmployeeSlice(body.employee, 'paymentDetails', body);
    }
    if (path.includes('/create_employee_salary_component') || path.includes('/update_employee_salary_component')) {
      return this.attachEmployeeSlice(body.employee, 'salaryDetails', body);
    }
    if (path.includes('/list_benefits/')) return this.ok(this.byId('employees', id)?.benefits || []);
    if (path.includes('/list_deductions/')) return this.ok(this.byId('employees', id)?.deductions || []);
    if (path.includes('/list_air_travel_allowances/')) return this.ok([]);
    if (path.includes('/employee_based_document/')) {
      return this.ok(this.state.documents.filter((d: any) => String(d.employee) === String(id)));
    }
    if (path.includes('/create_document') || path.includes('/upload_document')) {
      const doc = { id: this.nextId(), title: body.title || 'Document', ...body, file: body.file?.name || 'file.pdf' };
      this.state.documents.push(doc);
      return this.ok(doc, 'Document uploaded');
    }
    if (path.includes('/delete_document/') || path.includes('/delete_benefits/') || path.includes('/delete_deductions/') || path.includes('/delete_air_travel')) {
      return this.ok(true, 'Deleted');
    }
    if (path.includes('/get_revise_salary_by_employee') || path.includes('/employee_payslip_details')) {
      const emp = this.byId('employees', id);
      return this.ok(emp ? [this.payslipFor(emp, 'Current')] : []);
    }

    // ── Payroll heads / salary ───────────────────────────────────────────
    if (path.includes('/payroll_head_categories')) return this.ok(this.state.earningTypes);
    if (path.includes('/distributed_payroll_list')) return this.ok(this.distributedHeads());
    if (path.includes('/grouped_payroll_heads')) return this.ok(this.groupedHeads());
    if (path.includes('/get_payroll_head/')) {
      const head = this.state.payrollHeads.find((h: any) => String(h.id) === String(id));
      return this.ok(head || {});
    }
    if (path.includes('/create_payroll_head') && verb === 'POST') {
      const head = this.createHead(body);
      return this.ok(head, 'Payroll head created');
    }
    if (path.includes('/update_payroll_head/')) {
      this.patchList(this.state.payrollHeads, id, body);
      return this.ok(this.state.payrollHeads.find((h: any) => String(h.id) === String(id)), 'Updated');
    }
    if (path.includes('/delete_payroll_head/')) {
      this.state.payrollHeads = this.state.payrollHeads.filter((h: any) => String(h.id) !== String(id));
      return this.ok(true, 'Deleted');
    }
    if (path.includes('/custom_formula_details')) {
      return this.ok({ operators: ['+', '-', '*', '/'], functions: [], variables: ['BASIC'], input_variables: [], time_variables: [] });
    }
    if (path.includes('/custom_formula_check')) {
      return this.ok({ valid: true, result: 0 }, 'Formula ok');
    }

    // ── Salary structures ────────────────────────────────────────────────
    if (path.includes('/list_salary_component_maps')) return this.ok(this.state.salaryStructures);
    if (path.includes('/get_salary_component_map/')) {
      return this.ok(this.state.salaryStructures.find((s: any) => String(s.id) === String(id)) || {});
    }
    if (path.includes('/create_salary_component_map') && verb === 'POST') {
      const row = this.createStructure(body);
      return this.ok(row, 'Salary structure created');
    }
    if (path.includes('/update_salary_component_map/')) {
      this.patchList(this.state.salaryStructures, id, this.normalizeStructure(body, Number(id)));
      return this.ok(this.byListId(this.state.salaryStructures, id), 'Updated');
    }
    if (path.includes('/delete_salary_component_maps/')) {
      this.state.salaryStructures = this.state.salaryStructures.filter((s: any) => String(s.id) !== String(id));
      return this.ok(true, 'Deleted');
    }

    // ── Attendance / leave types ─────────────────────────────────────────
    if (path.includes('/list-attendance-types') || path.includes('/list_attendance_types')) {
      return this.ok(this.state.leaveTypes);
    }
    if (path.includes('/create-attendance-type') || path.includes('/create_attendance_type')) {
      const row = {
        id: this.nextId(),
        title: body.title || body.name,
        name: body.name || body.title,
        is_leave: body.is_leave !== false,
        active: body.active !== false,
        color_code: body.color_code || '#6c757d',
        code: body.code || (body.name || 'LT').slice(0, 2).toUpperCase(),
        type: body.type || 'custom',
        ...body,
      };
      this.state.leaveTypes.push(row);
      return this.ok(row, 'Leave type created');
    }
    if (path.includes('/list-leave-requests')) return this.listLeaves(query);
    if (path.includes('/get-leave-requests/')) {
      return this.ok(this.state.leaveRequests.find((l: any) => String(l.id) === String(id)) || {});
    }
    if (path.includes('/create-leave-requests') && verb === 'POST') {
      const row = this.createLeave(body);
      return this.ok(row, 'Leave request created');
    }
    if (path.includes('/put-leave-requests/')) {
      this.patchList(this.state.leaveRequests, id, this.enrichLeave({ ...body, id: Number(id) }));
      return this.ok(this.byListId(this.state.leaveRequests, id), 'Updated');
    }
    if (path.includes('/delete-leave-requests/')) {
      this.state.leaveRequests = this.state.leaveRequests.filter((l: any) => String(l.id) !== String(id));
      return this.ok(true, 'Deleted');
    }
    if (path.includes('/change-leave-status/')) {
      const leave = this.byListId(this.state.leaveRequests, id);
      if (leave) {
        const status = Number(body.status || body.leave_status || 2);
        leave.status = status;
        leave.status_name = status === 2 ? 'Approved' : status === 3 ? 'Rejected' : 'Pending';
        this.syncLeaveToAttendance(leave);
      }
      return this.ok(leave, 'Status updated');
    }
    if (path.includes('/cancel-leave')) {
      const leave = this.state.leaveRequests.find((l: any) => String(l.id) === String(body.id));
      if (leave) {
        leave.status = 4;
        leave.status_name = 'Cancelled';
      }
      return this.ok(true, 'Cancelled');
    }

    if (path.includes('/all-employee-attendance') || path.includes('/get-employee-attendance')) {
      return this.attendanceReport(body, query);
    }
    if (path.includes('/attendance-update-create')) {
      this.applyAttendanceEdits(Array.isArray(body) ? body : body.employees || []);
      return this.ok(true, 'Attendance updated');
    }
    if (path.includes('/import-attendance') || path.includes('/attendance/import') || path.endsWith('/import/')) {
      return this.ok({ imported: this.state.employees.length, rejected: [] }, 'Attendance imported');
    }
    if (path.includes('/create_attendance')) {
      return this.ok(true, 'Attendance registered');
    }

    // ── Shifts / settings ────────────────────────────────────────────────
    if (path.includes('/list-shifts')) return this.ok(this.state.shiftTypes);
    if (path.includes('/list-subshifts')) {
      const shift = body.shift;
      const rows = shift
        ? this.state.subshifts.filter((s: any) => String(s.shift) === String(shift))
        : this.state.subshifts;
      return this.ok(rows);
    }
    if (path.includes('/get-subshifts')) {
      return this.ok(this.state.subshifts.find((s: any) => String(s.id) === String(body.id || id)) || {});
    }
    if (path.includes('/create-subshifts')) {
      const row = { id: this.nextId(), active: true, company: 1, ...body };
      this.state.subshifts.push(row);
      return this.ok(row, 'Shift created');
    }
    if (path.includes('/put-subshifts/')) {
      this.patchList(this.state.subshifts, id, body);
      return this.ok(this.byListId(this.state.subshifts, id), 'Shift updated');
    }
    if (path.includes('/delete-subshifts/')) {
      this.state.subshifts = this.state.subshifts.filter((s: any) => String(s.id) !== String(id));
      return this.ok(true, 'Deleted');
    }
    if (path.includes('/list-payroll-settings')) return this.ok([this.state.payrollSettings]);
    if (path.includes('/update-payroll-settings') || path.includes('/update-leave-approval') || path.includes('/update-leave-balance') || path.includes('/update-shift')) {
      this.state.payrollSettings = { ...this.state.payrollSettings, ...body };
      return this.ok(this.state.payrollSettings, 'Settings updated');
    }
    if (path.includes('/get_employee_settings')) return this.ok(this.state.employeeSettings);
    if (path.includes('/update_employee_settings')) {
      this.state.employeeSettings = { ...this.state.employeeSettings, ...body };
      return this.ok(this.state.employeeSettings, 'Settings updated');
    }
    if (path.includes('/ot/multipliers')) {
      if (verb === 'POST') {
        this.state.payrollSettings = { ...this.state.payrollSettings, ...body };
      }
      return this.ok(this.state.payrollSettings);
    }

    // ── Loans ────────────────────────────────────────────────────────────
    if (path.includes('/loan-type/list') || path.endsWith('/loan-type/list')) return this.ok(this.state.loanTypes);
    if (path.includes('/loan-type') && verb !== 'GET') {
      const row = { id: this.nextId(), name: body.name || 'Loan' };
      this.state.loanTypes.push(row);
      return this.ok(row, 'Loan type created');
    }
    if (path.includes('/list-loan')) return this.listLoans();
    if (path.includes('/employee-loan-payment-history')) return this.loanHistory(body);
    if ((path.includes('/attendance/loan') || path.endsWith('/loan')) && verb === 'POST' && !path.includes('update') && !path.includes('post-loan')) {
      const row = this.createLoan(body);
      return this.ok(row, 'Loan created');
    }
    if (path.includes('/update-loan/')) {
      this.patchList(this.state.loans, id, this.enrichLoan({ ...body, id: Number(id) }));
      return this.ok(this.byListId(this.state.loans, id), 'Updated');
    }
    if (path.includes('/post-loan/')) return this.ok(true, 'Loan posted');
    if (path.includes('/delete-loan/')) {
      this.state.loans = this.state.loans.filter((l: any) => String(l.id) !== String(id));
      return this.ok(true, 'Deleted');
    }
    if (path.includes('/loan/emi') || path.includes('/create-repayment') || path.includes('/record-repayment') || path.includes('/repayment')) {
      return this.recordRepayment(body, id);
    }
    if (path.includes('/delete-repayment')) {
      this.state.loanPayments = this.state.loanPayments.filter((p: any) => String(p.repayment_id || p.id) !== String(id || body.id));
      return this.ok(true, 'Deleted');
    }
    if (path.includes('/outstanding-loans')) {
      const empId = query['employee_id'] || body.employee_id;
      const rows = this.state.loans.filter((l: any) => !empId || String(l.employee_id) === String(empId));
      return this.ok(rows);
    }

    // ── Pay schedule / run ───────────────────────────────────────────────
    if (path.includes('/detailed_schedules') || path.includes('/list_schedules')) {
      return { status: 200, data: this.state.paySchedule, upcoming_payrolls: this.state.paySchedule.upcoming_payrolls || [] };
    }
    if (path.includes('/create_schedules') || path.includes('/update_schedules')) {
      this.state.paySchedule = { ...this.state.paySchedule, ...body, created: true, id: this.state.paySchedule.id || this.nextId() };
      return this.ok(this.state.paySchedule, 'Schedule saved');
    }
    if (path.includes('/payroll-dashboard')) return this.ok(this.dashboard());
    if (path.includes('/current_month_payroll_run')) return this.ok(this.currentPayRun());
    if (path.includes('/payroll_history')) return this.ok(this.state.payrollHistory);
    if (path.includes('/payroll_run_details/')) {
      return this.payrollRunDetails(id, path);
    }
    if (path.includes('/payroll_process_preview') || path.includes('/submit_payroll_run_with_payslip')) {
      return this.payRunPreview(body);
    }
    if (path.includes('/list_payrun_deductions')) return this.ok([this.state.payRunSettings]);
    if (path.includes('/apply_revised_salary')) return this.ok(true, 'Applied');
    if (path.includes('/payroll_overall_insights') || path.includes('/payroll_contributions_summary') || path.includes('/payroll_by_head')) {
      return this.ok({ heads: this.state.payrollHeads, total: 286400 });
    }

    // ── Settlement / EOSB / gratuity ─────────────────────────────────────
    if (path.includes('/pending-leave-data')) {
      const empId = query['employee_id'] || body.employee_id;
      const rows = this.state.leaveRequests.filter((l: any) =>
        String(l.employee) === String(empId) && l.status_name === 'Approved' && l.attendance_type_name !== 'Unpaid Leave'
      );
      return this.ok(rows);
    }
    if (path.includes('/unpaid-leave-data')) {
      const empId = query['employee_id'] || body.employee_id;
      const rows = this.state.leaveRequests.filter((l: any) =>
        String(l.employee) === String(empId) && l.attendance_type_name === 'Unpaid Leave'
      );
      return this.ok(rows);
    }
    if (path.includes('/gratuity-accrual-report')) return this.eosbReport(body);
    if (path.includes('/gratuity-settings') || path.includes('/settlement-settings')) {
      return this.ok({ basicSalaryPercentage: 21, maxYears: 5, uaeLawCompliant: true, noticePeriodDays: 30 });
    }
    if (path.includes('/save-gratuity') || path.includes('/create-employee-settlement') || path.includes('/create_exit_process') || path.includes('/start-offboarding') || path.includes('/complete-offboarding') || path.includes('/cancel-offboarding')) {
      const row = { id: this.nextId(), ...body, created_at: new Date().toISOString() };
      this.state.settlements.push(row);
      return this.ok(row, 'Saved');
    }
    if (path.includes('/fetch-offboarding-data') || path.includes('/offboarding-list') || path.includes('/list_reasons_for_exit')) {
      return this.ok(this.state.exitReasons);
    }
    if (path.includes('/employees-missing-data')) return this.ok([]);
    if (path.includes('/skip_employee_payroll_run')) return this.ok(true);
    if (path.includes('/list_penison') || path.includes('/list_pension')) return this.ok([]);
    if (path.includes('/payroll/process')) return this.payRunPreview(body);

    return undefined;
  }

  // ── Domain helpers ─────────────────────────────────────────────────────

  private listEmployees(body: any, query: Record<string, string>) {
    const search = (body?.employee || body?.keyw || query['employee'] || '').toString().toLowerCase();
    const dept = body?.department_id || query['department_id'];
    const desig = body?.designation_id || query['designation_id'];
    let rows = [...this.state.employees];
    if (search) {
      rows = rows.filter((e: any) =>
        `${e.first_name} ${e.last_name} ${e.emp_id} ${e.work_email}`.toLowerCase().includes(search)
      );
    }
    if (dept) rows = rows.filter((e: any) => String(e.department) === String(dept));
    if (desig) rows = rows.filter((e: any) => String(e.designation) === String(desig));
    const page = Number(body?.page || 1);
    const pageSize = Number(body?.page_size || body?.limit || rows.length || 10);
    const pagination = { count: rows.length, page, page_size: pageSize };
    if (body?.pagination === false) {
      return { status: 200, data: rows, pagination };
    }
    const start = Math.max(0, (page - 1) * pageSize);
    return { status: 200, data: rows.slice(start, start + pageSize), pagination };
  }

  private createEmployee(body: any) {
    const dept = this.state.departments.find((d: any) => String(d.id) === String(body.department));
    const desig = this.state.designations.find((d: any) => String(d.id) === String(body.designation));
    const emp = {
      id: this.nextId(),
      emp_id: body.emp_id || `NRC${String(this.state.employees.length + 1).padStart(3, '0')}`,
      first_name: body.first_name,
      last_name: body.last_name,
      work_email: body.work_email,
      phone_number: body.phone_number || '0500000000',
      phone_country: body.phone_country || 1,
      gender: body.gender || 'Male',
      joining_date: body.joining_date,
      department: body.department,
      designation: body.designation,
      branch: body.branch,
      location: body.location,
      shift: body.shift,
      department_name: dept?.department_name || '',
      designation_name: desig?.designation_name || body.job_title || '',
      salaryStructure: body.salaryStructure || 14002,
      portal_access_enabled: !!body.portal_access_enabled,
      company: body.company,
      contract_type: body.contract_type,
      emirates_id: body.emirates_id,
      passport_number: body.passport_number,
      benefits: [],
      deductions: [],
      ...body,
    };
    this.hydrateEmployee(emp);
    this.state.employees.push(emp);
    return emp;
  }

  private hydrateEmployee(emp: any) {
    if (!emp) return;
    const dept = this.state.departments.find((d: any) => String(d.id) === String(emp.department));
    const desig = this.state.designations.find((d: any) => String(d.id) === String(emp.designation));
    emp.department_name = dept?.department_name || emp.department_name || '';
    emp.designation_name = desig?.designation_name || emp.designation_name || emp.job_title || '';
    const basic = SALARY_BASE[emp.emp_id] || Number(emp.basic_salary) || 7000;
    emp.basic_salary = basic;
    emp.gross_salary = emp.gross_salary || Math.round(basic * 1.45);
    const net = emp.gross_salary - Math.round(emp.gross_salary * 0.05);
    emp.salary_components = emp.salary_components || [{
      netMonthlySalary: net,
      grossMonthlyEarnings: emp.gross_salary,
      basic_salary: basic,
    }];
  }

  private attachEmployeeSlice(empId: any, key: string, body: any) {
    const emp = this.byId('employees', empId);
    if (emp) {
      emp[key] = { ...(emp[key] || {}), ...body, id: body.id || emp[key]?.id || this.nextId() };
      if (body.salaryStructure) emp.salaryStructure = body.salaryStructure;
      if (body.earnings) emp.salaryDetails = { ...(emp.salaryDetails || {}), ...body };
    }
    return this.ok(emp?.[key] || { id: this.nextId() }, 'Saved');
  }

  private createHead(body: any) {
    const typeId = Number(body.head_type || 1);
    const typeName = typeId === 2 ? 'Deduction' : typeId === 3 ? 'Benefits' : typeId === 4 ? 'Reimbursement' : 'Earning';
    const head = {
      id: this.nextId(),
      head_name: body.head_name,
      payslip_name: body.payslip_name || body.head_name,
      head_type: typeId,
      head_type_name: typeName,
      calculation_type: Number(body.calculation_type || 1),
      calculation_type_name: Number(body.calculation_type) === 2 ? '% of Basic' : 'Fixed',
      calculation_value: Number(body.calculation_value || 0),
      monthly_value: Number(body.monthly_value || body.calculation_value || 0),
      annual_value: Number(body.annual_value || 0),
      active: body.active !== false,
      is_customizable: body.is_customizable !== false,
      category_name: typeName,
      ...body,
    };
    this.state.payrollHeads.push(head);
    return head;
  }

  private distributedHeads() {
    const buckets: any = { Earning: [], Deduction: [], Benefits: [], Reimbursement: [] };
    this.state.payrollHeads.forEach((h: any) => {
      const key = h.head_type_name === 'Reimbursement' ? 'Reimbursement'
        : h.head_type_name === 'Deduction' ? 'Deduction'
        : h.head_type_name === 'Benefits' ? 'Benefits'
        : 'Earning';
      buckets[key].push(h);
    });
    return buckets;
  }

  private groupedHeads() {
    const dist = this.distributedHeads();
    return Object.keys(dist).map((category_name) => ({
      category_name,
      heads: dist[category_name],
    }));
  }

  private createStructure(body: any) {
    const row = this.normalizeStructure({ ...body, id: this.nextId() }, undefined);
    this.state.salaryStructures.push(row);
    return row;
  }

  private normalizeStructure(body: any, id?: number) {
    const earnings = body.earnings || [];
    const deductions = body.deductions || [];
    const reimbursements = body.reimbursements || [];
    const all = [...earnings, ...deductions, ...reimbursements];
    return {
      id: id || body.id,
      name: body.name,
      description: body.description,
      active: body.active !== false,
      earnings,
      deductions,
      reimbursements,
      total_components: all.length,
      company: body.company || body.company_id,
    };
  }

  private listLeaves(query: Record<string, string>) {
    const rows = this.state.leaveRequests;
    const page = Number(query['page'] || 1);
    const limit = Number(query['limit'] || 10);
    const pending = rows.filter((l: any) => l.status_name === 'Pending').length;
    const approved = rows.filter((l: any) => l.status_name === 'Approved').length;
    const rejected = rows.filter((l: any) => l.status_name === 'Rejected').length;
    return {
      status: 200,
      data: rows,
      pagination_data: { total_data: rows.length, page_number: page, limit, total_pages: 1 },
      stats: { pending, approved, rejected, total: rows.length },
    };
  }

  private createLeave(body: any) {
    const row = this.enrichLeave({ id: this.nextId(), status: 1, ...body });
    this.state.leaveRequests.unshift(row);
    if (row.status_name === 'Approved') this.syncLeaveToAttendance(row);
    return row;
  }

  private enrichLeave(row: any) {
    const emp = this.byId('employees', row.employee || row.employee_id);
    const type = this.state.leaveTypes.find((t: any) => String(t.id) === String(row.attendance_type));
    const statusMap: any = { 1: 'Pending', 2: 'Approved', 3: 'Rejected', 4: 'Cancelled' };
    return {
      ...row,
      employee: Number(row.employee || emp?.id),
      employee_full_name: emp ? `${emp.first_name} ${emp.last_name}` : row.employee_full_name,
      department: emp?.department_name || row.department,
      attendance_type_name: type?.title || type?.name || row.attendance_type_name || 'Leave',
      status_name: row.status_name || statusMap[Number(row.status)] || 'Pending',
      created_at: row.created_at || new Date().toISOString(),
    };
  }

  private syncLeaveToAttendance(leave: any) {
    if (!leave?.start_date || !leave?.end_date) return;
    const emp = this.byId('employees', leave.employee);
    if (!emp) return;
    const code = (leave.attendance_type_name || '').toLowerCase().includes('sick') ? 'S'
      : (leave.attendance_type_name || '').toLowerCase().includes('unpaid') ? 'A'
      : 'L';
    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      this.state.attendanceOverrides[`${emp.emp_id}_${key}`] = code;
    }
  }

  private attendanceReport(body: any, query: Record<string, string>) {
    const year = Number(body?.year || query['year'] || new Date().getFullYear());
    const month = Number(body?.month || query['month'] || new Date().getMonth() + 1);
    const rows = buildNablusAttendance(year, month).map((row: any) => {
      const emp = this.state.employees.find((e: any) => e.emp_id === row.employee_id || e.id === row.id);
      const attendance = { ...row.attendance };
      Object.keys(this.state.attendanceOverrides).forEach((k: string) => {
        const [empId, date] = k.split('_');
        if ((emp?.emp_id === empId || row.employee_id === empId) && attendance[date] !== undefined) {
          attendance[date] = this.state.attendanceOverrides[k];
        }
      });
      return {
        ...row,
        id: emp?.id || row.id,
        employee_id: emp?.emp_id || row.employee_id,
        employee_name: emp ? `${emp.first_name} ${emp.last_name}` : row.employee_name,
        designation: emp?.designation_name || row.designation,
        department: emp?.department_name || row.department,
        attendance,
      };
    });
    const empId = body?.employee_id || body?.employee;
    const filtered = empId ? rows.filter((r: any) => String(r.id) === String(empId) || r.employee_id === empId) : rows;
    return {
      status: 200,
      data: filtered,
      pagination_data: { total_data: filtered.length, limit: body?.limit || 50, total_pages: 1, page_number: 1 },
    };
  }

  private applyAttendanceEdits(rows: any[]) {
    rows.forEach((row: any) => {
      const empId = row.employee_id || row.emp_id;
      Object.entries(row.attendance || {}).forEach(([date, status]) => {
        this.state.attendanceOverrides[`${empId}_${date}`] = status;
      });
    });
  }

  private listLoans() {
    const rows = this.state.loans.map((l: any) => this.enrichLoan(l));
    return {
      status: 200,
      data: rows,
      pagination_data: { total_data: rows.length, limit: 10, total_pages: 1, page_number: 1 },
    };
  }

  private createLoan(body: any) {
    const row = this.enrichLoan({
      id: this.nextId(),
      employee_id: body.employee || body.employee_id,
      loan_type: body.loan_type,
      principal_amount: Number(body.principal_amount || 0),
      emi_amount: Number(body.emi_amount || 0),
      tenure_months: Number(body.tenure_months || 0),
      outstanding_amount: Number(body.principal_amount || 0),
      interest_rate: Number(body.interest_rate || 0),
      disbursement_date: body.disbursement_date,
      emi_start_date: body.emi_start_date,
      status: 1,
      status_name: 'Active',
      repayment_history: [],
      ...body,
    });
    this.state.loans.unshift(row);
    return row;
  }

  private enrichLoan(row: any) {
    const emp = this.byId('employees', row.employee_id || row.employee);
    const type = this.state.loanTypes.find((t: any) => String(t.id) === String(row.loan_type));
    const paid = (row.repayment_history || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    const principal = Number(row.principal_amount || 0);
    const outstanding = Math.max(0, principal - paid);
    return {
      ...row,
      employee_id: emp?.id || row.employee_id,
      employee_name: emp ? `${emp.first_name} ${emp.last_name}` : row.employee_name,
      employee_details: emp ? { id: emp.id, first_name: emp.first_name, last_name: emp.last_name } : row.employee_details,
      loan_type_details: type || { id: row.loan_type, name: 'Salary Advance' },
      outstanding_amount: outstanding,
      total_paid: paid,
    };
  }

  private loanHistory(body: any) {
    const empId = body?.employee_id;
    const loans = this.state.loans.map((l: any) => this.enrichLoan(l));
    const filtered = empId ? loans.filter((l: any) => String(l.employee_id) === String(empId)) : loans;
    const employees = filtered.map((l: any) => ({
      ...l,
      total_balance_remaining: l.outstanding_amount,
      loan_id: l.id,
    }));
    const overall_summary = {
      total_principal: filtered.reduce((s: number, l: any) => s + Number(l.principal_amount || 0), 0),
      total_outstanding: filtered.reduce((s: number, l: any) => s + Number(l.outstanding_amount || 0), 0),
      total_paid: filtered.reduce((s: number, l: any) => s + Number(l.total_paid || 0), 0),
    };
    if (!empId) {
      return this.ok({ employees, overall_summary });
    }
    return this.ok({ ...employees[0], employees, overall_summary, repayment_history: employees[0]?.repayment_history || [] });
  }

  private recordRepayment(body: any, loanId: string | null) {
    const id = loanId || body.loan_id;
    const loan = this.byListId(this.state.loans, id);
    if (!loan) return this.ok(true, 'Recorded');
    const payment = {
      repayment_id: this.nextId(),
      id: this.nextId(),
      loan_id: loan.id,
      amount: Number(body.amount || body.emi_amount || 0),
      date: body.date || new Date().toISOString().slice(0, 10),
      mode: body.paid_through_account || 'Cash',
    };
    loan.repayment_history = [...(loan.repayment_history || []), payment];
    this.state.loanPayments.push(payment);
    return this.ok(payment, 'Repayment recorded');
  }

  private currentPayRun() {
    const employees = this.payRunEmployees('September 2026', { status: '4' });
    const net = employees.reduce((s: number, e: any) => s + Number(e.net_pay || 0), 0);
    const run = {
      ...this.state.payRuns[0],
      no_of_employees: employees.length,
      employees_net_pay: net,
      is_pending: true,
      status: '4',
    };
    return {
      payroll_runs: [run],
      pending_payroll_runs: [run],
      kpi_summary: {
        total_pending: 1,
        total_employees: employees.length,
        total_net_pay: net,
      },
    };
  }

  private payRunPreview(body: any) {
    const period = body?.processing_period || 'September 2026';
    const employees = this.payRunEmployees(period, { status: body?.status || '4', paymentDate: body?.pay_date });
    const totalNet = employees.reduce((s: number, e: any) => s + Number(e.net_pay || 0), 0);
    const totalGross = employees.reduce((s: number, e: any) => s + Number(e.gross_pay || 0), 0);
    const totalDed = employees.reduce((s: number, e: any) => s + Number(e.deductions || 0), 0);
    const runId = body?.payroll_run_id || this.state.payRuns[0]?.payrun_id || 90001;
    return this.ok({
      employees,
      employee_payroll_details: employees,
      employee_payslip_details: employees.map((e: any) => ({ employee_id: e.employee_id, payslip: e.payslip })),
      detailed_employee_data: employees.map((e: any) => this.toRunDetail(e, String(runId))),
      payroll_summary: {
        payrun_id: runId,
        period,
        base_days: 30,
        pay_day: body?.pay_date || '2026-09-28',
        payroll_cost: totalGross,
        total_net_pay: totalNet,
        total_employees: employees.length,
        status: '4',
        deductions_summary: { total_deductions: totalDed, total_benefit_contribution: 0 },
      },
    });
  }

  private payrollRunDetails(empId: string | null, path: string) {
    const parts = path.replace(/\/+$/, '').split('/').filter(Boolean);
    const employeeId = empId || parts[parts.length - 1];
    const employees = this.payRunEmployees('September 2026', { status: '4' });
    const row = employees.find((e: any) =>
      String(e.employee_id) === String(employeeId) || String(e.emp_id) === String(employeeId)
    ) || employees[0];
    const detail = this.toRunDetail(row, parts[parts.length - 2]);
    return { status: 200, ...detail, data: detail };
  }

  private toRunDetail(row: any, runId?: string) {
    const slip = row?.payslip || {};
    const earnings = (slip.earnings?.items || []).map((i: any) => ({
      head_type_name_display: i.component,
      name: i.component,
      head_name: i.component,
      value: Number(i.amount || 0),
      calculated_value: Number(i.amount || 0),
      calculation_type_name: 'Fixed',
    }));
    const deductions = (slip.deductions?.items || []).map((i: any) => ({
      head_type_name_display: i.component,
      name: i.component,
      head_name: i.component,
      value: Number(i.amount || 0),
      calculated_value: Number(i.amount || 0),
    }));
    return {
      employee_name: row.employee_name,
      emp_id: row.emp_id,
      employee_id: row.employee_id,
      net_pay: Number(row.net_pay || 0),
      gross_pay: Number(row.gross_pay || 0),
      overtime_pay: Number(row.overtime_pay || 0),
      payable_days: Number(row.paid_days || 30),
      actual_payable_days: Number(row.paid_days || 30),
      lop_days: Number(row.lop_days || 0),
      payroll_run_status: String(row.status || '4'),
      payroll_run_id: runId,
      earnings,
      deductions,
      benefits: [],
      totals: { net_pay: Number(row.net_pay || 0) },
      employee_info: { employee_id: row.employee_id, employee_name: row.employee_name },
    };
  }

  private payRunEmployees(period: string, options?: { status?: string; paymentDate?: string }) {
    const status = options?.status || 'PAID';
    return this.state.employees.map((emp: any, idx: number) => {
      const structure = this.state.salaryStructures.find((s: any) => String(s.id) === String(emp.salaryStructure))
        || this.state.salaryStructures[0];
      const earningItems = (structure?.earnings || []).map((c: any) => ({
        component: c.head_name,
        amount: Number(c.monthly_value || 0),
      }));
      const basic = Number(earningItems.find((i: any) => /basic/i.test(i.component))?.amount) || SALARY_BASE[emp.emp_id] || 7000;
      const gross = earningItems.reduce((s: number, i: any) => s + i.amount, 0) || Math.round(basic * 1.45);
      const loan = this.state.loans.find((l: any) => String(l.employee_id) === String(emp.id));
      const loanEmi = loan ? Number(loan.emi_amount || 0) : 0;
      const unpaid = this.state.leaveRequests.filter((l: any) =>
        String(l.employee) === String(emp.id) && l.attendance_type_name === 'Unpaid Leave' && l.status_name !== 'Rejected'
      );
      const lop = unpaid.reduce((s: number, l: any) => s + Number(l.total_days || 0), 0);
      const deductions = Math.round(gross * 0.05) + loanEmi + Math.round((basic / 30) * lop);
      const net = Math.max(0, gross - deductions);
      const name = `${emp.first_name} ${emp.last_name}`;
      return {
        employee_id: emp.id,
        emp_id: emp.emp_id,
        employee_name: name,
        designation: emp.designation_name,
        department: emp.department_name,
        joining_date: emp.joining_date,
        paid_days: Math.max(0, 30 - lop),
        lop_days: lop,
        gross_pay: gross,
        overtime_pay: idx % 3 === 0 ? 450 : 0,
        deductions,
        benefits: Math.round(basic * 0.05),
        net_pay: net,
        payment_mode: 'Bank Transfer',
        payment_status: status === 'PAID' || status === '7' ? 'Paid' : 'Pending',
        status,
        payslip: this.payslipFor(emp, period, {
          gross, deductions, net, basic, earningItems, loanEmi, lop, paymentDate: options?.paymentDate,
        }),
      };
    });
  }

  private payslipFor(emp: any, period: string, extra: any = {}) {
    const basic = extra.basic || SALARY_BASE[emp.emp_id] || 7000;
    const gross = extra.gross || Math.round(basic * 1.45);
    const deductions = extra.deductions || Math.round(gross * 0.05);
    const net = extra.net || gross - deductions;
    const items = extra.earningItems || [
      { component: 'Basic', amount: basic },
      { component: 'Housing Allowance', amount: Math.round(basic * 0.35) },
      { component: 'Transport Allowance', amount: 800 },
    ];
    const dedItems: any[] = [{ component: 'Other Deductions', amount: Math.round(gross * 0.05) }];
    if (extra.loanEmi) dedItems.push({ component: 'Loan EMI', amount: extra.loanEmi });
    return {
      company_info: { company_name: 'Nablus Road Contracting', address: 'Dubai, United Arab Emirates', payslip_month: period },
      employee_summary: {
        employee_name: `${emp.first_name} ${emp.last_name}`,
        designation: emp.designation_name,
        employee_id: emp.emp_id,
        date_of_joining: emp.joining_date,
        pay_period: period,
        pay_date: extra.paymentDate || '',
        bank_account: '••••••••',
      },
      pay_summary: { paid_days: extra.lop != null ? 30 - extra.lop : 30, lop_days: extra.lop || 0, total_net_pay: net },
      earnings: { items, gross_earnings: gross },
      deductions: { items: dedItems, total_deductions: deductions },
      net_pay: { gross_earnings: gross, total_deductions: deductions, net_pay: net, amount_in_words: '' },
    };
  }

  private eosbReport(body: any) {
    const asOf = new Date(body?.calculation_date || new Date().toISOString().slice(0, 10));
    let rows = this.state.employees.map((emp: any) => {
      const join = new Date(emp.joining_date);
      const years = Math.max(0, (asOf.getTime() - join.getTime()) / (365.25 * 24 * 3600 * 1000));
      const basic = SALARY_BASE[emp.emp_id] || emp.basic_salary || 7000;
      const daily = basic / 30;
      const accrued = years < 1 ? 0 : years <= 5 ? daily * 21 * years : daily * 21 * 5 + daily * 30 * (years - 5);
      return {
        employee_id: emp.id,
        emp_id: emp.emp_id,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        department: emp.department_name,
        department_id: emp.department,
        designation: emp.designation_name,
        designation_id: emp.designation,
        joining_date: emp.joining_date,
        service_years: Number(years.toFixed(2)),
        basic_salary: basic,
        accrued_gratuity: Math.round(accrued),
        eligible: years >= 1,
      };
    });
    if (body?.department_id) rows = rows.filter((r: any) => String(r.department_id) === String(body.department_id));
    if (body?.designation_id) rows = rows.filter((r: any) => String(r.designation_id) === String(body.designation_id));
    if (body?.search) {
      const q = String(body.search).toLowerCase();
      rows = rows.filter((r: any) => r.employee_name.toLowerCase().includes(q) || r.emp_id.toLowerCase().includes(q));
    }
    const total = rows.reduce((s: number, r: any) => s + r.accrued_gratuity, 0);
    const eligible = rows.filter((r: any) => r.eligible).length;
    return {
      status: 200,
      data: rows,
      summary: {
        total_employees: rows.length,
        eligible_employees: eligible,
        total_accrued_gratuity: total,
        average_accrued_gratuity: rows.length ? Math.round(total / rows.length) : 0,
      },
      pagination: { page: 1, page_size: rows.length, total_count: rows.length, total_pages: 1 },
      showing: `Showing ${rows.length} employees`,
    };
  }

  private dashboard() {
    const employees = this.state.employees;
    const pendingLeave = this.state.leaveRequests.filter((l: any) => l.status_name === 'Pending').length;
    const loans = this.state.loans;
    const net = this.payRunEmployees('September 2026').reduce((s: number, e: any) => s + e.net_pay, 0);
    return {
      ...DASH,
      kpis: {
        ...DASH.kpis,
        total_employees: employees.length,
        total_payroll_formatted: `AED ${net.toLocaleString()}`,
        pending_approvals: pendingLeave + loans.length,
        pending_approvals_breakdown: { leave: pendingLeave, loans: loans.length },
      },
      active_loans: loans.slice(0, 5).map((l: any) => {
        const emp = this.byId('employees', l.employee_id);
        return {
          employee: emp ? `${emp.first_name} ${emp.last_name}` : l.employee_name,
          amount: l.principal_amount,
          remaining: l.outstanding_amount,
          installments: `${(l.repayment_history || []).length}/${l.tenure_months || 10}`,
        };
      }),
    };
  }

  // ── persistence ────────────────────────────────────────────────────────

  private load(): any {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.employees?.length) return parsed;
      }
    } catch {}
    return this.seed();
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Payroll demo store save failed', e);
    }
  }

  private seed(): any {
    const designations = [
      ...NABLUS_DESIGNATIONS,
      { id: 12107, designation_name: 'Mechanic', department: 12003, company: 1, description: 'Plant mechanic' },
      { id: 12108, designation_name: 'Accounts Officer', department: 12005, company: 1, description: 'Accounts' },
      { id: 12109, designation_name: 'Heavy Driver', department: 12003, company: 1, description: 'Heavy vehicle driver' },
      { id: 12110, designation_name: 'Lab Technician', department: 12002, company: 1, description: 'Materials lab' },
    ];
    const locations = [
      { id: 12301, Location_name: 'Al Quoz Head Office', location_name: 'Al Quoz Head Office', city: 'Dubai' },
      { id: 12302, Location_name: 'Jebel Ali Yard', location_name: 'Jebel Ali Yard', city: 'Dubai' },
      { id: 12303, Location_name: 'Sheikh Zayed Road Site', location_name: 'Sheikh Zayed Road Site', city: 'Dubai' },
    ];
    const payrollHeads = [
      this.head(1, 'Basic', 1, 1, 0, 10000),
      this.head(2, 'Housing Allowance', 1, 2, 35, 3500),
      this.head(3, 'Transport Allowance', 1, 1, 800, 800),
      this.head(4, 'Site Allowance', 1, 1, 1000, 1000),
      this.head(5, 'Overtime', 1, 1, 0, 0),
      this.head(6, 'Loan EMI', 2, 1, 0, 0),
      this.head(7, 'Other Deductions', 2, 2, 5, 0),
      this.head(8, 'Air Ticket Allowance', 3, 1, 0, 0),
      this.head(9, 'Medical Reimbursement', 4, 1, 0, 0),
      this.head(10, 'Fuel Reimbursement', 4, 1, 0, 0),
    ];
    const officeEarnings = [
      { id: 1, head_id: 1, head_name: 'Basic', calculation_type: 1, calculation_type_name: 'Fixed', calculation_value: 0, monthly_value: '8500', annual_value: '102000', head_type: 1, head_type_name: 'Earning' },
      { id: 2, head_id: 2, head_name: 'Housing Allowance', calculation_type: 2, calculation_type_name: '% of Basic', calculation_value: '35', monthly_value: '2975', annual_value: '35700', head_type: 1, head_type_name: 'Earning' },
      { id: 3, head_id: 3, head_name: 'Transport Allowance', calculation_type: 1, calculation_type_name: 'Fixed', calculation_value: 0, monthly_value: '800', annual_value: '9600', head_type: 1, head_type_name: 'Earning' },
    ];
    const siteEarnings = [
      { id: 1, head_id: 1, head_name: 'Basic', calculation_type: 1, calculation_type_name: 'Fixed', calculation_value: 0, monthly_value: '6500', annual_value: '78000', head_type: 1, head_type_name: 'Earning' },
      { id: 2, head_id: 2, head_name: 'Housing Allowance', calculation_type: 2, calculation_type_name: '% of Basic', calculation_value: '35', monthly_value: '2275', annual_value: '27300', head_type: 1, head_type_name: 'Earning' },
      { id: 4, head_id: 4, head_name: 'Site Allowance', calculation_type: 1, calculation_type_name: 'Fixed', calculation_value: 0, monthly_value: '1200', annual_value: '14400', head_type: 1, head_type_name: 'Earning' },
    ];
    const mgmtEarnings = [
      { id: 1, head_id: 1, head_name: 'Basic', calculation_type: 1, calculation_type_name: 'Fixed', calculation_value: 0, monthly_value: '24000', annual_value: '288000', head_type: 1, head_type_name: 'Earning' },
      { id: 2, head_id: 2, head_name: 'Housing Allowance', calculation_type: 2, calculation_type_name: '% of Basic', calculation_value: '35', monthly_value: '8400', annual_value: '100800', head_type: 1, head_type_name: 'Earning' },
      { id: 3, head_id: 3, head_name: 'Transport Allowance', calculation_type: 1, calculation_type_name: 'Fixed', calculation_value: 0, monthly_value: '1500', annual_value: '18000', head_type: 1, head_type_name: 'Earning' },
    ];
    const defaultDeductions = [
      { id: 6, head_id: 6, head_name: 'Loan EMI', calculation_type: 1, calculation_type_name: 'Fixed', calculation_value: 0, monthly_value: '0', annual_value: '0', head_type: 2, head_type_name: 'Deduction' },
    ];
    const defaultReimb = [
      { id: 9, head_id: 9, head_name: 'Medical Reimbursement', calculation_type: 1, calculation_type_name: 'Fixed', calculation_value: 0, monthly_value: '0', annual_value: '0', head_type: 4, head_type_name: 'Reimbursement' },
    ];
    const salaryStructures = [
      { id: 14001, name: 'Site Staff', description: 'Site operations & plant crew', active: true, earnings: siteEarnings, deductions: defaultDeductions, reimbursements: defaultReimb, total_components: 5 },
      { id: 14002, name: 'Office Staff', description: 'Accounts, HR, estimation', active: true, earnings: officeEarnings, deductions: defaultDeductions, reimbursements: defaultReimb, total_components: 5 },
      { id: 14003, name: 'Management', description: 'Project leadership', active: true, earnings: mgmtEarnings, deductions: defaultDeductions, reimbursements: defaultReimb, total_components: 5 },
    ];
    const deptByName: Record<string, number> = {};
    NABLUS_DEPARTMENTS.forEach((d: any) => (deptByName[d.department_name] = d.id));
    const desigByName: Record<string, number> = {};
    designations.forEach((d: any) => (desigByName[d.designation_name] = d.id));
    const structureByDept: Record<string, number> = {
      Projects: 14003, 'Site Operations': 14001, 'Plant & Machinery': 14001, Estimation: 14002, Accounts: 14002, HR: 14002,
    };
    const employees = NABLUS_HR_EMPLOYEES.map((e: any, i: number) => {
      const emp: any = {
        ...e,
        department: deptByName[e.department_name],
        designation: desigByName[e.designation_name],
        branch: i % 2 === 0 ? 12201 : 12202,
        location: i % 3 === 0 ? 12301 : i % 3 === 1 ? 12302 : 12303,
        shift: 15001,
        phone_number: `050${String(1000000 + i).slice(-7)}`,
        phone_country: 1,
        gender: ['Priya', 'Layla', 'Fatima'].includes(e.first_name) ? 'Female' : 'Male',
        emirates_id: `784-1990-${1000000 + i}-1`,
        passport_number: `P${800000 + i}`,
        labour_card_number: `LC${900000 + i}`,
        contract_type: 'unlimited',
        contract_start_date: e.joining_date,
        job_title: e.designation_name,
        portal_access_enabled: i % 4 === 0,
        is_gcc_national: i < 3,
        salaryStructure: structureByDept[e.department_name] || 14002,
        company: 1,
      };
      emp.basic_salary = SALARY_BASE[e.emp_id] || 7000;
      emp.gross_salary = Math.round(emp.basic_salary * 1.45);
      emp.salary_components = [{
        netMonthlySalary: Math.round(emp.gross_salary * 0.95),
        grossMonthlyEarnings: emp.gross_salary,
        basic_salary: emp.basic_salary,
      }];
      return emp;
    });
    const leaveTypes = [
      { id: 5, title: 'Annual Leave', name: 'Annual Leave', code: 'AL', is_leave: true, active: true, color_code: '#28a745', type: 'annual', defaultDays: 30 },
      { id: 6, title: 'Sick Leave', name: 'Sick Leave', code: 'SL', is_leave: true, active: true, color_code: '#dc3545', type: 'sick', defaultDays: 15 },
      { id: 10, title: 'Casual Leave', name: 'Casual Leave', code: 'CL', is_leave: true, active: true, color_code: '#ffc107', type: 'casual', defaultDays: 7 },
      { id: 7, title: 'Compensatory Off', name: 'Compensatory Off', code: 'CO', is_leave: true, active: true, color_code: '#fd7e14', type: 'compensatory', defaultDays: 0 },
      { id: 9, title: 'Unpaid Leave', name: 'Unpaid Leave', code: 'UL', is_leave: true, active: true, color_code: '#6c757d', type: 'unpaid', defaultDays: 0 },
      { id: 8, title: 'Half Day', name: 'Half Day', code: 'HD', is_leave: true, active: true, color_code: '#6f42c1', type: 'halfday', defaultDays: 0 },
      { id: 1, title: 'Present', name: 'Present', code: 'P', is_leave: false, active: true, color_code: '#198754', type: 'present' },
    ];
    const typeNameToId: Record<string, number> = {
      'Annual Leave': 5, 'Sick Leave': 6, 'Unpaid Leave': 9, 'Compensatory Off': 7, 'Casual Leave': 10,
    };
    const leaveRequests = NABLUS_LEAVE_REQUESTS.map((l: any) => {
      const emp = employees.find((e: any) => `${e.first_name} ${e.last_name}` === l.employee_full_name);
      return {
        ...l,
        employee: emp?.id,
        attendance_type: typeNameToId[l.attendance_type_name] || 5,
        status: l.status_name === 'Approved' ? 2 : 1,
        reason: 'Recorded for demo',
        is_lop: l.attendance_type_name === 'Unpaid Leave',
      };
    });
    const loans = [
      {
        id: 16001,
        employee_id: 11002,
        loan_type: 1,
        principal_amount: 15000,
        emi_amount: 1500,
        tenure_months: 10,
        outstanding_amount: 9000,
        interest_rate: 0,
        disbursement_date: '2026-04-01',
        emi_start_date: '2026-05-01',
        status: 1,
        status_name: 'Active',
        currency: 'AED',
        paid_through_account: 'Bank Account',
        reason: 'Family emergency',
        repayment_history: [
          { repayment_id: 17001, amount: 1500, date: '2026-05-28', mode: 'Payroll' },
          { repayment_id: 17002, amount: 1500, date: '2026-06-28', mode: 'Payroll' },
          { repayment_id: 17003, amount: 1500, date: '2026-07-28', mode: 'Payroll' },
          { repayment_id: 17004, amount: 1500, date: '2026-08-28', mode: 'Payroll' },
        ],
      },
    ];
    return {
      nextId: 30000,
      departments: NABLUS_DEPARTMENTS.map((d) => ({ ...d })),
      designations,
      branches: NABLUS_BRANCHES.map((b) => ({ ...b })),
      locations,
      employees,
      payrollHeads,
      earningTypes: [
        { id: 1, earning_type_formatted: 'Basic', is_gpssa: true, is_included_in_salary_structure: true, calculation_type: 1 },
        { id: 2, earning_type_formatted: 'Allowance', is_gpssa: false, is_included_in_salary_structure: true, calculation_type: 1 },
        { id: 3, earning_type_formatted: 'Variable Pay', is_variable: true, calculation_type: 1 },
      ],
      salaryStructures,
      leaveTypes,
      leaveRequests,
      attendanceOverrides: {} as Record<string, string>,
      loanTypes: [
        { id: 1, name: 'Salary Advance' },
        { id: 2, name: 'Personal Loan' },
        { id: 3, name: 'Housing Loan' },
      ],
      loans,
      loanPayments: loans[0].repayment_history,
      shiftTypes: [
        { id: 1, shift: 1, name: 'General Shift', title: 'General Shift', code: 'GEN', active: true },
        { id: 2, shift: 2, name: 'Rotational Shift', title: 'Rotational Shift', code: 'ROT', active: true },
      ],
      subshifts: [
        { id: 15001, shift: 1, title: 'Morning General', time_start: '08:00', time_end: '17:00', active: true, company: 1 },
        { id: 15002, shift: 1, title: 'Office Day', time_start: '09:00', time_end: '18:00', active: true, company: 1 },
        { id: 15003, shift: 2, title: 'Night Rotation', time_start: '20:00', time_end: '05:00', active: true, company: 1 },
      ],
      paySchedule: {
        id: 18001,
        created: true,
        work_week: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        salary_basis: 2,
        org_working_days: 30,
        pay_on: 4,
        fixed_day: 28,
        first_payroll_month: '2026-01-01',
        first_pay_date: '2026-01-28',
        upcoming_payrolls: [
          { label: 'September 2026', pay_date: '28 Sep 2026' },
          { label: 'October 2026', pay_date: '28 Oct 2026' },
        ],
      },
      payRuns: NABLUS_PAY_RUNS.map((r) => ({ ...r })),
      payrollHistory: NABLUS_PAYROLL_HISTORY.map((r) => ({ ...r })),
      payrollSettings: {
        working_hours_per_day: 8,
        working_days_per_week: 6,
        is_financial_year: false,
        year_start: '2026-01-01',
        year_end: '2026-12-31',
        annual_leave_days: 30,
        sick_leave_days: 15,
        casual_leave_days: 7,
        carry_forward_limit: 5,
        allow_leave_encashment: true,
        auto_approval_limit: 3,
        notification_days: 7,
        require_manager_approval: true,
        regular_multiplier: 1.25,
        holiday_multiplier: 1.5,
        weekend_multiplier: 1.5,
        night_shift_multiplier: 1.75,
        daily_overtime_threshold: 8,
        weekly_overtime_threshold: 48,
        max_daily_overtime: 4,
        max_weekly_overtime: 20,
        require_overtime_approval: true,
        include_overtime_in_salary: true,
        attendance_mode: 'daily',
      },
      employeeSettings: {
        custom_fields: [],
        employee_code_config: { prefix: 'NRC', start_number: 11, padding: 3 },
      },
      payRunSettings: {
        allowDeductionsAbove50Percent: true,
        allowFinalSettlement14Days: false,
        includeOvertimeInSalary: true,
        id: 1,
      },
      documents: [],
      settlements: [],
      exitReasons: [
        { id: 1, reason: 'Resignation' },
        { id: 2, reason: 'Termination' },
        { id: 3, reason: 'Contract End' },
        { id: 4, reason: 'Retirement' },
      ],
    };
  }

  private head(id: number, name: string, headType: number, calcType: number, calcValue: number, monthly: number) {
    const typeName = headType === 2 ? 'Deduction' : headType === 3 ? 'Benefits' : headType === 4 ? 'Reimbursement' : 'Earning';
    return {
      id,
      head_name: name,
      payslip_name: name,
      head_type: headType,
      head_type_name: typeName,
      calculation_type: calcType,
      calculation_type_name: calcType === 2 ? '% of Basic' : 'Fixed',
      calculation_value: calcValue,
      monthly_value: monthly,
      annual_value: monthly * 12,
      active: true,
      is_customizable: true,
      category_name: typeName,
    };
  }

  private ok(data: any, message = 'OK') {
    return { status: 200, data, message, code: 1 };
  }

  private nextId() {
    this.state.nextId = (this.state.nextId || 30000) + 1;
    return this.state.nextId;
  }

  private byId(collection: string, id: any) {
    return this.state[collection]?.find((row: any) => String(row.id) === String(id));
  }

  private byListId(list: any[], id: any) {
    return list.find((row: any) => String(row.id) === String(id));
  }

  private patchById(collection: string, id: any, body: any) {
    const row = this.byId(collection, id);
    if (row) Object.assign(row, body);
  }

  private patchList(list: any[], id: any, body: any) {
    const row = this.byListId(list, id);
    if (row) Object.assign(row, body);
  }

  private pathOf(url: string): string {
    try {
      const u = url.startsWith('http') ? new URL(url) : new URL(url, 'http://local.demo');
      return u.pathname.replace(/\/+$/, '') + '/';
    } catch {
      return (url.split('?')[0] || url).replace(/\/+$/, '') + '/';
    }
  }

  private queryOf(url: string): Record<string, string> {
    const out: Record<string, string> = {};
    try {
      const u = url.startsWith('http') ? new URL(url) : new URL(url, 'http://local.demo');
      u.searchParams.forEach((v, k) => (out[k] = v));
    } catch {
      const q = url.split('?')[1];
      if (q) {
        q.split('&').forEach((pair) => {
          const [k, v] = pair.split('=');
          if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '');
        });
      }
    }
    return out;
  }

  private idFrom(path: string): string | null {
    const m = path.replace(/\/+$/, '').match(/\/(\d+)$/);
    return m ? m[1] : null;
  }

  private normalizeBody(body: any): any {
    if (!body) return {};
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      const obj: any = {};
      body.forEach((v, k) => (obj[k] = v));
      return obj;
    }
    if (typeof body === 'string') {
      try { return JSON.parse(body); } catch { return {}; }
    }
    return body;
  }
}
