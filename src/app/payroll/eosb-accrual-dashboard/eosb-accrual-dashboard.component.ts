import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Api } from '../../core/services/api';

@Component({
  selector: 'app-eosb-accrual-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './eosb-accrual-dashboard.component.html',
  styleUrls: ['./eosb-accrual-dashboard.component.scss']
})
export class EosbAccrualDashboardComponent implements OnInit {
  
  // Forms
  filterForm!: FormGroup;
  
  // Data
  employees: any[] = [];
  filteredEmployees: any[] = [];
  accrualData: any[] = [];
  
  // UI States
  isLoading: boolean = false;
  isGeneratingReport: boolean = false;
  showFilters: boolean = true;
  
  // Pagination
  currentPage: number = 0;
  pageSize: number = 25;
  totalItems: number = 0;
  Math=Math
  // Filter Options
  departmentOptions: any[] = [];
  designationOptions: any[] = [];
  serviceYearRanges = [
    { min: 0, max: 1, label: '0-1 years' },
    { min: 1, max: 3, label: '1-3 years' },
    { min: 3, max: 5, label: '3-5 years' },
    { min: 5, max: 10, label: '5-10 years' },
    { min: 10, max: 999, label: '10+ years' }
  ];
  
  // Statistics
  totalAccruedGratuity: number = 0;
  averageAccruedGratuity: number = 0;
  totalEmployees: number = 0;
  eligibleEmployees: number = 0;
  
  // Settings
  gratuitySettings = {
    basicSalaryPercentage: 21, // 21 days per year (UAE standard)
    maxYears: 5, // Maximum years for calculation
    uaeLawCompliant: true
  };

  constructor(
    private fb: FormBuilder,
    private api: Api
  ) {
    this.initializeForms();
  }

