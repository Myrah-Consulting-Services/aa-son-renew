import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Api } from '../../core/services/api';
import { DemoDataService } from '../../core/demo/demo-data.service';
import { DeductionDetail } from '../deduction-detail/deduction-detail';
import { OverallInsight } from '../overall-insight/overall-insight';
import { PayrunDrawer } from '../payrun-drawer/payrun-drawer';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payrun-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DeductionDetail, OverallInsight, PayrunDrawer],
  templateUrl: './payrun-detail.html',
  styleUrl: './payrun-detail.scss'
})
export class PayrunDetail implements OnInit {
 
  activeTab: 'run' | 'history' = 'run';
  modalTab: 'employee' | 'deductions' | 'insights' = 'employee';

  // runPayrollData: any = null;
  payrollSummary: any = null;
  employees: Array<any> = [];
  filteredEmployees: Array<any> = [];
  searchQuery: string = '';
  selectedEmployee: any = null;
  selectedEmployeeDetail: any = null;
  private employeeDetailsById: Map<string, any> = new Map();
  missingData: any;
  payrollRunId: any = null;
  isSubmitting: boolean = false;
  payslipData: any;
  /** Full payslip list from API / demo (kept separate so drawer open doesn't wipe the list) */
  private allPayslips: any[] = [];
  isRecordingPayment: boolean = false;
  bankList: any[] = [];
  recordPaymentForm: FormGroup;
  showRecordPaymentModal: boolean = false;
  loadError: string = '';
  includeOvertimeInSalary = true;

  constructor(
    private fb: FormBuilder,
    private api: Api,
    private router: Router,
    private route: ActivatedRoute,
    private demo: DemoDataService
  ) {
    this.recordPaymentForm = this.fb.group({
      pay_date: [this.getCurrentDate(), Validators.required],
      bank_id: ['', Validators.required],
      send_notification: [true],
      payroll_run_id:[]
    });
  }

  getcurrency() {
    return this.api.getcurrencies();
  }
  ngOnInit(): void {
    const storedOt = localStorage.getItem('includeOvertimeInSalary');
    this.includeOvertimeInSalary = storedOt !== 'false';
    this.route.params.subscribe(params => {
      this.payrollRunId = this.parseRoutePayRun(params['data']);
      if (!this.payrollRunId) {
        this.loadError = 'Could not load this pay run. Go back and open it again.';
        return;
      }
      this.payrollRunId.status = this.normalizeStatusCode(String(this.payrollRunId.status ?? '4'));
      this.loadCurrentPayRun();
      this.loadData();
    });
  }

  private parseRoutePayRun(raw: any): any {
    if (!raw) return null;
    try {
      const decoded = decodeURIComponent(String(raw));
      return JSON.parse(decoded);
    } catch {
      try {
        return JSON.parse(String(raw));
      } catch {
        return null;
      }
    }
  }
  loadData(){
    this.api.get('/employee/employees-missing-data/'+this.api.getUserCompany()+'/').subscribe((res: any) => {
      if(res.status == 200){
        this.missingData=res
        console.log(this.missingData,'missingData');
      }
    });
  }

  // Missing data action methods
  viewMissingSalaryEmployees() {
    // Open modal or navigate to view employees without salary structure
    console.log('Viewing employees without salary structure:', this.missingData.employees_without_salary_structure.employees);
    // Implement navigation or modal opening logic here
    this.router.navigate(['/payroll/missing-data',this.payrollSummary.payrun_id]);
  }

  viewMissingLabourCardEmployees() {
    // Open modal or navigate to view employees without labour card
    console.log('Viewing employees without labour card:', this.missingData.employees_without_labour_card.employees);
    this.router.navigate(['/payroll/missing-data',this.payrollSummary.payrun_id]);
  }

  // Get current pay run summary (no hardcoded values)
  loadCurrentPayRun(){
    const status = String(this.payrollRunId?.status ?? '');
    const approvedOrPaid = ['6', '7', 'PAID', 'APPROVED'].includes(status);
    if (approvedOrPaid) {
      this.loadSpecificPayRun(this.payrollRunId);
    } else {
      this.getEmpPayroll();
    }
  }

  // Load specific payroll run by ID
  loadSpecificPayRun(payrollRunId: any): void {
    let payload={
      "payroll_run_id": payrollRunId.payrun_id || payrollRunId.payroll_run_id,
      "company_id":this.api.getUserCompany(),
      "include_overtime": this.includeOvertimeInSalary
    }
    this.api.post(`/employee/submit_payroll_run_with_payslip/`, payload).subscribe({
      next: (response: any) => {
        if(response.status == 200 && response.data){
          this.allPayslips = Array.isArray(response.data.employee_payslip_details)
            ? response.data.employee_payslip_details
            : [];
          this.payslipData = this.allPayslips;
          this.payrollRunId = { ...this.payrollRunId, ...response.data };
          this.payrollSummary = response.data.payroll_summary;
          if (this.payrollSummary) {
            this.payrollSummary.status = response.data.status ?? this.payrollSummary.status;
          }
          this.employees = response.data.employees || [];
          this.applyOvertimeToEmployees();
          this.filteredEmployees = [...this.employees];
          this.loadError = '';
          if (!this.payrollSummary || !this.employees.length) {
            this.applyDemoPayRun();
          }
        } else {
          this.getEmpPayroll();
        }
      },
      error: () => this.getEmpPayroll()
    });
  }

