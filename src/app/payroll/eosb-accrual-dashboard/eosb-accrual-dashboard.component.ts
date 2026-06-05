import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Api } from '../../core/services/api';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-eosb-accrual-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './eosb-accrual-dashboard.component.html',
  styleUrls: ['./eosb-accrual-dashboard.component.scss']
})
export class EosbAccrualDashboardComponent implements OnInit {

  // ── Forms ─────────────────────────────────────────────────────────────────
  filterForm!: FormGroup;

  // ── Data ─────────────────────────────────────────────────────────────────
  accrualData: any[]       = [];
  filteredEmployees: any[] = [];

  // ── UI State ─────────────────────────────────────────────────────────────
  isLoading            = false;
  isGeneratingReport   = false;
  showFilters          = true;

  // ── Pagination (from API) ─────────────────────────────────────────────────
  currentPage  = 1;
  pageSize     = 20;
  totalItems   = 0;
  totalPages   = 1;
  Math         = Math;

  // ── Filter dropdowns ──────────────────────────────────────────────────────
  departmentOptions:   any[] = [];
  designationOptions:  any[] = [];
  serviceYearOptions   = [
    { value: 'all',    label: 'All'      },
    { value: 'less1',  label: '< 1 year' },
    { value: '1to3',   label: '1–3 years'},
    { value: '3to5',   label: '3–5 years'},
    { value: '5to10',  label: '5–10 years'},
    { value: 'over10', label: '10+ years' },
  ];

  // ── Summary (from API) ───────────────────────────────────────────────────
  totalAccruedGratuity  = 0;
  averageAccruedGratuity = 0;
  totalEmployees        = 0;
  eligibleEmployees     = 0;
  showingLabel          = '';

  // ── Search debounce ──────────────────────────────────────────────────────
  private searchSubject = new Subject<string>();

  // ── Settings (display only) ──────────────────────────────────────────────
  gratuitySettings = {
    basicSalaryPercentage: 21,
    maxYears: 5,
    uaeLawCompliant: true
  };

  constructor(private fb: FormBuilder, private api: Api) {
    this.initializeForms();
  }

  getcurrency(): string { return this.api.getcurrencies() || 'AED'; }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadDesignations();
    this.loadAccrualData();

