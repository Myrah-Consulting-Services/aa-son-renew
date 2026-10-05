import { Component, HostListener, OnInit } from '@angular/core';
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
  private employeeLoadPromises: Record<string, Promise<any[]>> = {};

  /** employee_id → selected, keyed by run/history key */
  selectedByRun: Record<string, Record<string, boolean>> = {};
  exportingExcel: Record<string, boolean> = {};

  showExportModal = false;
  exportScope: 'all' | 'selected' = 'all';
  exportMonthSearch = '';
  showExportMonthDropdown = false;
  exportMonthActiveIndex = 0;
  selectedExportOption: { key: string; label: string; item: any; mode: 'run' | 'history' } | null = null;

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
    void this.loadEmployeesForPeriod(item, 'run');
  }

  toggleHistoryEmployees(item: any, event?: Event): void {
    event?.stopPropagation();
    const key = this.historyKey(item);
    if (this.expandedHistoryKey === key) {
      this.expandedHistoryKey = null;
      return;
    }
    this.expandedHistoryKey = key;
    void this.loadEmployeesForPeriod(item, 'history');
  }

  private loadEmployeesForPeriod(item: any, mode: 'run' | 'history'): Promise<any[]> {
    const key = mode === 'run' ? this.runKey(item) : this.historyKey(item);
    const cache = mode === 'run' ? this.runEmployees : this.historyEmployees;
    if (cache[key]?.length) return Promise.resolve(cache[key]);
    const pendingLoad = this.employeeLoadPromises[key];
    if (pendingLoad !== undefined) return pendingLoad;

    const runId = item?.payrun_id || item?.payroll_run_id;
    const period = this.periodLabel(item);
    const status = String(item?.status ?? '');
    const isPaidOrApproved = ['6', '7', 'PAID', 'APPROVED'].includes(status);

    this.loadingEmployees[key] = true;
    this.employeeLoadPromises[key] = new Promise((resolve) => {
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
        delete this.employeeLoadPromises[key];
        resolve(demoRows);
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
    });
    return this.employeeLoadPromises[key];
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

  empSelectKey(emp: any): string {
    return String(emp?.employee_id ?? emp?.emp_id ?? emp?.id ?? emp?.employee_name ?? '');
  }

  private selectionKey(item: any, mode: 'run' | 'history'): string {
    return mode === 'run' ? this.runKey(item) : this.historyKey(item);
  }

  isEmployeeSelected(item: any, emp: any, mode: 'run' | 'history'): boolean {
    return !!this.selectedByRun[this.selectionKey(item, mode)]?.[this.empSelectKey(emp)];
  }

  toggleEmployeeSelection(item: any, emp: any, mode: 'run' | 'history', event: Event): void {
    event.stopPropagation();
    const runKey = this.selectionKey(item, mode);
    const empKey = this.empSelectKey(emp);
    if (!this.selectedByRun[runKey]) this.selectedByRun[runKey] = {};
    this.selectedByRun[runKey][empKey] = (event.target as HTMLInputElement).checked;
  }

  selectedCount(item: any, mode: 'run' | 'history'): number {
    const map = this.selectedByRun[this.selectionKey(item, mode)] || {};
    return Object.values(map).filter(Boolean).length;
  }

  isAllEmployeesSelected(item: any, mode: 'run' | 'history'): boolean {
    const employees = this.getEmployees(item, mode);
    if (!employees.length) return false;
    return employees.every((emp) => this.isEmployeeSelected(item, emp, mode));
  }

  toggleSelectAll(item: any, mode: 'run' | 'history', event: Event): void {
    event.stopPropagation();
    const checked = (event.target as HTMLInputElement).checked;
    const runKey = this.selectionKey(item, mode);
    const next: Record<string, boolean> = {};
    this.getEmployees(item, mode).forEach((emp) => {
      next[this.empSelectKey(emp)] = checked;
    });
    this.selectedByRun[runKey] = next;
  }

  isExporting(item: any, mode: 'run' | 'history'): boolean {
    return !!this.exportingExcel[this.selectionKey(item, mode)];
  }

  get exportMonthOptions(): { key: string; label: string; item: any; mode: 'run' | 'history' }[] {
    const runs = (Array.isArray(this.runPayrollData) ? this.runPayrollData : [])
      .filter((r: any) => String(r?.status) !== '7')
      .map((r: any) => ({
        key: `run-${this.runKey(r)}`,
        label: this.periodLabel(r),
        item: r,
        mode: 'run' as const,
      }));
    const history = (this.filteredPayrollHistory || []).map((r: any) => ({
      key: `hist-${this.historyKey(r)}`,
      label: `${r?.details || r?.processing_period || r?.payment_date || 'Pay run'} (History)`,
      item: r,
      mode: 'history' as const,
    }));
    return [...runs, ...history];
  }

  get filteredExportMonthOptions() {
    const q = this.exportMonthSearch.trim().toLowerCase();
    const options = this.exportMonthOptions;
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }

  openExportModal(): void {
    this.showExportModal = true;
    this.exportScope = 'all';
    this.showExportMonthDropdown = false;
    this.exportMonthSearch = '';
    if (!this.selectedExportOption) {
      this.selectedExportOption = this.exportMonthOptions[0] || null;
      if (this.selectedExportOption) {
        this.exportMonthSearch = this.selectedExportOption.label;
      }
    } else {
      this.exportMonthSearch = this.selectedExportOption.label;
    }
  }

  closeExportModal(): void {
    this.showExportModal = false;
    this.showExportMonthDropdown = false;
  }

  openExportMonthDropdown(): void {
    this.showExportMonthDropdown = true;
    this.exportMonthActiveIndex = Math.max(
      0,
      this.filteredExportMonthOptions.findIndex((o) => o.key === this.selectedExportOption?.key)
    );
  }

  onExportMonthSearch(event: Event): void {
    this.exportMonthSearch = (event.target as HTMLInputElement).value;
    this.showExportMonthDropdown = true;
    this.exportMonthActiveIndex = this.filteredExportMonthOptions.length ? 0 : -1;
    this.selectedExportOption = null;
  }

  onExportMonthKeydown(event: KeyboardEvent): void {
    const options = this.filteredExportMonthOptions;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.showExportMonthDropdown = true;
      this.exportMonthActiveIndex = Math.min(this.exportMonthActiveIndex + 1, options.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.exportMonthActiveIndex = Math.max(this.exportMonthActiveIndex - 1, 0);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const opt = options[this.exportMonthActiveIndex];
      if (opt) this.selectExportMonth(opt);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.showExportMonthDropdown = false;
    }
  }

  selectExportMonth(option: { key: string; label: string; item: any; mode: 'run' | 'history' }): void {
    this.selectedExportOption = option;
    this.exportMonthSearch = option.label;
    this.showExportMonthDropdown = false;
    this.exportScope = 'all';
  }

  clearExportMonth(): void {
    this.selectedExportOption = null;
    this.exportMonthSearch = '';
    this.showExportMonthDropdown = true;
    this.exportMonthActiveIndex = 0;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.searchable-select')) {
      this.showExportMonthDropdown = false;
    }
  }

  modalSelectedCount(): number {
    if (!this.selectedExportOption) return 0;
    return this.selectedCount(this.selectedExportOption.item, this.selectedExportOption.mode);
  }

  async confirmExportExcel(): Promise<void> {
    if (!this.selectedExportOption) {
      alert('Select a pay run month first.');
      return;
    }
    await this.downloadPayRunExcel(
      this.selectedExportOption.item,
      this.selectedExportOption.mode,
      this.exportScope
    );
  }

  async downloadPayRunExcel(item: any, mode: 'run' | 'history', scope: 'all' | 'selected'): Promise<void> {
    const key = this.selectionKey(item, mode);
    if (this.exportingExcel[key]) return;
    this.exportingExcel[key] = true;
    try {
      const employees = await this.loadEmployeesForPeriod(item, mode);
      if (!employees.length) {
        alert('No employee payroll data found for this month.');
        return;
      }
      const selectedMap = this.selectedByRun[key] || {};
      const rows =
        scope === 'selected'
          ? employees.filter((emp) => selectedMap[this.empSelectKey(emp)])
          : employees;
      if (!rows.length) {
        alert(scope === 'selected' ? 'Select at least one employee to download.' : 'No employees to export.');
        return;
      }
      this.buildAndDownloadExcel(item, mode, rows);
      this.closeExportModal();
    } finally {
      this.exportingExcel[key] = false;
    }
  }

  private getPayslipForEmployee(item: any, emp: any, mode: 'run' | 'history'): any {
    const key = this.selectionKey(item, mode);
    const payslips = this.payslipByRun[key] || [];
    const matched =
      payslips.find((p: any) => String(p.employee_id) === String(emp.employee_id)) ||
      payslips.find((p: any) => String(p?.payslip?.employee_summary?.employee_id) === String(emp.emp_id));
    return matched?.payslip || emp.payslip || this.buildFallbackPayslip(emp, this.periodLabel(item), item);
  }

  private slipItems(group: any): { component: string; amount: number }[] {
    return (group?.items || []).map((i: any) => ({
      component: String(i.component || i.name || i.head_name || 'Item'),
      amount: Number(i.amount ?? i.value ?? 0),
    }));
  }

  private buildAndDownloadExcel(item: any, mode: 'run' | 'history', employees: any[]): void {
    const period = this.periodLabel(item);
    const paymentDate = item?.payment_date || item?.pay_date_formatted || item?.pay_date || '';
    const currency = this.getcurrency() || 'AED';
    const detailed = employees.map((emp) => {
      const slip = this.getPayslipForEmployee(item, emp, mode);
      const earnings = this.slipItems(slip?.earnings);
      const deductions = this.slipItems(slip?.deductions);
      const reimbursements = this.slipItems(slip?.reimbursements);
      if (!earnings.length) {
        earnings.push({ component: 'Gross Pay', amount: Number(emp.gross_pay || 0) });
        if (emp.overtime_pay || emp.overtime) {
          earnings.push({ component: 'Overtime', amount: Number(emp.overtime_pay || emp.overtime || 0) });
        }
      }
      if (!deductions.length && Number(emp.deductions || 0)) {
        deductions.push({ component: 'Deductions', amount: Number(emp.deductions || 0) });
      }
      return { emp, slip, earnings, deductions, reimbursements };
    });

    const earningCols = Array.from(new Set(detailed.flatMap((d) => d.earnings.map((e) => e.component))));
    const deductionCols = Array.from(new Set(detailed.flatMap((d) => d.deductions.map((e) => e.component))));
    const reimburseCols = Array.from(new Set(detailed.flatMap((d) => d.reimbursements.map((e) => e.component))));

    const header = [
      'Employee Name',
      'Employee ID',
      'Designation',
      'Department',
      'Joining Date',
      'Paid Days',
      'LOP Days',
      ...earningCols.map((c) => `Earning: ${c}`),
      'Gross Pay',
      'Overtime',
      ...deductionCols.map((c) => `Deduction: ${c}`),
      'Total Deductions',
      ...reimburseCols.map((c) => `Reimbursement: ${c}`),
      'Benefits',
      'Net Pay',
      'Payment Mode',
      'Status',
      'Payment Date',
      'Pay Period',
    ];

    const amountOf = (items: { component: string; amount: number }[], name: string) =>
      items.filter((i) => i.component === name).reduce((s, i) => s + i.amount, 0);

    const registerRows = detailed.map(({ emp, slip, earnings, deductions, reimbursements }) => {
      const summary = slip?.employee_summary || {};
      const paySummary = slip?.pay_summary || {};
      const gross = Number(slip?.earnings?.gross_earnings ?? emp.gross_pay ?? 0);
      const ot = Number(emp.overtime_pay ?? emp.overtime ?? 0);
      const totalDed = Number(slip?.deductions?.total_deductions ?? emp.deductions ?? 0);
      const net = Number(slip?.net_pay?.net_pay ?? emp.net_pay ?? 0);
      return [
        { t: 's', v: summary.employee_name || emp.employee_name || '' },
        { t: 's', v: summary.employee_id || emp.emp_id || '' },
        { t: 's', v: summary.designation || emp.designation || '' },
        { t: 's', v: emp.department || emp.department_name || '' },
        { t: 's', v: summary.date_of_joining || emp.joining_date || '' },
        { t: 'n', v: paySummary.paid_days ?? emp.paid_days ?? 0 },
        { t: 'n', v: paySummary.lop_days ?? emp.lop_days ?? 0 },
        ...earningCols.map((c) => ({ t: 'n', v: amountOf(earnings, c) })),
        { t: 'n', v: gross },
        { t: 'n', v: ot },
        ...deductionCols.map((c) => ({ t: 'n', v: amountOf(deductions, c) })),
        { t: 'n', v: totalDed },
        ...reimburseCols.map((c) => ({ t: 'n', v: amountOf(reimbursements, c) })),
        { t: 'n', v: Number(emp.benefits || 0) },
        { t: 'n', v: net },
        { t: 's', v: emp.payment_mode || '' },
        { t: 's', v: emp.payment_status || emp.status || '' },
        { t: 's', v: paymentDate },
        { t: 's', v: period },
      ];
    });

    const lineHeader = [
      'Employee Name',
      'Employee ID',
      'Type',
      'Component',
      'Amount',
      'Pay Period',
    ];
    const lineRows: { t: string; v: any }[][] = [];
    detailed.forEach(({ emp, earnings, deductions, reimbursements }) => {
      const pushLines = (type: string, items: { component: string; amount: number }[]) => {
        items.forEach((i) => {
          lineRows.push([
            { t: 's', v: emp.employee_name || '' },
            { t: 's', v: emp.emp_id || '' },
            { t: 's', v: type },
            { t: 's', v: i.component },
            { t: 'n', v: i.amount },
            { t: 's', v: period },
          ]);
        });
      };
      pushLines('Earning', earnings);
      pushLines('Deduction', deductions);
      pushLines('Reimbursement', reimbursements);
    });

    const xml = this.buildSpreadsheetXml(
      period,
      currency,
      employees.length,
      header,
      registerRows,
      lineHeader,
      lineRows
    );
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safePeriod = String(period).replace(/[^\w\-]+/g, '_');
    a.download = `Pay_Run_${safePeriod}_${employees.length}_employees.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private xmlEscape(value: any): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private excelCell(cell: { t: string; v: any }): string {
    if (cell.t === 'n') {
      const n = Number(cell.v || 0);
      return `<Cell ss:StyleID="Money"><Data ss:Type="Number">${Number.isFinite(n) ? n : 0}</Data></Cell>`;
    }
    return `<Cell><Data ss:Type="String">${this.xmlEscape(cell.v)}</Data></Cell>`;
  }

  private excelRow(cells: { t: string; v: any }[]): string {
    return `<Row>${cells.map((c) => this.excelCell(c)).join('')}</Row>`;
  }

  private excelHeaderRow(headers: string[]): string {
    return `<Row>${headers
      .map((h) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${this.xmlEscape(h)}</Data></Cell>`)
      .join('')}</Row>`;
  }

  private buildSpreadsheetXml(
    period: string,
    currency: string,
    empCount: number,
    registerHeader: string[],
    registerRows: { t: string; v: any }[][],
    lineHeader: string[],
    lineRows: { t: string; v: any }[][]
  ): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#41299B" ss:Pattern="Solid"/>
      <Alignment ss:WrapText="1" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="Money">
      <NumberFormat ss:Format="#,##0.00"/>
    </Style>
    <Style ss:ID="Title">
      <Font ss:Bold="1" ss:Size="14" ss:Color="#41299B"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Pay Register">
    <Table>
      <Row><Cell ss:StyleID="Title" ss:MergeAcross="6"><Data ss:Type="String">Pay Run — ${this.xmlEscape(period)}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Currency: ${this.xmlEscape(currency)}  |  Employees: ${empCount}  |  Generated: ${this.xmlEscape(new Date().toLocaleString())}</Data></Cell></Row>
      <Row></Row>
      ${this.excelHeaderRow(registerHeader)}
      ${registerRows.map((r) => this.excelRow(r)).join('\n')}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Line Details">
    <Table>
      <Row><Cell ss:StyleID="Title" ss:MergeAcross="4"><Data ss:Type="String">Earnings, deductions &amp; reimbursements — ${this.xmlEscape(period)}</Data></Cell></Row>
      <Row></Row>
      ${this.excelHeaderRow(lineHeader)}
      ${lineRows.map((r) => this.excelRow(r)).join('\n')}
    </Table>
  </Worksheet>
</Workbook>`;
  }
}
