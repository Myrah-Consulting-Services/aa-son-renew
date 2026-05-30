import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-final-settlement',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './final-settlement.component.html',
  styleUrls: ['./final-settlement.component.scss'],
  providers: [DatePipe]
})
export class FinalSettlementComponent implements OnInit {
  
  // Forms
  settlementForm!: FormGroup;
  employeeForm!: FormGroup;
  
  // Data
  employees: any[] = [];
  selectedEmployee: any = null;
  settlementCalculations: any[] = [];
  
  // UI States
  isCalculating: boolean = false;
  showResults: boolean = false;
  isProcessing: boolean = false;
  Math = Math;
  
  // Settlement Settings
  settlementSettings = {
    noticePeriodDays: 30, // Default notice period
    leaveEncashmentEnabled: true,
    airfareAllowanceEnabled: true,
    loanDeductionEnabled: true,
    uaeLawCompliant: true
  };

  // Notice Period Options
  noticePeriodOptions = [
    { value: 0, label: 'No Notice Period' },
    { value: 7, label: '7 Days' },
    { value: 14, label: '14 Days' },
    { value: 30, label: '30 Days' },
    { value: 60, label: '60 Days' },
    { value: 90, label: '90 Days' }
  ];

  // Reason for Leaving Options
  reasonOptions = [
    { id: 1, value: 'resignation', label: 'Resignation' },
    { id: 2, value: 'termination', label: 'Termination' },
    { id: 3, value: 'retirement', label: 'Retirement' },
    { id: 4, value: 'contract_end', label: 'Contract End' },
    { id: 5, value: 'redundancy', label: 'Redundancy' },
    { id: 6, value: 'other', label: 'Other' }
  ];

  constructor(
    private fb: FormBuilder,
    private api: Api,
    private datePipe: DatePipe,
    private toast: ToastService
  ) {
    this.initializeForms();
  }

  getcurrency() {
    return this.api.getcurrencies();
  }

  ngOnInit(): void {
    this.loadEmployees();
    // this.loadSettlementSettings();
    this.calculateNoticePeriodPay();
  }

  private initializeForms(): void {
    // Employee selection form
    this.employeeForm = this.fb.group({
      employeeId: ['', Validators.required],
      calculation_date: [new Date().toISOString().split('T')[0], Validators.required]
    });

    // Final settlement form
    this.settlementForm = this.fb.group({
      // Employee Details
      basic_salary: [0, [Validators.required, Validators.min(0)]],
      gross_salary: [0, [Validators.required, Validators.min(0)]],
      joining_date: ['', Validators.required],
      last_working_date: ['', Validators.required],
      reason_for_leaving: ['', Validators.required],
      
      // Notice Period
      notice_period_days: [30, [Validators.min(0)]],
      notice_period_served: [0, [Validators.min(0)]],
      notice_period_pay: [0, [Validators.min(0)]],
      
      // Leave Encashment
      pending_leave_days: [0, [Validators.min(0)]],
      leave_encashment_amount: [0, [Validators.min(0)]],
      
      // Allowances
      airfare_allowance: [0, [Validators.min(0)]],
      other_allowances: [0, [Validators.min(0)]],
      
      // Deductions
      outstanding_loans: [0, [Validators.min(0)]],
      other_deductions: [0, [Validators.min(0)]],
      unpaid_leave_days: [0, [Validators.min(0)]],
      
      // Final Calculations
      gratuity_amount: [0, [Validators.min(0)]],
      total_earnings: [0, [Validators.min(0)]],
      total_deductions: [0, [Validators.min(0)]],
      net_settlement_amount: [0, [Validators.min(0)]],
      
      // Authorization
      authorized_by: ['', Validators.required],
      authorization_date: [new Date().toISOString().split('T')[0], Validators.required],
      remarks: ['']
    });
  }

  loadEmployees(): void {
    // Load active employees from API
    this.api.post('/employee/list_employees/',{company:this.api.getCompanyId(),
      pagination:false
       }).subscribe((response: any) => {
      if (response.status == 200) {
        this.employees = response.data;
      }
    });
  }


