import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
import { PayrunDetail } from "../payrun-detail/payrun-detail";
import { FeaturesRoutingModule } from "../../features/features-routing-module";
import { Router, RouterLink } from '@angular/router';
import { Api } from '../../core/services/api';
import { DemoDataService } from '../../core/demo/demo-data.service';

@Component({
  selector: 'app-par-run',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PayrunDetail, FeaturesRoutingModule, RouterLink],
  templateUrl: './par-run.html',
  styleUrl: './par-run.scss'
})
export class ParRun implements OnInit {
  activeTab: 'run' | 'history' = 'run';
  selectedFilter: 'all' | 'regular' | 'bulk' = 'all';

  settings: any = {
    allowDeductionsAbove50Percent: true,
    allowFinalSettlement14Days: false,
    includeOvertimeInSalary: true,
    id: null
  };

  runPayrollData: any;
  bulkSettlementBatches: any[] = [];
  paySlipData: any = null;
  showPayslipModal = false;

  payrollHistory: any[] = [];
  filteredPayrollHistory: any[] = [];

  showSettingsModal = false;

  /** Expanded month / history keys */
  expandedRunKey: string | null = null;
  expandedHistoryKey: string | null = null;

  /** Cache: payrun key → employees */
  runEmployees: Record<string, any[]> = {};
  historyEmployees: Record<string, any[]> = {};
  /** Cache: payrun key → payslip details array from API */
  payslipByRun: Record<string, any[]> = {};
  loadingEmployees: Record<string, boolean> = {};

  constructor(
    private fb: FormBuilder,
    private api: Api,
    private router: Router,
    private demo: DemoDataService
  ) {}

  getcurrency() {
    return this.api.getcurrencies();
  }

  setActiveTab(tab: 'run' | 'history'): void {
    this.activeTab = tab;
  }

  ngOnInit(): void {
    this.getPayrol();
    this.getPayrollHistory();
    this.loadSettings();
    this.applyRevisedSalary();
  }

  kpiSummary: any;
  pendingRuns: any[] = [];

  getPayrol(): void {
    this.api.get('/employee/current_month_payroll_run/?' + 'company_id=' + this.api.getCompanyId()).subscribe({
      next: (response: any) => {
        if (response.status == 200) {
          const data = response.data;
          const apiRuns = this.normalizePayRuns(data);
          this.runPayrollData = this.demo.payRuns(apiRuns);
          this.pendingRuns = data?.pending_payroll_runs ?? this.runPayrollData.filter(
            (r: any) => r.is_pending || r.status === '4' || r.status === 4
          );
          this.kpiSummary = data?.kpi_summary ?? {};
        } else {
          this.applyDemoPayRuns();
        }
      },
      error: () => this.applyDemoPayRuns()
    });
  }

