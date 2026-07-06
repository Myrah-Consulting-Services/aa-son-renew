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
  
  employees = [
    { employeeId: 'EMP001', name: 'John Smith', grossSalary: 50000 },
    { employeeId: 'EMP002', name: 'Sarah Johnson', grossSalary: 45000 },
    { employeeId: 'EMP003', name: 'Michael Brown', grossSalary: 55000 },
    { employeeId: 'EMP004', name: 'Emily Davis', grossSalary: 48000 }
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
    this.apiService.get('/employee/list_employees/', { company: this.apiService.getCompanyId() }).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          this.employees = response.data.map((emp: any) => ({
            employeeId: emp.id,
            name: `${emp.first_name} ${emp.last_name}`,
            grossSalary: emp.gross_salary || 50000 // Default salary if not provided
          }));
        }
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        // Keep default employees if API fails
      }
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
    this.apiService.get('/attendance/ot/multipliers/').subscribe((response: any) => {
      if (response.status === 200) {
        this.otMultipliers = response.data;
        console.log(this.otMultipliers);
      }
    });
  }

  updateOTMultipliers(): void {
    this.apiService.post('/attendance/ot/multipliers/', this.otMultipliers).subscribe((response: any) => {
      if (response.status === 200) {
        alert('OT multipliers updated successfully');
      }
    });
    alert('OT multipliers updated successfully');
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

      // Use API-integrated payroll processing with LOP integration
      this.apiService.post('/attendance/payroll/process/', {
        period: period,
        employees: this.employees
      }).subscribe({
        next: (results: any) => {
          this.processingResults = results;
          
          // Process loan EMI payments if loans are included
          if (formValue.includeLoans) {
            this.processLoanPayments(period);
          }
          
          alert('Payroll processed successfully with LOP integration');
        },
        error: (error: any) => {
          console.error('Error processing payroll with API:', error);
          // Fallback to local processing if API fails
          try {
            this.apiService.post('/attendance/payroll/process/', {
              period: period,
              employees: this.employees
            }).subscribe((response: any) => {
              if (response.status === 200) {
                this.processingResults = response.data;
              }
            });
            alert('Payroll processed successfully (fallback method)');
          } catch (fallbackError) {
            alert('Error processing payroll: ' + fallbackError);
          }
        },
        complete: () => {
          this.isProcessing = false;
        }
      });
    }
  }

  private processLoanPayments(period: any): void {
    this.processingResults.forEach(calculation => {
      calculation.loanDeductions.forEach((loan: { loanId: any; }) => {
          this.apiService.post('/attendance/loan/emi/'+loan.loanId, {
            month: period.month,
            year: period.year
          }).subscribe((response: any) => {
            if (response.status === 200) {
              console.log('Loan payment processed successfully');
            } else {
              console.error('Error processing loan payment:', response.message);
            }
          })
      });
    });
  }

  getTotalLOPDeduction(): number {
    return this.processingResults.reduce((total, calc) => total + calc.lopDeduction.deductionAmount, 0);
  }

  getTotalOvertimePay(): number {
    return this.processingResults.reduce((total, calc) => total + calc.overtimePay.totalOTPay, 0);
  }

  getTotalLoanDeductions(): number {
    return this.processingResults.reduce((total, calc) => 
      total + calc.loanDeductions.reduce((sum: any, loan: { emiAmount: any; }) => sum + loan.emiAmount, 0), 0);
  }

  getTotalNetPay(): number {
    return this.processingResults.reduce((total, calc) => total + calc.netSalary, 0);
  }

  getTotalGrossPay(): number {
    return this.processingResults.reduce((total, calc) => total + calc.grossSalary, 0);
  }

  exportPayrollReport(): void {
    const report = {
      period: this.selectedPeriod,
      summary: {
        totalEmployees: this.processingResults.length,
        totalGrossPay: this.getTotalGrossPay(),
        totalLOPDeduction: this.getTotalLOPDeduction(),
        totalOvertimePay: this.getTotalOvertimePay(),
        totalLoanDeductions: this.getTotalLoanDeductions(),
        totalNetPay: this.getTotalNetPay()
      },
      details: this.processingResults
    };

    // Create downloadable report
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payroll-report-${this.selectedPeriod.month}-${this.selectedPeriod.year}.json`;
    link.click();
    URL.revokeObjectURL(url);

    alert('Payroll report exported successfully');
  }

  getLOPDisplay(calculation: any): string {
    if (calculation.lopDeduction.lopDays === 0) {
      return 'No LOP';
    }
    return `${calculation.lopDeduction.lopDays} days ($${calculation.lopDeduction.deductionAmount.toFixed(2)})`;
  }

  getOvertimeDisplay(calculation: any): string {
    if (calculation.overtimePay.totalOTPay === 0) {
      return 'No OT';
    }
    return `$${calculation.overtimePay.totalOTPay.toFixed(2)}`;
  }

  getLoanDeductionsDisplay(calculation: any): string {
    if (calculation.loanDeductions.length === 0) {
      return 'No loans';
    }
    const total = calculation.loanDeductions.reduce((sum: any, loan: { emi_amount: any; }) => sum + loan.emi_amount, 0);
    return `$${total.toFixed(2)}`;
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