  // loadSettlementSettings(): void {
  //   // Load settlement settings from API
  //   this.api.get('/payroll/settlement-settings/', { 
  //     company_id: this.api.getCompanyId() 
  //   }).subscribe({
  //     next: (response: any) => {
  //       if (response.status === 200) {
  //         this.settlementSettings = { ...this.settlementSettings, ...response.data };
  //       }
  //     },
  //     error: (error) => {
  //       console.log('Using default settlement settings');
  //     }
  //   });
  // }

  onEmployeeSelect(): void {
    const employeeId = this.employeeForm.get('employeeId')?.value;
    this.selectedEmployee = this.employees.find(emp => emp.id == employeeId);
    
    if (this.selectedEmployee) {
      // {{baseUrl}}/employee/get_employee_salary_component_by_employee/1/
      this.api.get(`/employee/get_employee/${employeeId}`).subscribe((response: any) => {
        if (response.status === 200) {
          this.settlementForm.patchValue({
            basic_salary: response.data.salary_components[0].netMonthlySalary,
            gross_salary: response.data.salary_components[0].grossMonthlyEarnings,
            joining_date: response.data.joining_date,
            last_working_date: response.data.last_working_date,
            reason_for_leaving: response.data.reason_for_leaving_reason
          });
        }
      });
    
      
      // Fetch employee-specific data
      this.fetchEmployeeSettlementData(employeeId);
    }
  }

  fetchEmployeeSettlementData(employeeId: number): void {
    // Fetch pending leave data
    this.fetchPendingLeaveData(employeeId);
    
    // Fetch outstanding loans
    this.fetchOutstandingLoans(employeeId);
    
    // Fetch unpaid leave data
    this.fetchUnpaidLeaveData(employeeId);
  }

