import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Api } from '../../core/services/api';
@Component({
  selector: 'app-payroll-processing',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './payroll-processing.html',
  styleUrls: ['./payroll-processing.scss']
})
export class PayrollProcessingComponent implements OnInit {
  activeTab: 'processing' | 'configuration' | 'reports' = 'processing';
  payrollForm: FormGroup;
  processingResults: any[] = [];
  isProcessing = false;
  currentDate = new Date();
  
  employees: Array<{ employeeId: string; name: string; grossSalary: number; overtimeHours?: number }> = [
    { employeeId: 'NRC001', name: 'Omar Al Hashimi', grossSalary: 24000, overtimeHours: 0 },
    { employeeId: 'NRC002', name: 'Hassan Mansour', grossSalary: 12000, overtimeHours: 0 },
    { employeeId: 'NRC003', name: 'Priya Nair', grossSalary: 14000, overtimeHours: 0 },
    { employeeId: 'NRC004', name: 'Mohammed Yousef', grossSalary: 6000, overtimeHours: 0 }
  ];

  selectedPeriod: any = {
    startDate: '',
    endDate: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    daysInMonth: 30
  };

  otMultipliers = {
    regular: 1.25,
    holiday: 1.5,
    weekend: 1.5
  };

  displayedColumns: string[] = [
    'employeeName',
    'grossSalary',
    'lopDeduction',
    'overtimePay',
    'loanDeductions',
    'netSalary',
    'actions'
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: Api
  ) {
    this.payrollForm = this.fb.group({
      month: [new Date().getMonth() + 1, Validators.required],
      year: [new Date().getFullYear(), Validators.required],
      includeLOP: [true],
      includeOvertime: [true],
      includeLoans: [true]
    });
  }

  getcurrency() {
    return this.apiService.getcurrencies();
  }

  ngOnInit(): void {
    this.initializePeriod();
    this.loadOTMultipliers();
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.apiService.post('/employee/list_employees/', {
      company: this.apiService.getCompanyId(),
      page: 1,
      page_size: 200
    }).subscribe({
      next: (response: any) => {
        if (response.status === 200 && Array.isArray(response.data) && response.data.length) {
          this.employees = response.data.map((emp: any) => ({
            employeeId: emp.id || emp.emp_id,
            name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.employee_name,
            grossSalary: Number(emp.gross_salary || emp.net_salary || emp.basic_salary || 0) || 0,
            overtimeHours: Number(emp.overtime_hours || emp.ot_hours || 0)
          }));
        }
      },
      error: () => {}
    });
  }

  setActiveTab(tab: string): void {
    if (tab === 'processing' || tab === 'configuration' || tab === 'reports') {
      this.activeTab = tab as 'processing' | 'configuration' | 'reports';
    }
  }

  initializePeriod(): void {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    
    this.selectedPeriod = {
      startDate: `${year}-${month.toString().padStart(2, '0')}-01`,
      endDate: `${year}-${month.toString().padStart(2, '0')}-${daysInMonth}`,
      month,
      year,
      daysInMonth
    };
  }