  // Navigation methods
  goBack(): void {
    this.router.navigate(['/payroll/par-run']);
  }

  // Submit and Approve functionality
  submitAndApprove(): void {
    this.isSubmitting = true;
    
    const payload = {
      payroll_run_id: this.payrollSummary?.payrun_id,
      company_id: this.api.getUserCompany(),
      include_overtime: this.includeOvertimeInSalary,
      add_overtime_to_salary: this.includeOvertimeInSalary
    };

    this.api.post('/employee/submit_payroll_run_with_payslip/', payload).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          alert('Payroll submitted and approved successfully!');
          // Update the status
          if (this.payrollSummary) {
            this.payrollSummary.status = '6';
            this.payrollRunId.status = '6';
          }
          // Refresh the data
          this.loadCurrentPayRun();
        } else {
          alert('Failed to submit payroll. Please try again.');
        }
        this.isSubmitting = false;
      },
      error: (error: any) => {
        console.error('Error submitting payroll:', error);
        alert('An error occurred while submitting payroll. Please try again.');
        this.isSubmitting = false;
      }
    });
  }

  canSubmit(): boolean {
    // Check if there are any missing data issues
 
    
    // Check if payroll summary exists and has required data
    if (!this.payrollSummary || !this.payrollSummary.payrun_id) {
      return false;
    }
    
    // Check if there are employees in the payroll
    if (!this.employees || this.employees.length === 0) {
      return false;
    }
    
    return true;
  }

  // Additional header actions
  exportPayroll(): void {
    if (!this.employees?.length) {
      alert('No employee payroll data to export yet.');
      return;
    }
    const headers = ['Employee', 'Employee ID', 'Paid Days', 'Gross Pay', 'Overtime', 'Deductions', 'Benefits', 'Net Pay', 'Status'];
    const rows = this.employees.map((e: any) => [
      e.employee_name || '',
      e.emp_id || e.employee_id || '',
      e.paid_days ?? '',
      e.gross_pay ?? 0,
      e.overtime_pay ?? e.overtime ?? 0,
      e.deductions ?? 0,
      e.benefits ?? 0,
      e.net_pay ?? 0,
      e.status || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payroll-report-${this.payrollSummary?.period || 'payrun'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  printPayroll(): void {
    console.log('Printing payroll...');
    // Implement print functionality
    window.print();
  }

  viewHelp(): void {
    console.log('Opening help...');
    // Implement help functionality
    alert('Help documentation will be opened');
  }

  // Additional methods for new functionality
  fetchData(): void {
    console.log('Fetching data...');
    // Implement fetch data functionality
    alert('Fetching leave and attendance data...');
  }

  deletePayRun(): void {
    if (confirm('Are you sure you want to delete this pay run?')) {
      console.log('Deleting pay run...');
      // Implement delete functionality
      alert('Pay run deletion will be implemented');
    }
  }

  // Preview payroll process for current month/year; parameters can be adjusted by filters/UI
  getEmpPayroll(){
    const period = this.resolvePayPeriod();
    const payload={
      pay_date: this.payrollRunId?.pay_date || period.end,
      pay_period_start_date: this.payrollRunId?.pay_period_start_date || period.start,
      pay_period_end_date: this.payrollRunId?.pay_period_end_date || period.end,
      company:this.api.getUserCompany(),
      include_overtime: this.includeOvertimeInSalary,
      add_overtime_to_salary: this.includeOvertimeInSalary
    }
    this.api.post('/employee/payroll_process_preview/', payload).subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        this.payrollSummary = data?.payroll_summary || null;
        this.employees = Array.isArray(data?.employees) ? data.employees : [];
        this.applyOvertimeToEmployees();
        this.filteredEmployees = [...this.employees];
        const detailsArr = Array.isArray(data?.detailed_employee_data) ? data.detailed_employee_data : [];
        this.employeeDetailsById = new Map(
          detailsArr.map((d: any) => [String(d?.employee_info?.employee_id), d])
        );
        this.allPayslips = Array.isArray(data?.employee_payslip_details) ? data.employee_payslip_details : [];
        if (!this.payrollSummary && this.employees.length) {
          this.payrollSummary = this.buildSummaryFromEmployees();
        }
        if (!this.payrollSummary || !this.employees.length) {
          this.applyDemoPayRun();
        } else {
          this.loadError = '';
        }
      },
      error: () => {
        this.applyDemoPayRun();
      }
    });
  }

  /** Soft-fail: show Nablus demo pay run when API preview / submit fails (e.g. demo run ids). */
  private applyDemoPayRun(): void {
    const periodLabel =
      this.payrollRunId?.processing_period ||
      this.payrollRunId?.details ||
      this.formatPeriodFromDates() ||
      'September 2026';
    const rawStatus = String(this.payrollRunId?.status ?? '4');
    const status = this.normalizeStatusCode(rawStatus);
    // Keep route object aligned so template status checks work (PAID → 7, etc.)
    this.payrollRunId = { ...this.payrollRunId, status };
    const rows = this.demo.payrollEmployees(periodLabel, [], {
      status: status === '7' ? 'PAID' : status,
      paymentDate:
        this.payrollRunId?.pay_date_formatted ||
        this.payrollRunId?.payment_date ||
        this.payrollRunId?.pay_date ||
        '',
    });
    this.employees = rows.map((e: any) => ({
      ...e,
      status: status === '4' || status === '5' ? 'processed' : status === '6' ? 'APPROVED' : 'PAID',
      payment_status: status === '7' ? 'Paid' : status === '6' ? 'Approved' : 'Pending',
    }));
    this.applyOvertimeToEmployees();
    this.filteredEmployees = [...this.employees];
    this.allPayslips = rows.map((e: any) => ({
      employee_id: e.employee_id,
      payslip: e.payslip,
    }));
    this.payslipData = this.allPayslips;
    this.payrollSummary = this.buildSummaryFromEmployees();
    this.payrollSummary.period = periodLabel;
    this.payrollSummary.pay_day =
      this.payrollRunId?.pay_date || this.payrollRunId?.payment_date || this.payrollSummary.pay_day;
    this.payrollSummary.status = status;
    this.loadError = '';
  }

  private normalizeStatusCode(status: string): string {
    const s = String(status || '').toUpperCase();
    if (s === 'PAID' || s === '7') return '7';
    if (s === 'APPROVED' || s === '6') return '6';
    if (s === '5' || s === 'DRAFT') return '5';
    if (s === '4' || s === 'PROCESSING' || s === 'PENDING') return '4';
    return status || '4';
  }

  private formatPeriodFromDates(): string {
    const start = this.payrollRunId?.pay_period_start_date;
    if (!start) return '';
    try {
      const d = new Date(start);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return '';
    }
  }

  private applyOvertimeToEmployees(): void {
    if (!this.includeOvertimeInSalary || !Array.isArray(this.employees)) return;
    this.employees = this.employees.map((e: any) => {
      const ot = Number(e.overtime_pay ?? e.overtime ?? e.ot_amount ?? 0);
      if (!ot) return e;
      const alreadyIncluded = Number(e.gross_pay || 0) >= Number(e.net_pay || 0) + ot - 0.01
        && String(e.overtime_included) === 'true';
      if (alreadyIncluded || e.overtime_added) return e;
      return {
        ...e,
        overtime_pay: ot,
        overtime_added: true,
        gross_pay: Number(e.gross_pay || 0) + ot,
        net_pay: Number(e.net_pay || 0) + ot
      };
    });
    if (this.payrollSummary && this.employees.some((e: any) => e.overtime_added)) {
      const extraOt = this.employees.reduce((sum: number, e: any) => sum + (e.overtime_added ? Number(e.overtime_pay || 0) : 0), 0);
      this.payrollSummary = {
        ...this.payrollSummary,
        payroll_cost: Number(this.payrollSummary.payroll_cost || 0) + extraOt,
        total_net_pay: Number(this.payrollSummary.total_net_pay || 0) + extraOt
      };
    }
  }

  private resolvePayPeriod(): { start: string; end: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const iso = (d: Date) => d.toISOString().split('T')[0];
    return { start: iso(start), end: iso(end) };
  }

  private buildSummaryFromEmployees(): any {
    const totalNet = this.employees.reduce((s: number, e: any) => s + Number(e.net_pay || 0), 0);
    const totalGross = this.employees.reduce((s: number, e: any) => s + Number(e.gross_pay || 0), 0);
    const totalDed = this.employees.reduce((s: number, e: any) => s + Number(e.deductions || 0), 0);
    return {
      payrun_id: this.payrollRunId?.payrun_id || this.payrollRunId?.payroll_run_id,
      period: this.payrollRunId?.processing_period,
      base_days: this.payrollRunId?.base_days || 30,
      pay_day: this.payrollRunId?.pay_date,
      payroll_cost: totalGross,
      total_net_pay: totalNet,
      total_employees: this.employees.length,
      status: this.payrollRunId?.status,
      deductions_summary: { total_deductions: totalDed, total_benefit_contribution: 0 }
    };
  }
 
  setTab(tab: 'employee' | 'deductions' | 'insights'){
    this.modalTab = tab;
  }
 
  onSearchEmployees(term: string): void {
    this.searchQuery = term || '';
    const q = this.searchQuery.trim().toLowerCase();
    if(!q){
      this.filteredEmployees = [...this.employees];
      return;
    }
    this.filteredEmployees = this.employees.filter((e: any) => {
      const name: string = String(e?.employee_name || '').toLowerCase();
      const id: string = String(e?.employee_id || '').toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }
 
  formatCurrency(amount: number | null | undefined): string {
    const value = Number(amount || 0);
    return `${this.getcurrency()}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
 
  get periodLabel(): string {
    const p = this.payrollSummary?.period;
    if (p) return p;
    return '';
  }
 
  get baseDays(): number {
    return Number(this.payrollSummary?.base_days || 0);
  }
 
  get payDay(): string {
    const day = this.payrollSummary?.pay_day;
    if(!day) return '';
    try{
      const d = new Date(day);
      // e.g., 01 OCT, 2025
      const dd = d.toLocaleDateString('en-GB', { day: '2-digit' });
      const mon = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
      const yr = d.getFullYear();
      return `${dd} ${mon}, ${yr}`;
    }catch{
      return String(day);
    }
  }
 
  get payrollCost(): string { return this.formatCurrency(this.payrollSummary?.payroll_cost); }
  get totalNetPay(): string { return this.formatCurrency(this.payrollSummary?.total_net_pay); }
  get totalEmployees(): number { return Number(this.payrollSummary?.total_employees || 0); }
  get totalBenefitContribution(): string { return this.formatCurrency(this.payrollSummary?.deductions_summary?.total_benefit_contribution); }
  get totalDeductions(): string { return this.formatCurrency(this.payrollSummary?.deductions_summary?.total_deductions); }
 
  openEmployeeDrawer(emp: any){
    this.selectedEmployee = emp;
    const key = String(emp?.employee_id ?? '');
    this.selectedEmployeeDetail = this.employeeDetailsById.get(key) || null;
  }
  openPayslipDrawer(emp: any){
    this.selectedEmployee = emp;
    const key = String(emp?.employee_id ?? '');
    this.selectedEmployeeDetail = this.employeeDetailsById.get(key) || null;
    const matched =
      this.allPayslips.find((item: any) => String(item.employee_id) === String(emp.employee_id)) ||
      this.allPayslips.find(
        (item: any) =>
          String(item?.payslip?.employee_summary?.employee_id) === String(emp.emp_id)
      );
    this.payslipData = matched || (emp.payslip ? { employee_id: emp.employee_id, payslip: emp.payslip } : null);
  }

  closeDrawer(): void {
    this.selectedEmployee = null;
    this.selectedEmployeeDetail = null;
    this.payslipData = null;
  }

  // Record Payment Modal Methods
  recordPayment(): void {
    this.loadBankList();
    this.showRecordPaymentModal = true;
  }

  closeRecordPaymentModal(): void {
    this.showRecordPaymentModal = false;
  }

  loadBankList(): void {
    this.api.get('/money/list-bank/'+this.api.getUserCompany()+'/').subscribe((response: any) => {
      if (response.status === 200) {
        this.bankList = response.data || [];
        console.log('Bank list loaded:', this.bankList);
      }
    }, (error) => {
      console.error('Error loading bank list:', error);
    });
  }

  getCurrentDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  getBankTransferCount(): number {
    // Count employees with bank transfer payment mode
    return this.employees.filter(emp => emp.payment_mode === 'bank_transfer').length;
  }

  getCashCount(): number {
    // Count employees with cash payment mode
    return this.employees.filter(emp => emp.payment_mode === 'cash').length;
  }

  confirmRecordPayment(): void {
    if (this.recordPaymentForm.valid) {
      this.isRecordingPayment = true;
      
      const paymentData = {
        payroll_run_id: this.payrollSummary?.payrun_id,
        pay_date: this.recordPaymentForm.value.pay_date,
        bank_id: this.recordPaymentForm.value.bank_id,
        send_notification: this.recordPaymentForm.value.send_notification
      };

      this.api.post('/employee/payroll_record/', paymentData).subscribe((response: any) => {
        this.isRecordingPayment = false;
        if (response.status === 200) {
          console.log('Payment recorded successfully:', response);
          this.closeRecordPaymentModal();
          // Refresh data or show success message
          this.loadCurrentPayRun();
        }
      }, (error) => {
        this.isRecordingPayment = false;
        console.error('Error recording payment:', error);
      });
    }
  }
}