  getcurrency() {
    return this.api.getcurrencies();
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  private initializeForms(): void {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      department: [''],
      designation: [''],
      serviceYearRange: [''],
      minBasicSalary: [''],
      maxBasicSalary: [''],
      calculationDate: [new Date().toISOString().split('T')[0]]
    });
  }

  loadEmployees(): void {
    this.isLoading = true;
    // Load active employees from API
    this.api.post('/attendance/gratuity-accrual-report/', { 
      company_id: this.api.getCompanyId(),
      calculation_date: this.filterForm.get('calculationDate')?.value
    }).subscribe({
      next: (response: any) => {
        if (response.status == 200) {
          this.employees = response.data;
          this.calculateAccrualForAllEmployees();
        }
      },
      error: (error) => {
        console.error('Error loading employees:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }


  calculateAccrualForAllEmployees(): void {
    const calculationDate = new Date(this.filterForm.get('calculationDate')?.value);
    
    this.accrualData = this.employees.map(employee => {
      const joiningDate = new Date(employee.joining_date);
      const serviceYears = this.calculateServiceYears(joiningDate, calculationDate);
      const accruedGratuity = this.calculateAccruedGratuity(employee.basic_salary, serviceYears);
      
      return {
        ...employee,
        serviceYears: serviceYears,
        accruedGratuity: accruedGratuity,
        eligible: serviceYears >= 1,
        monthlyAccrual: this.calculateMonthlyAccrual(employee.basic_salary),
        yearlyAccrual: this.calculateYearlyAccrual(employee.basic_salary)
      };
    });
    
    this.updateStatistics();
    this.applyFilters();
  }

  private calculateServiceYears(joiningDate: Date, calculationDate: Date): number {
    const timeDiff = calculationDate.getTime() - joiningDate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    return daysDiff / 365.25;
  }

  private calculateAccruedGratuity(basicSalary: number, serviceYears: number): number {
    if (serviceYears < 1) {
      return 0;
    }

    let gratuityAmount = 0;
    const fullYears = Math.floor(serviceYears);
    const finalYearFraction = serviceYears - fullYears;

    if (fullYears <= this.gratuitySettings.maxYears) {
      // First 5 years: 21 days per year
      const fullYearsAmount = (basicSalary / 30) * this.gratuitySettings.basicSalaryPercentage * fullYears;
      const finalYearAmount = (basicSalary / 30) * this.gratuitySettings.basicSalaryPercentage * finalYearFraction;
      gratuityAmount = fullYearsAmount + finalYearAmount;
    } else {
      // Beyond 5 years: 21 days for first 5 + 30 days for additional
      const firstFiveYears = (basicSalary / 30) * this.gratuitySettings.basicSalaryPercentage * this.gratuitySettings.maxYears;
      const additionalYears = Math.max(fullYears - this.gratuitySettings.maxYears, 0);
      const additionalAmount = (basicSalary / 30) * 30 * additionalYears;
      const finalYearAmount = (basicSalary / 30) * 30 * finalYearFraction;
      gratuityAmount = firstFiveYears + additionalAmount + finalYearAmount;
    }
    return gratuityAmount;
  }

  private calculateMonthlyAccrual(basicSalary: number): number {
    return (basicSalary / 30) * this.gratuitySettings.basicSalaryPercentage;
  }

  private calculateYearlyAccrual(basicSalary: number): number {
    return (basicSalary / 30) * this.gratuitySettings.basicSalaryPercentage * 12;
  }

  updateStatistics(): void {
    this.totalEmployees = this.accrualData.length;
    this.eligibleEmployees = this.accrualData.filter(emp => emp.eligible).length;
    this.totalAccruedGratuity = this.accrualData.reduce((total, emp) => total + emp.accruedGratuity, 0);
    this.averageAccruedGratuity = this.eligibleEmployees > 0 ? this.totalAccruedGratuity / this.eligibleEmployees : 0;
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredEmployees = this.accrualData.filter(employee => {
      // Search term filter
      if (filters.searchTerm && !employee.employee_name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      
      // Department filter
      if (filters.department && employee.department !== filters.department) {
        return false;
      }
      
      // Designation filter
      if (filters.designation && employee.designation !== filters.designation) {
        return false;
      }
      
      // Service year range filter
      if (filters.serviceYearRange) {
        const range = this.serviceYearRanges.find(r => r.label === filters.serviceYearRange);
        if (range && (employee.serviceYears < range.min || employee.serviceYears >= range.max)) {
          return false;
        }
      }
      
      // Basic salary range filter
      if (filters.minBasicSalary && employee.basic_salary < filters.minBasicSalary) {
        return false;
      }
      if (filters.maxBasicSalary && employee.basic_salary > filters.maxBasicSalary) {
        return false;
      }
      
      return true;
    });
    
    this.totalItems = this.filteredEmployees.length;
    this.currentPage = 0;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filterForm.patchValue({
      calculationDate: new Date().toISOString().split('T')[0]
    });
    this.applyFilters();
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  getPaginatedEmployees(): any[] {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredEmployees.slice(startIndex, endIndex);
  }

  generateAccrualReport(): void {
    this.isGeneratingReport = true;
    
    const reportData = {
      company_id: this.api.getCompanyId(),
      calculation_date: this.filterForm.get('calculationDate')?.value,
      filters: this.filterForm.value,
      total_employees: this.totalEmployees,
      eligible_employees: this.eligibleEmployees,
      total_accrued_gratuity: this.totalAccruedGratuity,
      average_accrued_gratuity: this.averageAccruedGratuity,
      employee_data: this.filteredEmployees
    };

    this.api.post('/payroll/generate-accrual-report/', reportData).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          alert('Accrual report generated successfully!');
          this.downloadAccrualReport();
        } else {
          alert('Error generating accrual report.');
        }
      },
      error: (error) => {
        console.error('Error generating report:', error);
        alert('Error generating accrual report. Please try again.');
      },
      complete: () => {
        this.isGeneratingReport = false;
      }
    });
  }

  downloadAccrualReport(): void {
    const csvContent = this.generateCSV();
    this.downloadCSV(csvContent, `eosb_accrual_report_${new Date().toISOString().split('T')[0]}.csv`);
  }

  private generateCSV(): string {
    const headers = [
      'Employee ID',
      'Employee Name',
      'Department',
      'Designation',
      'Joining Date',
      `Basic Salary (${this.getcurrency()})`,
      `Gross Salary (${this.getcurrency()})`,
      'Service Years',
      `Monthly Accrual (${this.getcurrency()})`,
      `Yearly Accrual (${this.getcurrency()})`,
      `Total Accrued Gratuity (${this.getcurrency()})`,
      'Eligible for EOSB',
      'Calculation Date'
    ];

    const rows = this.filteredEmployees.map(employee => [
      employee.employee_id,
      employee.employee_name,
      employee.department || 'N/A',
      employee.designation || 'N/A',
      employee.joining_date,
      employee.basic_salary,
      employee.gross_salary,
      employee.serviceYears.toFixed(2),
      employee.monthlyAccrual.toFixed(2),
      employee.yearlyAccrual.toFixed(2),
      employee.accruedGratuity.toFixed(2),
      employee.eligible ? 'Yes' : 'No',
      this.filterForm.get('calculationDate')?.value
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
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

  refreshData(): void {
    this.calculateAccrualForAllEmployees();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  getCurrencyFormat(amount: number): string {
    const code = this.getcurrency() || 'AED';
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  getServiceYearClass(serviceYears: number): string {
    if (serviceYears < 1) return 'text-danger';
    if (serviceYears < 3) return 'text-warning';
    if (serviceYears < 5) return 'text-info';
    if (serviceYears < 10) return 'text-primary';
    return 'text-success';
  }

  getEligibilityBadge(eligible: boolean): string {
    return eligible ? 'badge-success' : 'badge-danger';
  }
} 