    // Debounce the search box
    this.searchSubject.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => { this.currentPage = 1; this.loadAccrualData(); });
  }

  private initializeForms(): void {
    this.filterForm = this.fb.group({
      search:          [''],
      department_id:   [''],
      designation_id:  [''],
      service_years:   ['all'],
      calculationDate: [new Date().toISOString().split('T')[0]]
    });
  }

  // ── Dropdown loaders ─────────────────────────────────────────────────────

  loadDepartments(): void {
    this.api.get('/employee/list_departments/').subscribe({
      next: (res: any) => {
        if (res.status === 200 || res.data) {
          this.departmentOptions = res.data || [];
        }
      }
    });
  }

  loadDesignations(): void {
    this.api.get('/employee/list_designations/').subscribe({
      next: (res: any) => {
        if (res.status === 200 || res.data) {
          this.designationOptions = res.data || [];
        }
      }
    });
  }

  // ── Main API call ─────────────────────────────────────────────────────────

  loadAccrualData(): void {
    this.isLoading = true;
    const f = this.filterForm.value;

    const payload: any = {
      company_id:       this.api.getCompanyId() ?? 1,
      calculation_date: f.calculationDate,
      page:             this.currentPage,
      page_size:        this.pageSize,
    };

    if (f.search?.trim())        payload['search']         = f.search.trim();
    if (f.department_id)         payload['department_id']  = +f.department_id;
    if (f.designation_id)        payload['designation_id'] = +f.designation_id;
    if (f.service_years && f.service_years !== 'all')
                                 payload['service_years']  = f.service_years;
    else                         payload['service_years']  = 'all';

    this.api.post('/attendance/gratuity-accrual-report/', payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === '200' || res.status === 200) {
          this.accrualData       = res.data || [];
          this.filteredEmployees = [...this.accrualData];

          // Summary from API
          const s = res.summary || {};
          this.totalEmployees         = s.total_employees       ?? 0;
          this.eligibleEmployees      = s.eligible_employees    ?? 0;
          this.totalAccruedGratuity   = s.total_accrued_gratuity ?? 0;
          this.averageAccruedGratuity = s.average_accrued_gratuity ?? 0;

          // Pagination from API
          const p = res.pagination || {};
          this.currentPage = p.page       ?? 1;
          this.pageSize    = p.page_size  ?? 20;
          this.totalItems  = p.total_count ?? this.accrualData.length;
          this.totalPages  = p.total_pages ?? 1;

          this.showingLabel = res.showing ?? '';
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  // ── Filter events ─────────────────────────────────────────────────────────

  onSearchInput(): void {
    this.searchSubject.next(this.filterForm.get('search')?.value ?? '');
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadAccrualData();
  }

  clearFilters(): void {
    this.filterForm.patchValue({
      search:         '',
      department_id:  '',
      designation_id: '',
      service_years:  'all',
      calculationDate: new Date().toISOString().split('T')[0]
    });
    this.currentPage = 1;
    this.loadAccrualData();
  }

  // ── Pagination ─────────────────────────────────────────────────────────────

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadAccrualData();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadAccrualData();
  }

  // ── Kept intact ────────────────────────────────────────────────────────────

  generateAccrualReport(): void {
    this.isGeneratingReport = true;
    const reportData = {
      company_id:               this.api.getCompanyId(),
      calculation_date:         this.filterForm.get('calculationDate')?.value,
      filters:                  this.filterForm.value,
      total_employees:          this.totalEmployees,
      eligible_employees:       this.eligibleEmployees,
      total_accrued_gratuity:   this.totalAccruedGratuity,
      average_accrued_gratuity: this.averageAccruedGratuity,
      employee_data:            this.filteredEmployees
    };
    this.api.post('/payroll/generate-accrual-report/', reportData).subscribe({
      next: (res: any) => {
        if (res.status === 200) { alert('Accrual report generated successfully!'); this.downloadAccrualReport(); }
        else { alert('Error generating accrual report.'); }
      },
      error: () => { alert('Error generating accrual report. Please try again.'); },
      complete: () => { this.isGeneratingReport = false; }
    });
  }

  downloadAccrualReport(): void {
    const csvContent = this.generateCSV();
    this.downloadCSV(csvContent, `eosb_accrual_report_${new Date().toISOString().split('T')[0]}.csv`);
  }

  private generateCSV(): string {
    const curr = this.getcurrency();
    const headers = [
      'Employee ID','Employee Name','Department','Designation','Joining Date',
      `Basic Salary (${curr})`,`Gross Salary (${curr})`,'Service Years',
      `Monthly Accrual (${curr})`,`Yearly Accrual (${curr})`,`Total Accrued (${curr})`,
      'Eligible for EOSB','Status','Calculation Date'
    ];
    const rows = this.filteredEmployees.map((e: any) => [
      e.employee_id, e.employee_name, e.department || 'N/A', e.designation || 'N/A',
      e.joining_date, e.basic_salary, e.gross_salary,
      (e.service_years ?? 0).toFixed(2),
      (e.monthly_accrual ?? 0).toFixed(2),
      (e.yearly_accrual ?? 0).toFixed(2),
      (e.accrued_gratuity ?? e.total_accrued ?? 0).toFixed(2),
      e.eligible ? 'Yes' : 'No',
      e.status ?? '',
      this.filterForm.get('calculationDate')?.value
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  private downloadCSV(content: string, filename: string): void {
    const blob  = new Blob([content], { type: 'text/csv' });
    const url   = window.URL.createObjectURL(blob);
    const link  = document.createElement('a');
    link.href     = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  refreshData(): void { this.currentPage = 1; this.loadAccrualData(); }
  toggleFilters(): void { this.showFilters = !this.showFilters; }

  getCurrencyFormat(amount: number): string {
    const code = this.getcurrency();
    return new Intl.NumberFormat(undefined, {
      style: 'currency', currency: code,
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(amount || 0);
  }

  getServiceYearClass(serviceYears: number): string {
    if (serviceYears < 1)  return 'text-danger';
    if (serviceYears < 3)  return 'text-warning';
    if (serviceYears < 5)  return 'text-info';
    if (serviceYears < 10) return 'text-primary';
    return 'text-success';
  }

  getEligibilityBadge(eligible: boolean): string {
    return eligible ? 'completed' : 'rejected';
  }
}