  loadOTMultipliers(): void {
    const stored = localStorage.getItem('includeOvertimeInSalary');
    if (stored === 'false') {
      this.payrollForm.patchValue({ includeOvertime: false });
    }
    this.apiService.get('/attendance/ot/multipliers/', { company: this.apiService.getCompanyId() }).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          this.otMultipliers = {
            regular: Number(response.data.regular ?? response.data.regular_multiplier ?? 1.25),
            holiday: Number(response.data.holiday ?? response.data.holiday_multiplier ?? 1.5),
            weekend: Number(response.data.weekend ?? response.data.weekend_multiplier ?? 1.5)
          };
        }
      },
      error: () => {
        this.apiService.post('/attendance/list-payroll-settings/', { company: this.apiService.getCompanyId() }).subscribe((res: any) => {
          const s = res?.data?.[0];
          if (s) {
            this.otMultipliers = {
              regular: Number(s.regular_multiplier ?? 1.25),
              holiday: Number(s.holiday_multiplier ?? 1.5),
              weekend: Number(s.weekend_multiplier ?? 1.5)
            };
            if (s.include_overtime_in_salary === false) {
              this.payrollForm.patchValue({ includeOvertime: false });
            }
          }
        });
      }
    });
  }

  updateOTMultipliers(): void {
    const payload = {
      ...this.otMultipliers,
      company: this.apiService.getCompanyId(),
      include_overtime_in_salary: !!this.payrollForm.value.includeOvertime
    };
    this.apiService.post('/attendance/ot/multipliers/', payload).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          alert('OT multipliers updated successfully');
        }
      },
      error: () => alert('OT multipliers saved locally')
    });
    localStorage.setItem('includeOvertimeInSalary', String(!!this.payrollForm.value.includeOvertime));
  }

  processPayroll(): void {
    if (this.payrollForm.valid) {
      this.isProcessing = true;
      
      const formValue = this.payrollForm.value;
      const period: any = {
        startDate: this.selectedPeriod.startDate,
        endDate: this.selectedPeriod.endDate,
        month: formValue.month,
        year: formValue.year,
        daysInMonth: this.selectedPeriod.daysInMonth
      };

      const payload = {
        period,
        employees: this.employees,
        company: this.apiService.getCompanyId(),
        include_lop: !!formValue.includeLOP,
        include_overtime: !!formValue.includeOvertime,
        include_loans: !!formValue.includeLoans,
        add_overtime_to_salary: !!formValue.includeOvertime,
        ot_multipliers: this.otMultipliers
      };

      this.apiService.post('/attendance/payroll/process/', payload).subscribe({
        next: (results: any) => {
          const rows = this.normalizeProcessResults(results);
          if (rows.length) {
            this.processingResults = this.ensureOvertimeInSalary(rows, formValue.includeOvertime);
          } else {
            this.processingResults = this.calculateLocalPayroll(formValue);
          }
          if (formValue.includeLoans) {
            this.processLoanPayments(period);
          }
          this.isProcessing = false;
        },
        error: () => {
          this.processingResults = this.calculateLocalPayroll(formValue);
          this.isProcessing = false;
        }
      });
    }
  }

  private normalizeProcessResults(results: any): any[] {
    if (Array.isArray(results)) return results;
    if (Array.isArray(results?.data)) return results.data;
    if (Array.isArray(results?.results)) return results.results;
    return [];
  }

  private ensureOvertimeInSalary(rows: any[], includeOt: boolean): any[] {
    if (!includeOt) return rows;
    return rows.map((calc: any) => {
      const otPay = Number(calc?.overtimePay?.totalOTPay ?? calc?.overtime_pay ?? 0);
      const net = Number(calc.netSalary ?? calc.net_pay ?? 0);
      const alreadyInNet = calc.overtime_included === true || calc.overtime_added === true;
      if (!otPay || alreadyInNet) {
        return {
          ...calc,
          employeeName: calc.employeeName || calc.employee_name,
          grossSalary: Number(calc.grossSalary ?? calc.gross_pay ?? 0),
          netSalary: net,
          lopDeduction: calc.lopDeduction || { lopDays: 0, deductionAmount: 0 },
          overtimePay: calc.overtimePay || { totalOTPay: otPay },
          loanDeductions: calc.loanDeductions || []
        };
      }
      return {
        ...calc,
        employeeName: calc.employeeName || calc.employee_name,
        grossSalary: Number(calc.grossSalary ?? calc.gross_pay ?? 0) + otPay,
        netSalary: net + otPay,
        overtime_added: true,
        lopDeduction: calc.lopDeduction || { lopDays: 0, deductionAmount: 0 },
        overtimePay: calc.overtimePay || { totalOTPay: otPay },
        loanDeductions: calc.loanDeductions || []
      };
    });
  }

  private calculateLocalPayroll(formValue: any): any[] {
    const days = this.selectedPeriod.daysInMonth || 30;
    const hoursPerDay = 8;
    return this.employees.map((emp) => {
      const gross = Number(emp.grossSalary || 0);
      const hourly = days * hoursPerDay > 0 ? gross / (days * hoursPerDay) : 0;
      const otHours = Number(emp.overtimeHours || 0);
      const otPay = formValue.includeOvertime ? otHours * hourly * Number(this.otMultipliers.regular || 1.25) : 0;
      const lopDays = 0;
      const lopAmount = formValue.includeLOP ? (gross / days) * lopDays : 0;
      const loans: any[] = [];
      const net = gross - lopAmount + otPay;
      return {
        employeeName: emp.name,
        employeeId: emp.employeeId,
        grossSalary: gross + otPay,
        netSalary: net,
        overtime_added: otPay > 0,
        lopDeduction: { lopDays, deductionAmount: lopAmount },
        overtimePay: { totalOTPay: otPay, hours: otHours },
        loanDeductions: loans
      };
    });
  }

  private processLoanPayments(period: any): void {
    this.processingResults.forEach(calculation => {
      (calculation.loanDeductions || []).forEach((loan: { loanId: any; }) => {
          if (!loan?.loanId) return;
          this.apiService.post('/attendance/loan/emi/'+loan.loanId, {
            month: period.month,
            year: period.year
          }).subscribe((response: any) => {
            if (response.status === 200) {
              console.log('Loan payment processed successfully');
            }
          })
      });
    });
  }

  getTotalLOPDeduction(): number {
    return this.processingResults.reduce((total, calc) => total + Number(calc?.lopDeduction?.deductionAmount || 0), 0);
  }

  getTotalOvertimePay(): number {
    return this.processingResults.reduce((total, calc) => total + Number(calc?.overtimePay?.totalOTPay || calc?.overtime_pay || 0), 0);
  }

  getTotalLoanDeductions(): number {
    return this.processingResults.reduce((total, calc) =>
      total + (calc.loanDeductions || []).reduce((sum: number, loan: any) => sum + Number(loan.emiAmount || loan.emi_amount || 0), 0), 0);
  }

  getTotalNetPay(): number {
    return this.processingResults.reduce((total, calc) => total + Number(calc.netSalary || 0), 0);
  }

  getTotalGrossPay(): number {
    return this.processingResults.reduce((total, calc) => total + Number(calc.grossSalary || 0), 0);
  }

  exportPayrollReport(): void {
    this.downloadCsvReport('comprehensive');
  }

  generateLopReport(): void {
    this.downloadCsvReport('lop');
  }

  generateOtReport(): void {
    this.downloadCsvReport('overtime');
  }

  generateLoanReport(): void {
    this.downloadCsvReport('loan');
  }

  private downloadCsvReport(kind: 'comprehensive' | 'lop' | 'overtime' | 'loan'): void {
    if (!this.processingResults.length) {
      alert('Process payroll first to generate this report.');
      return;
    }
    const currency = this.getcurrency() || 'AED';
    let headers: string[] = [];
    let rows: any[][] = [];
    if (kind === 'lop') {
      headers = ['Employee', 'LOP Days', 'LOP Amount'];
      rows = this.processingResults.map(c => [c.employeeName, c.lopDeduction?.lopDays || 0, Number(c.lopDeduction?.deductionAmount || 0).toFixed(2)]);
    } else if (kind === 'overtime') {
      headers = ['Employee', 'OT Hours', 'OT Pay'];
      rows = this.processingResults.map(c => [c.employeeName, c.overtimePay?.hours || 0, Number(c.overtimePay?.totalOTPay || 0).toFixed(2)]);
    } else if (kind === 'loan') {
      headers = ['Employee', 'Loan Deductions'];
      rows = this.processingResults.map(c => {
        const total = (c.loanDeductions || []).reduce((s: number, l: any) => s + Number(l.emiAmount || l.emi_amount || 0), 0);
        return [c.employeeName, total.toFixed(2)];
      });
    } else {
      headers = ['Employee', 'Gross Salary', 'LOP', 'Overtime', 'Loans', 'Net Salary'];
      rows = this.processingResults.map(c => [
        c.employeeName,
        Number(c.grossSalary || 0).toFixed(2),
        Number(c.lopDeduction?.deductionAmount || 0).toFixed(2),
        Number(c.overtimePay?.totalOTPay || 0).toFixed(2),
        (c.loanDeductions || []).reduce((s: number, l: any) => s + Number(l.emiAmount || l.emi_amount || 0), 0).toFixed(2),
        Number(c.netSalary || 0).toFixed(2)
      ]);
    }
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payroll-${kind}-report-${this.selectedPeriod.month}-${this.selectedPeriod.year}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  getLOPDisplay(calculation: any): string {
    if (!calculation?.lopDeduction?.lopDays) {
      return 'No LOP';
    }
    return `${calculation.lopDeduction.lopDays} days (${this.getcurrency()} ${Number(calculation.lopDeduction.deductionAmount || 0).toFixed(2)})`;
  }

  getOvertimeDisplay(calculation: any): string {
    const ot = Number(calculation?.overtimePay?.totalOTPay || 0);
    if (!ot) {
      return 'No OT';
    }
    return `${this.getcurrency()} ${ot.toFixed(2)}`;
  }

  getLoanDeductionsDisplay(calculation: any): string {
    const list = calculation.loanDeductions || [];
    if (!list.length) {
      return 'No loans';
    }
    const total = list.reduce((sum: number, loan: any) => sum + Number(loan.emi_amount || loan.emiAmount || 0), 0);
    return `${this.getcurrency()} ${total.toFixed(2)}`;
  }

  onPeriodChange(): void {
    const month = this.payrollForm.get('month')?.value;
    const year = this.payrollForm.get('year')?.value;
    
    if (month && year) {
      const daysInMonth = new Date(year, month, 0).getDate();
      this.selectedPeriod = {
        startDate: `${year}-${month.toString().padStart(2, '0')}-01`,
        endDate: `${year}-${month.toString().padStart(2, '0')}-${daysInMonth}`,
        month,
        year,
        daysInMonth
      };
    }
  }
} 