  fetchPendingLeaveData(employeeId: number): void {
    const params = {
      employee_id: employeeId,
      company_id: this.api.getCompanyId(),
      status: 'approved',
      encashable: true
    };

    this.api.get('/attendance/pending-leave-data/', params).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          const pendingDays = response.data.reduce((total: number, leave: any) => {
            return total + (leave.total_days || 0);
          }, 0);
          
          this.settlementForm.patchValue({
            pending_leave_days: pendingDays
          });
          
          // Calculate leave encashment
          this.calculateLeaveEncashment();
        }
      },
      error: (error) => {
        console.log('Using default pending leave data');
      }
    });
  }

  fetchOutstandingLoans(employeeId: number): void {
    const params = {
      employee_id: employeeId,
      company_id: this.api.getCompanyId(),
      status: 'active'
    };

    this.api.get('/payroll/outstanding-loans/', params).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          const outstandingAmount = response.data.reduce((total: number, loan: any) => {
            return total + (loan.outstanding_amount || 0);
          }, 0);
          
          this.settlementForm.patchValue({
            outstanding_loans: outstandingAmount
          });
        }
      },
      error: (error) => {
        console.log('Using default loan data');
      }
    });
  }

  fetchUnpaidLeaveData(employeeId: number): void {
    const params = {
      employee_id: employeeId,
      company_id: this.api.getCompanyId(),
      leave_type: 'unpaid',
      status: 'approved'
    };

    this.api.get('/leave/unpaid-leave-data/', params).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          const unpaidDays = response.data.reduce((total: number, leave: any) => {
            return total + (leave.total_days || 0);
          }, 0);
          
          this.settlementForm.patchValue({
            unpaid_leave_days: unpaidDays
          });
        }
      },
      error: (error) => {
        console.log('Using default unpaid leave data');
      }
    });
  }

  calculateLeaveEncashment(): void {
    const pendingDays = this.settlementForm.get('pending_leave_days')?.value || 0;
    const basic_salary = this.settlementForm.get('basic_salary')?.value || 0;
    
    if (pendingDays > 0 && basic_salary > 0) {
      const encashmentAmount = (basic_salary / 30) * pendingDays;
      this.settlementForm.patchValue({
        leave_encashment_amount: encashmentAmount
      });
    }
  }

  calculateNoticePeriodPay(): void {
    const noticePeriodDays = this.settlementForm.get('notice_period_days')?.value || 0;
    const noticePeriodServed = this.settlementForm.get('notice_period_served')?.value || 0;
    const gross_salary = this.settlementForm.get('gross_salary')?.value || 0;
    
    if (noticePeriodDays > 0 && gross_salary > 0) {
      const unservedDays = Math.max(0, noticePeriodDays - noticePeriodServed);
      const noticePay = (gross_salary / 30) * unservedDays;
      
      this.settlementForm.patchValue({
        notice_period_pay: noticePay
      });
    }
  }

  calculateFinalSettlement(): void {
    if (this.settlementForm.invalid || !this.selectedEmployee) {
      alert('Please fill all required fields and select an employee.');
      return;
    }

    this.isCalculating = true;
    
    // Calculate gratuity first
    const gratuityCalculation = this.calculateGratuity();
    
    // Calculate total earnings
    const total_earnings = this.calculatetotal_earnings();
    
    // Calculate total deductions
    const total_deductions = this.calculatetotal_deductions();
    
    // Calculate net settlement
    const net_settlement_amount = total_earnings - total_deductions;
    
    // Update form with calculated values
    this.settlementForm.patchValue({
      gratuity_amount: gratuityCalculation.gratuityAmount,
      total_earnings: total_earnings,
      total_deductions: total_deductions,
      net_settlement_amount: net_settlement_amount
    });
    
    this.settlementCalculations = [{
      employee: this.selectedEmployee,
      gratuityCalculation: gratuityCalculation,
      totalEarnings: total_earnings,
      totalDeductions: total_deductions,
      netSettlement: net_settlement_amount,
      calculation_date: new Date().toISOString()
    }];
    
    this.showResults = true;
    this.isCalculating = false;
  }

  private calculateGratuity(): any {
    const joining_date = new Date(this.settlementForm.get('joining_date')?.value);
    const last_working_date = new Date(this.settlementForm.get('last_working_date')?.value);
    const basic_salary = this.settlementForm.get('basic_salary')?.value;
    const unpaidLeaveDays = this.settlementForm.get('unpaid_leave_days')?.value || 0;
    
    // Calculate service years
    let serviceYears = this.calculateServiceYears(joining_date, last_working_date);
    
    // Deduct unpaid leave days
    const unpaidLeaveYears = unpaidLeaveDays / 365.25;
    const adjustedServiceYears = serviceYears - unpaidLeaveYears;
    
    // Check eligibility
    if (adjustedServiceYears < 1) {
      return {
        eligible: false,
        gratuityAmount: 0,
        reason: 'Minimum 1 year service required under UAE Labour Law'
      };
    }

    // Calculate gratuity according to UAE Law
    let gratuityAmount = 0;
    const fullYears = Math.floor(adjustedServiceYears);
    const finalYearFraction = adjustedServiceYears - fullYears;

    if (fullYears <= 5) {
      // First 5 years: 21 days per year
      const fullYearsAmount = (basic_salary / 30) * 21 * fullYears;
      const finalYearAmount = (basic_salary / 30) * 21 * finalYearFraction;
      gratuityAmount = fullYearsAmount + finalYearAmount;
    } else {
      // Beyond 5 years: 21 days for first 5 + 30 days for additional
      const firstFiveYears = (basic_salary / 30) * 21 * 5;
      const additionalYears = Math.max(fullYears - 5, 0);
      const additionalAmount = (basic_salary / 30) * 30 * additionalYears;
      const finalYearAmount = (basic_salary / 30) * 30 * finalYearFraction;
      gratuityAmount = firstFiveYears + additionalAmount + finalYearAmount;
    }

    return {
      eligible: true,
      gratuityAmount: gratuityAmount,
      serviceYears: serviceYears,
      adjustedServiceYears: adjustedServiceYears,
      unpaidLeaveDays: unpaidLeaveDays
    };
  }

  private calculatetotal_earnings(): number {
    const gratuity_amount = this.settlementForm.get('gratuity_amount')?.value || 0;
    const noticePeriodPay = this.settlementForm.get('notice_period_pay')?.value || 0;
    const leaveEncashmentAmount = this.settlementForm.get('leave_encashment_amount')?.value || 0;
    const airfareAllowance = this.settlementForm.get('airfare_allowance')?.value || 0;
    const otherAllowances = this.settlementForm.get('other_allowances')?.value || 0;
    
    return gratuity_amount + noticePeriodPay + leaveEncashmentAmount + airfareAllowance + otherAllowances;
  }

  private calculatetotal_deductions(): number {
    const outstandingLoans = this.settlementForm.get('outstanding_loans')?.value || 0;
    const otherDeductions = this.settlementForm.get('other_deductions')?.value || 0;
    
    return outstandingLoans + otherDeductions;
  }

  private calculateServiceYears(joining_date: Date, last_working_date: Date): number {
    const timeDiff = last_working_date.getTime() - joining_date.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    return daysDiff / 365.25;
  }

  processFinalSettlement(): void {
    if (this.settlementForm.invalid) {
      alert('Please fill all required fields.');
      return;
    }

    this.isProcessing = true;
    
    const settlementData = {
      company_id: this.api.getCompanyId(),
      employee_id: this.employeeForm.get('employeeId')?.value,
      calculation_date: this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '',
      service_years: this.calculateServiceYears(new Date(this.settlementForm.get('joining_date')?.value), new Date(this.settlementForm.get('last_working_date')?.value)).toFixed(2),
      ...this.settlementForm.value
    };
    this.api.post('/attendance/create-employee-settlement/', settlementData).subscribe({
      next: (response: any) => {
        if (response.status == 200) {
          this.toast.show('Success', 'Final settlement processed successfully!', 'success');
          this.resetForms();
        } else {
          this.toast.show('Error', 'Error processing final settlement.', 'danger');
        }
      }
    });
    console.log(settlementData);
  }

  exportSettlementReport(): void {
    if (this.settlementCalculations.length === 0) {
      alert('No settlement calculation to export.');
      return;
    }

    const calculation = this.settlementCalculations[0];
    const csvContent = this.generateCSV(calculation);
    this.downloadCSV(csvContent, `final_settlement_${calculation.employee.first_name} ${calculation.employee.last_name}_${new Date().toISOString().split('T')[0]}.csv`);
  }

  private generateCSV(calculation: any): string {
    const headers = [
      'Employee Name',
      'Employee ID',
      'Joining Date',
      'Last Working Date',
      'Service Years',
      'Gratuity Amount',
      'Notice Period Pay',
      'Leave Encashment',
      'Airfare Allowance',
      'Other Allowances',
      'Total Earnings',
      'Outstanding Loans',
      'Other Deductions',
      'Total Deductions',
      'Net Settlement',
      'Reason for Leaving',
      'Authorized By',
      'Calculation Date'
    ];

    const values = [
      calculation.employee.first_name + ' ' + calculation.employee.last_name,
      calculation.employee.id,
      calculation.gratuityCalculation.serviceYears.toFixed(2),
      this.settlementForm.get('last_working_date')?.value,
      calculation.gratuityCalculation.serviceYears.toFixed(2),
      calculation.gratuityCalculation.gratuityAmount.toFixed(2),
      this.settlementForm.get('notice_period_pay')?.value.toFixed(2),
      this.settlementForm.get('leave_encashment_amount')?.value.toFixed(2),
      this.settlementForm.get('airfare_allowance')?.value.toFixed(2),
      this.settlementForm.get('other_allowances')?.value.toFixed(2),
      calculation.totalEarnings.toFixed(2),
      this.settlementForm.get('outstanding_loans')?.value.toFixed(2),
      this.settlementForm.get('other_deductions')?.value.toFixed(2),
      calculation.totalDeductions.toFixed(2),
      calculation.netSettlement.toFixed(2),
      this.settlementForm.get('reason_for_leaving')?.value,
      this.settlementForm.get('authorized_by')?.value,
      calculation.calculation_date
    ];

    return [headers.join(','), values.join(',')].join('\n');
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  resetForms(): void {
    this.employeeForm.reset();
    this.settlementForm.reset();
    this.selectedEmployee = null;
    this.settlementCalculations = [];
    this.showResults = false;
    
    // Reset to current date
    this.employeeForm.patchValue({
      calculation_date: new Date().toISOString().split('T')[0]
    });
    
    // Reset authorization date
    this.settlementForm.patchValue({
      authorization_date: new Date().toISOString().split('T')[0]
    });
  }

  getCurrencyFormat(amount: number): string {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Form field change handlers
  onNoticePeriodChange(): void {
    this.calculateNoticePeriodPay();
  }

  onPendingLeaveChange(): void {
    this.calculateLeaveEncashment();
  }
} 