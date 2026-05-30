  import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Api } from '../../core/services/api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gratuity',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './gratuity.component.html',
  styleUrls: ['./gratuity.component.scss']
})
export class GratuityComponent implements OnInit {
  gratuityForm!: FormGroup;
  employeeForm!: FormGroup;
  employees: any[] = [];
  gratuityCalculations: any[] = [];
  selectedEmployee: any = null;

  isCalculating: boolean = false;
  showResults: boolean = false;
  isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  Math = Math;
  gratuitySettings = {
    basicSalaryPercentage: 21, // 21 days per year (UAE standard)
    maxYears: 5, // Maximum years for calculation
    maxAmount: 0, // No maximum amount limit in UAE
    minServiceYears: 1, // Minimum service years to qualify
    newCapEnabled: false, // UAE doesn't have 2x gross salary cap
    proratedEnabled: true, // Enable prorated calculation for final year
    uaeLawCompliant: true, // UAE Labour Law compliance flag
    endOfServiceBenefits: true // UAE EOSB terminology
  };
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
    private api: Api
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadEmployees();
    // this.loadGratuitySettings();
  }

  private initializeForms(): void {
    // Employee selection form
    this.employeeForm = this.fb.group({
      employeeId: ['', Validators.required],
      calculationDate: [new Date().toISOString().split('T')[0], Validators.required]
    });

    // Gratuity calculation form with enhanced validation
    // Gratuity calculation form with enhanced validation
    this.gratuityForm = this.fb.group({
      basic_salary: [0, [Validators.required, Validators.min(0)]],
      gross_salary: [0, [Validators.required, Validators.min(0)]],
      joining_date: ['', Validators.required],
      last_working_date: ['', [Validators.required]],
      reason_for_leaving: ['', Validators.required],
      additional_benefits: [0, [Validators.min(0)]],
      deductions: [0, [Validators.min(0)]],
      unpaid_leave_days: [0, [Validators.min(0)]],
    });
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.hasError = false;
    
    this.api.post('/employee/list_employees/',{company:this.api.getCompanyId(),
      pagination:false
       }).subscribe((response: any) => {
      if (response.status == 200) {
        this.employees = response.data;
        this.isLoading=false
      }
    });
  }

  loadSampleEmployees(): void {
    this.employees = [
      {
        employee_id: 1,
        employee_name: 'Ahmed Al Mansouri',
        basic_salary: 8000,
        gross_salary: 12000,
        joining_date: '2020-01-15',
        designation: 'Software Developer'
      },
      {
        employee_id: 2,
        employee_name: 'Fatima Al Zaabi',
        basic_salary: 10000,
        gross_salary: 15000,
        joining_date: '2019-06-01',
        designation: 'Senior Developer'
      },
      {
        employee_id: 3,
        employee_name: 'Omar Al Falasi',
        basic_salary: 12000,
        gross_salary: 18000,
        joining_date: '2018-03-10',
        designation: 'Team Lead'
      }
    ];
  }
  
  // Enhanced offboarding data fetch with error handling
  fetchOffboardingData(employeeId: number): void {
    this.api.post('/attendance/fetch-offboarding-data/', { 
      employee_id: employeeId,
      company_id: this.api.getCompanyId() 
    }).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          this.gratuityForm.patchValue({
            lastWorkingDate: response.data.last_working_date,
            reasonForLeaving: response.data.reason_for_leaving
          });
        }
      },
      error: (error) => {
        console.log('Offboarding data not available, using default values');
      }
    });
  }

  loadGratuitySettings(): void {
    // Load gratuity settings from API or use defaults
    this.api.get('/payroll/gratuity-settings/', { company_id: this.api.getCompanyId() }).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.gratuitySettings = { ...this.gratuitySettings, ...response.data };
        }
      },
      error: (error) => {
        console.log('Using default gratuity settings');
      }
    });
  }

  onEmployeeSelect(): void {
    const employeeId = this.employeeForm.get('employeeId')?.value;
    this.selectedEmployee = this.employees.find(emp => emp.id == employeeId);
    
    if (this.selectedEmployee) {
      // Reset form and patch new values
      this.gratuityForm.reset();
      this.showResults = false;
      this.gratuityCalculations = [];
      
      // Reset form and patch new values
      this.gratuityForm.reset();
      this.showResults = false;
      this.gratuityCalculations = [];
      
      this.gratuityForm.patchValue({
        basic_salary: this.selectedEmployee.basic_salary,
        gross_salary: this.selectedEmployee.gross_salary,
        joining_date: this.selectedEmployee.joining_date,
        lastWorkingDate: this.employeeForm.get('calculationDate')?.value || new Date().toISOString().split('T')[0]
      });
      
      // Fetch unpaid leave data for the employee
      this.fetchUnpaidLeaveData(employeeId);
      
      // Try to fetch offboarding data if available
      this.fetchOffboardingData(employeeId);
    }
  }

  fetchUnpaidLeaveData(employeeId: number): void {
    // Fetch unpaid leave data from leave module
    const params = {
      employee_id: employeeId,
      company_id: this.api.getCompanyId(),
      leave_type: 'unpaid', // or specific unpaid leave types
      status: 'approved'
    };

    this.api.get('/leave/unpaid-leave-data/', params).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          const unpaidDays = response.data.reduce((total: number, leave: any) => {
            return total + (leave.total_days || 0);
          }, 0);
          
          this.gratuityForm.patchValue({
            unpaidLeaveDays: unpaidDays
          });
        }
      },
      error: (error) => {
        console.log('Using default unpaid leave data or leave module not available');
        // Set default value or keep existing
      }
    });
  }

  calculateGratuity(): void {
    if (this.gratuityForm.invalid || !this.selectedEmployee) {
      this.showError('Please fill all required fields and select an employee.');
      return;
    }

    // Validate dates
    const joiningDate = new Date(this.gratuityForm.get('joining_date')?.value);
    const lastWorkingDate = new Date(this.gratuityForm.get('lastWorkingDate')?.value);
    const calculationDate = new Date(this.employeeForm.get('calculationDate')?.value);

    if (lastWorkingDate > calculationDate) {
      this.showError('Last working date cannot be after calculation date.');
      return;
    }

    if (lastWorkingDate < joiningDate) {
      this.showError('Last working date cannot be before joining date.');
      return;
    }

    this.isCalculating = true;
    this.hasError = false;
    this.hasError = false;
    
    try {
      const formValue = this.gratuityForm.value;
      const calculation = this.performGratuityCalculation(formValue);
      
      this.gratuityCalculations = [calculation];
      this.showResults = true;
    } catch (error) {
      this.showError('Error during calculation. Please check your inputs.');
      console.error('Calculation error:', error);
    } finally {
      this.isCalculating = false;
    }
  }

  private showError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
    setTimeout(() => {
      this.hasError = false;
      this.errorMessage = '';
    }, 5000);
  }

  private performGratuityCalculation(data: any): any {
    const joiningDate = new Date(data.joining_date);
    const lastWorkingDate = new Date(data.lastWorkingDate);
    
    // Calculate service years
    let serviceYears = this.calculateServiceYears(joiningDate, lastWorkingDate);
    
    // Deduct unpaid leave days from service period (UAE Labour Law requirement)
    const unpaidLeaveDays = data.unpaidLeaveDays || 0;
    const unpaidLeaveYears = unpaidLeaveDays / 365.25;
    const adjustedServiceYears = serviceYears - unpaidLeaveYears;

    
    // Check if eligible for gratuity (UAE: minimum 1 year)
    if (adjustedServiceYears < this.gratuitySettings.minServiceYears) {
      return {
        employee: this.selectedEmployee,
        eligible: false,
        reason: `Minimum ${this.gratuitySettings.minServiceYears} year service required under UAE Labour Law. Adjusted service: ${adjustedServiceYears.toFixed(2)} years (${serviceYears.toFixed(2)} years - ${unpaidLeaveYears.toFixed(2)} unpaid leave).`
      };
    }

    // Calculate gratuity amount according to UAE Labour Law
    let gratuityAmount = 0;
    let calculationDetails = [];

    // Calculate full years (excluding the final partial year)
    const fullYears = Math.floor(adjustedServiceYears);
    const finalYearFraction = adjustedServiceYears - fullYears;

    if (fullYears <= this.gratuitySettings.maxYears) {
      // First 5 years: 21 days per year (UAE standard)
      const fullYearsAmount = (data.basicSalary / 30) * this.gratuitySettings.basicSalaryPercentage * fullYears;
      
      let finalYearAmount = 0;
      if (finalYearFraction > 0 && this.gratuitySettings.proratedEnabled) {
        finalYearAmount = (data.basicSalary / 30) * this.gratuitySettings.basicSalaryPercentage * finalYearFraction;
        calculationDetails.push({
          type: 'First 5 Years (UAE Standard)',
          formula: `(Basic Salary / 30) × ${this.gratuitySettings.basicSalaryPercentage} days × ${fullYears} years`,
          amount: fullYearsAmount
        });
        calculationDetails.push({
          type: 'Final Year (Prorated)',
          formula: `(Basic Salary / 30) × ${this.gratuitySettings.basicSalaryPercentage} days × ${finalYearFraction.toFixed(2)} years`,
          amount: finalYearAmount
        });
      } else {
        calculationDetails.push({
          type: 'Standard Calculation (UAE)',
          formula: `(Basic Salary / 30) × ${this.gratuitySettings.basicSalaryPercentage} days × ${adjustedServiceYears.toFixed(2)} years`,
          amount: fullYearsAmount
        });
      }
      
      gratuityAmount = fullYearsAmount + finalYearAmount;
    } else {
      // Beyond 5 years: 21 days for first 5 years + 30 days for additional years (UAE Law)
      // Beyond 5 years: 21 days for first 5 years + 30 days for additional years (UAE Law)
      const firstFiveYears = (data.basicSalary / 30) * this.gratuitySettings.basicSalaryPercentage * this.gratuitySettings.maxYears;
      const additionalFullYears = Math.max(fullYears - this.gratuitySettings.maxYears, 0);
      const additionalYearsAmount = additionalFullYears > 0 ? 
        (data.basicSalary / 30) * 30 * additionalFullYears : 0;
      
      // Prorated calculation for final partial year
      let finalYearAmount = 0;
      if (finalYearFraction > 0 && this.gratuitySettings.proratedEnabled) {
        finalYearAmount = (data.basicSalary / 30) * 30 * finalYearFraction;
      }
      
                
      calculationDetails.push({
        type: 'First 5 Years (UAE Standard)',
        formula: `(Basic Salary / 30) × ${this.gratuitySettings.basicSalaryPercentage} days × 5 years`,
        amount: firstFiveYears
      });
      
      if (additionalYearsAmount > 0) {
        calculationDetails.push({
          type: 'Additional Years (UAE Enhanced)',
          formula: `(Basic Salary / 30) × 30 days × ${additionalFullYears} years`,
          amount: additionalYearsAmount
        });
      }
      
      if (finalYearAmount > 0) {
        calculationDetails.push({
          type: 'Final Year (Prorated)',
          formula: `(Basic Salary / 30) × 30 days × ${finalYearFraction.toFixed(2)} years`,
          amount: finalYearAmount
        });
      }
    }


    // UAE Labour Law: No maximum cap on gratuity amount
    let finalAmount = gratuityAmount;
    let uaeLawNote = false;
    

    // Add unpaid leave deduction information (UAE requirement)
    if (unpaidLeaveDays > 0) {
      calculationDetails.push({
        type: 'Unpaid Leave Deduction (UAE)',
        formula: `${unpaidLeaveDays} days deducted from service period as per UAE Labour Law`,
        amount: 0 
      });
    }

    // Add additional benefits and deductions
    const netAmount = finalAmount + data.additionalBenefits - data.deductions;
    
    if (data.additionalBenefits > 0) {
      calculationDetails.push({
        type: 'Additional Benefits',
        formula: 'Bonus, allowances, etc.',
        amount: data.additionalBenefits
      });
    }
    
    if (data.deductions > 0) {
      calculationDetails.push({
        type: 'Deductions',
        formula: 'Advances, loans, etc.',
        amount: -data.deductions
      });
    }

    return {
      employee: this.selectedEmployee,
      eligible: true,
      service_years: serviceYears,
      adjusted_service_years: adjustedServiceYears,
      unpaid_leave_days: unpaidLeaveDays,
      basic_salary: data.basic_salary,
      gross_salary: data.gross_salary,
      joiningDate: data.joining_date,
      lastWorkingDate: data.last_working_date,
      reason_for_leaving: data.reason_for_leaving,
      gratuity_amount: gratuityAmount,
      maxLimitApplied: false, // UAE doesn't have maximum limit
      uaeLawCompliant: true,
      additionalBenefits: data.additionalBenefits,
      deductions: data.deductions,
      netAmount: netAmount,
      calculationDetails: calculationDetails,
      calculationDate: new Date().toISOString()
    };
  }

 calculateServiceYears(joiningDate: Date, lastWorkingDate: Date) {
    const timeDiff = lastWorkingDate.getTime() - joiningDate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    return daysDiff / 365.25; // Account for leap years
  }

  saveGratuityCalculation(): void {
    if (this.gratuityCalculations.length === 0) {
      this.showError('No gratuity calculation to save.');
      this.showError('No gratuity calculation to save.');
      return;
    }

    const calculation = this.gratuityCalculations[0];
    const data = {
      employee_id: calculation.employee.id,
      company_id: this.api.getCompanyId(),  
      joining_date: calculation.joining_date,
      last_working_date: calculation.last_working_date,
      service_years: calculation.service_years,
      adjusted_service_years: calculation.adjusted_service_years,
      unpaid_leave_days: calculation.unpaid_leave_days,
      basic_salary: calculation.basic_salary,
      gross_salary: calculation.gross_salary,
      gratuity_amount: calculation.gratuity_amount,
      uae_law_compliant: calculation.uaeLawCompliant,
      additional_benefits: calculation.additional_benefits,
      deductions: calculation.deductions,
      net_amount: calculation.net_amount,
      reason_for_leaving: calculation.reason_for_leaving,
      calculation_date: calculation.calculationDate
    };

    this.api.post('/attendance/save-gratuity/', data).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          alert('Gratuity calculation saved successfully!');
          this.resetForms();
        } else {
          this.showError('Error saving gratuity calculation.');
          this.showError('Error saving gratuity calculation.');
        }
      },
      error: (error) => {
        console.error('Error saving gratuity:', error);
        this.showError('Error saving gratuity calculation. Please try again.');
        this.showError('Error saving gratuity calculation. Please try again.');
      }
    });
  }

  exportGratuityReport(): void {
    if (this.gratuityCalculations.length === 0) {
      this.showError('No gratuity calculation to export.');
      this.showError('No gratuity calculation to export.');
      return;
    }

    const calculation = this.gratuityCalculations[0];
    const csvContent = this.generateCSV(calculation);
    this.downloadCSV(csvContent, `gratuity_${calculation.employee.employee_name}_${new Date().toISOString().split('T')[0]}.csv`);
  }

  private generateCSV(calculation: any): string {
    const headers = [
      'Employee Name',
      'Employee ID',
      'Joining Date',
      'Last Working Date',
      'Service Years',
      'Adjusted Service Years',
      'Unpaid Leave Days',
      'Adjusted Service Years',
      'Unpaid Leave Days',
      'Basic Salary',
      'Gross Salary',
      'Gross Salary',
      'Gratuity Amount',
      'UAE Law Compliant',
      'UAE Law Compliant',
      'Additional Benefits',
      'Deductions',
      'Net Amount',
      'Reason for Leaving',
      'Calculation Date'
    ];

    const values = [
      calculation.employee.first_name + ' ' + calculation.employee.last_name,
      calculation.employee.id,
      calculation.joining_date,
      calculation.last_working_date,
      calculation.serviceYears.toFixed(2),
      calculation.adjustedServiceYears.toFixed(2),
      calculation.unpaidLeaveDays,
      calculation.basic_salary,
      calculation.gross_salary,
      calculation.gratuity_amount.toFixed(2),
      calculation.uaeLawCompliant ? 'Yes' : 'No',
      calculation.additional_benefits,
      calculation.deductions,
      calculation.net_amount.toFixed(2),
      calculation.reason_for_leaving,
      calculation.calculationDate
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
    this.gratuityForm.reset();
    this.selectedEmployee = null;
    this.gratuityCalculations = [];
    this.showResults = false;
    this.hasError = false;
    this.errorMessage = '';
    this.hasError = false;
    this.errorMessage = '';
    
    // Reset to current date
    this.employeeForm.patchValue({
      calculationDate: new Date().toISOString().split('T')[0]
    });
  }

  getFormattedDate(date: string): string {
    return new Date(date).toLocaleDateString('en-AE');
  }

  getCurrencyFormat(amount: number): string {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  }
  
  // Professional helper methods
  isFormValid(): boolean {
    return this.gratuityForm.valid && this.selectedEmployee !== null;
  }

  getFormattedServiceYears(years: number): string {
    const fullYears = Math.floor(years);
    const months = Math.round((years - fullYears) * 12);
    
    if (fullYears === 0) {
      return `${months} months`;
    } else if (months === 0) {
      return `${fullYears} years`;
    } else {
      return `${fullYears} years, ${months} months`;
    }
  }

  clearError(): void {
    this.hasError = false;
    this.errorMessage = '';
  }
} 