  private normalizePayRuns(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.payroll_runs)) return data.payroll_runs;
    if (data?.payroll_run) return [data.payroll_run];
    if (data && (data.payrun_id || data.payroll_run_id || data.processing_period)) return [data];
    return [];
  }

  private applyDemoPayRuns(): void {
    this.runPayrollData = this.demo.payRuns([]);
    this.pendingRuns = this.runPayrollData.filter(
      (r: any) => r.is_pending || r.status === '4' || r.status === 4
    );
  }

  getPayrollHistory(): void {
    this.api.get('/employee/payroll_history/' + this.api.getCompanyId() + '/').subscribe({
      next: (response: any) => {
        if (response.status == 200) {
          const apiData = response.data || [];
          const paid = apiData.filter((item: any) => item.status == 'PAID' || item.status == '7');
          this.payrollHistory = this.demo.payrollHistory(paid);
          this.filteredPayrollHistory = [...this.payrollHistory];
          this.bulkSettlementBatches = apiData.filter((item: any) => item.payroll_type == 'Bulk Payroll');
        } else {
          this.payrollHistory = this.demo.payrollHistory([]);
          this.filteredPayrollHistory = [...this.payrollHistory];
        }
      },
      error: () => {
        this.payrollHistory = this.demo.payrollHistory([]);
        this.filteredPayrollHistory = [...this.payrollHistory];
      }
    });
  }

  runKey(item: any): string {
    return String(item?.payrun_id || item?.payroll_run_id || item?.processing_period || item?.details || 'run');
  }

  historyKey(item: any): string {
    return String(item?.payrun_id || item?.payroll_run_id || item?.payment_date || item?.details || 'hist');
  }

  periodLabel(item: any): string {
    return (
      item?.processing_period ||
      item?.details ||
      item?.payroll_type ||
      this.getCurrentPeriod()
    );
  }

  toggleRunEmployees(item: any, event?: Event): void {
    event?.stopPropagation();
    const key = this.runKey(item);
    if (this.expandedRunKey === key) {
      this.expandedRunKey = null;
      return;
    }
    this.expandedRunKey = key;
    this.loadEmployeesForPeriod(item, 'run');
  }

  toggleHistoryEmployees(item: any, event?: Event): void {
    event?.stopPropagation();
    const key = this.historyKey(item);
    if (this.expandedHistoryKey === key) {
      this.expandedHistoryKey = null;
      return;
    }
    this.expandedHistoryKey = key;
    this.loadEmployeesForPeriod(item, 'history');
  }

  private loadEmployeesForPeriod(item: any, mode: 'run' | 'history'): void {
    const key = mode === 'run' ? this.runKey(item) : this.historyKey(item);
    const cache = mode === 'run' ? this.runEmployees : this.historyEmployees;
    if (cache[key]?.length) return;

    const runId = item?.payrun_id || item?.payroll_run_id;
    const period = this.periodLabel(item);
    const status = String(item?.status ?? '');
    const isPaidOrApproved = ['6', '7', 'PAID', 'APPROVED'].includes(status);

    this.loadingEmployees[key] = true;

    const applyRows = (rows: any[], payslips?: any[]) => {
      const normalized = (rows || []).map((e: any) => ({
        ...e,
        employee_id: e.employee_id ?? e.id,
        emp_id: e.emp_id || e.employee_code || e.employee_no,
        employee_name: e.employee_name || `${e.first_name || ''} ${e.last_name || ''}`.trim(),
        designation: e.designation || e.designation_name || e.job_title || '',
        paid_days: e.paid_days ?? e.payable_days ?? 30,
        gross_pay: e.gross_pay ?? e.gross ?? 0,
        net_pay: e.net_pay ?? e.net ?? 0,
        overtime_pay: e.overtime_pay ?? e.overtime ?? 0,
        deductions: e.deductions ?? e.total_deductions ?? 0,
        payment_mode: e.payment_mode || e.payment_method || 'Bank Transfer',
        status: e.status || status,
      }));
      const demoRows = this.demo.payrollEmployees(period, normalized, {
        status: isPaidOrApproved ? 'PAID' : status || '4',
        paymentDate: item?.payment_date || item?.pay_date || item?.pay_date_formatted || '',
      });
      cache[key] = demoRows;
      if (payslips?.length) {
        this.payslipByRun[key] = payslips;
      } else {
        this.payslipByRun[key] = demoRows.map((e: any) => ({
          employee_id: e.employee_id,
          payslip: e.payslip || this.buildFallbackPayslip(e, period, item),
        }));
      }
      this.loadingEmployees[key] = false;
    };

    if (!runId) {
      applyRows([]);
      return;
    }

    const payload = {
      payroll_run_id: runId,
      company_id: this.api.getUserCompany(),
      include_overtime: !!this.settings.includeOvertimeInSalary,
      add_overtime_to_salary: !!this.settings.includeOvertimeInSalary,
    };

    const endpoint = isPaidOrApproved
      ? '/employee/submit_payroll_run_with_payslip/'
      : '/employee/payroll_process_preview/';

    this.api.post(endpoint, payload).subscribe({
      next: (response: any) => {
        if (response?.status == 200 && response?.data) {
          const employees = response.data.employees || response.data.employee_payroll_details || [];
          const payslips = response.data.employee_payslip_details || [];
          applyRows(Array.isArray(employees) ? employees : [], Array.isArray(payslips) ? payslips : []);
        } else {
          applyRows([]);
        }
      },
      error: () => applyRows([]),
    });
  }

  private buildFallbackPayslip(emp: any, period: string, runItem: any): any {
    const gross = Number(emp.gross_pay || 0);
    const ot = Number(emp.overtime_pay || emp.overtime || 0);
    const ded = Number(emp.deductions || 0);
    const net = Number(emp.net_pay || gross - ded);
    return {
      company_info: {
        company_name: 'Nablus Road Contracting',
        address: 'Dubai, United Arab Emirates',
        payslip_month: period,
      },
      employee_summary: {
        employee_name: emp.employee_name,
        designation: emp.designation || '',
        employee_id: emp.emp_id,
        date_of_joining: emp.joining_date || '',
        pay_period: period,
        pay_date: runItem?.payment_date || runItem?.pay_date || '',
        bank_account: '—',
      },
      pay_summary: { paid_days: emp.paid_days ?? 30, lop_days: emp.lop_days ?? 0, total_net_pay: net },
      earnings: {
        items: [
          { component: 'Gross Pay', amount: Math.max(gross - ot, 0) },
          ...(ot ? [{ component: 'Overtime', amount: ot }] : []),
        ],
        gross_earnings: gross,
      },
      deductions: {
        items: ded ? [{ component: 'Deductions', amount: ded }] : [],
        total_deductions: ded,
      },
      net_pay: { gross_earnings: gross, total_deductions: ded, net_pay: net, amount_in_words: '' },
    };
  }

  getEmployees(item: any, mode: 'run' | 'history'): any[] {
    const key = mode === 'run' ? this.runKey(item) : this.historyKey(item);
    return (mode === 'run' ? this.runEmployees : this.historyEmployees)[key] || [];
  }

  isLoadingEmployees(item: any, mode: 'run' | 'history'): boolean {
    const key = mode === 'run' ? this.runKey(item) : this.historyKey(item);
    return !!this.loadingEmployees[key];
  }

  openPayslip(item: any, emp: any, mode: 'run' | 'history', event?: Event): void {
    event?.stopPropagation();
    const key = mode === 'run' ? this.runKey(item) : this.historyKey(item);
    const period = this.periodLabel(item);
    const payslips = this.payslipByRun[key] || [];
    const matched =
      payslips.find((p: any) => String(p.employee_id) === String(emp.employee_id)) ||
      payslips.find((p: any) => String(p?.payslip?.employee_summary?.employee_id) === String(emp.emp_id));

    const slip = matched?.payslip || emp.payslip || null;
    this.paySlipData = this.mapPayslipForModal(slip, emp, period, item);
    this.showPayslipModal = true;
  }

  closePayslipModal(): void {
    this.showPayslipModal = false;
    this.paySlipData = null;
  }

  private mapPayslipForModal(slip: any, emp: any, period: string, runItem: any): any {
    const company = slip?.company_info || {};
    const summary = slip?.employee_summary || {};
    const paySummary = slip?.pay_summary || {};
    const earnings = (slip?.earnings?.items || []).map((i: any) => ({
      component: i.component || i.name || i.head_name || 'Earning',
      amount: Number(i.amount ?? i.value ?? 0),
    }));
    const deductions = (slip?.deductions?.items || []).map((i: any) => ({
      component: i.component || i.name || i.head_name || 'Deduction',
      amount: Number(i.amount ?? i.value ?? 0),
    }));
    const reimbursements = (slip?.reimbursements?.items || []).map((i: any) => ({
      component: i.component || i.name || i.head_name || 'Reimbursement',
      amount: Number(i.amount ?? i.value ?? 0),
    }));

    if (!earnings.length && emp) {
      earnings.push({ component: 'Gross Pay', amount: Number(emp.gross_pay || 0) });
      if (emp.overtime_pay || emp.overtime) {
        earnings.push({ component: 'Overtime', amount: Number(emp.overtime_pay || emp.overtime || 0) });
      }
    }
    if (!deductions.length && emp?.deductions) {
      deductions.push({ component: 'Deductions', amount: Number(emp.deductions || 0) });
    }

    return {
      companyName: company.company_name || 'Nablus Road Contracting',
      companyAddress: company.address || 'Dubai, United Arab Emirates',
      payslipMonth: company.payslip_month || period,
      logoUrl: company.logo_url || '',
      employee: {
        name: summary.employee_name || emp?.employee_name || 'Employee',
        employeeNo: summary.employee_id || emp?.emp_id || '',
        designation: summary.designation || emp?.designation || '',
        bankAccountNo: summary.bank_account || '—',
        wpsNumber: summary.mol_id || '—',
        joiningDate: summary.date_of_joining || emp?.joining_date || '—',
        paidDays: paySummary.paid_days ?? emp?.paid_days ?? 30,
      },
      earnings,
      deductions,
      reimbursements,
      netPayableInWords:
        slip?.net_pay?.amount_in_words ||
        `Net pay ${this.getcurrency()} ${Number(slip?.net_pay?.net_pay ?? emp?.net_pay ?? 0).toFixed(2)}`,
      _rawNet: Number(slip?.net_pay?.net_pay ?? emp?.net_pay ?? 0),
      _period: period,
      _paymentDate: runItem?.payment_date || runItem?.pay_date || '',
    };
  }

  downloadPayslipPdf(): void {
    if (!this.paySlipData) return;
    const ps = this.paySlipData;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Please allow popups to download the payslip PDF');
      return;
    }
    const earnRows = (ps.earnings || [])
      .map((i: any) => `<tr><td>${i.component}</td><td style="text-align:right">${this.getcurrency()} ${Number(i.amount).toFixed(2)}</td></tr>`)
      .join('');
    const dedRows = (ps.deductions || [])
      .map((i: any) => `<tr><td>${i.component}</td><td style="text-align:right">${this.getcurrency()} ${Number(i.amount).toFixed(2)}</td></tr>`)
      .join('');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Payslip - ${ps.employee?.name}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;color:#1f2937}
        h1{margin:0 0 4px;font-size:20px} h2{margin:0;font-size:16px;color:#41299b}
        .muted{color:#6b7280;font-size:12px} table{width:100%;border-collapse:collapse;margin-top:8px}
        th,td{border:1px solid #e5e7eb;padding:8px;font-size:13px} th{background:#f3f4f6;text-align:left}
        .net{margin-top:16px;padding:12px;background:#ecfdf5;border:1px solid #86efac;font-weight:bold;color:#166534}
        .grid{display:flex;gap:24px;margin:16px 0} .grid>div{flex:1}
      </style></head><body>
      <h1>${ps.companyName}</h1>
      <div class="muted">${ps.companyAddress}</div>
      <h2 style="margin-top:12px">Payslip for ${ps.payslipMonth}</h2>
      <div class="grid">
        <div>
          <div><strong>Employee:</strong> ${ps.employee?.name}</div>
          <div><strong>Employee No:</strong> ${ps.employee?.employeeNo}</div>
          <div><strong>Designation:</strong> ${ps.employee?.designation}</div>
          <div><strong>Paid Days:</strong> ${ps.employee?.paidDays}</div>
        </div>
        <div>
          <div><strong>Joining:</strong> ${ps.employee?.joiningDate}</div>
          <div><strong>Bank:</strong> ${ps.employee?.bankAccountNo}</div>
          <div><strong>Payment Date:</strong> ${ps._paymentDate || '—'}</div>
        </div>
      </div>
      <div class="grid">
        <div><table><thead><tr><th>Earnings</th><th>Amount</th></tr></thead><tbody>${earnRows}
          <tr><th>Total</th><th style="text-align:right">${this.getcurrency()} ${this.grossEarnings.toFixed(2)}</th></tr>
        </tbody></table></div>
        <div><table><thead><tr><th>Deductions</th><th>Amount</th></tr></thead><tbody>${dedRows}
          <tr><th>Total</th><th style="text-align:right">${this.getcurrency()} ${this.totalDeductions.toFixed(2)}</th></tr>
        </tbody></table></div>
      </div>
      <div class="net">Net Payable: ${this.getcurrency()} ${this.netPayable.toFixed(2)}</div>
      <p class="muted" style="margin-top:24px">-- System generated document --</p>
      <script>window.onload=function(){window.print();}</script>
      </body></html>`);
    printWindow.document.close();
  }

  get grossEarnings(): number {
    if (!this.paySlipData?.earnings) return 0;
    return this.paySlipData.earnings.reduce((total: number, item: any) => total + (item.amount || 0), 0);
  }

  get totalDeductions(): number {
    if (!this.paySlipData?.deductions) return 0;
    return this.paySlipData.deductions.reduce((total: number, item: any) => total + (item.amount || 0), 0);
  }

  get totalReimbursements(): number {
    if (!this.paySlipData?.reimbursements) return 0;
    return this.paySlipData.reimbursements.reduce((total: number, item: any) => total + (item.amount || 0), 0);
  }

  get netPayable(): number {
    if (this.paySlipData?._rawNet != null && !Number.isNaN(this.paySlipData._rawNet)) {
      return Number(this.paySlipData._rawNet);
    }
    return this.grossEarnings - this.totalDeductions + this.totalReimbursements;
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  openSettingsModal(): void {
    this.showSettingsModal = true;
  }

  closeSettingsModal(): void {
    this.showSettingsModal = false;
  }

  saveSettings(): void {
    localStorage.setItem('payRunSettings', JSON.stringify(this.settings));
    localStorage.setItem('includeOvertimeInSalary', String(!!this.settings.includeOvertimeInSalary));
    if (this.settings.id) {
      this.api.put('/employee/update_payrun_deduction/' + this.settings.id + '/', this.settings).subscribe((response: any) => {
        if (response.status == 200) {
          this.closeSettingsModal();
        }
      });
    } else {
      this.closeSettingsModal();
    }
  }

  loadSettings(): void {
    const stored = localStorage.getItem('payRunSettings');
    if (stored) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      } catch {}
    }
    this.api.get('/employee/list_payrun_deductions/' + this.api.getCompanyId() + '/').subscribe({
      next: (response: any) => {
        if (response.status == 200 && Array.isArray(response.data) && response.data.length) {
          this.settings = { ...this.settings, ...response.data[0], id: response.data[0].id };
        }
      },
      error: () => {}
    });
  }

  openPayRunDetail(item: any): void {
    this.router.navigate(['/payroll/pay-run-detail', encodeURIComponent(JSON.stringify(item))]);
  }

  applyRevisedSalary(): void {
    this.api.post('/employee/apply_revised_salary/', {}).subscribe((response: any) => {
      if (response.status == 200) {
        console.log('Revised salary applied:', response);
      }
    });
  }

  setFilter(filter: 'all' | 'regular' | 'bulk'): void {
    this.selectedFilter = filter;
  }

  getTotalPendingCount(): number {
    return this.kpiSummary?.total_pending ?? this.pendingRuns.length;
  }

  getRegularPayrollCount(): number {
    return this.kpiSummary?.regular_payroll ?? this.pendingRuns.filter(
      (r: any) => r.type === 'regular'
    ).length;
  }

  getBulkTerminationCount(): number {
    return this.kpiSummary?.bulk_termination ?? this.pendingRuns.filter(
      (r: any) => r.type === 'bulk'
    ).length;
  }

  get hasVisiblePayRuns(): boolean {
    return Array.isArray(this.runPayrollData) && this.runPayrollData.some((r: any) => String(r?.status) !== '7');
  }

  formatMoney(value: any): string {
    return Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
