import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-offboarding',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  templateUrl: './offboarding.html',
  styleUrls: ['./offboarding.scss']
})
export class OffboardingComponent implements OnInit {
  
  // Offboarding data
  offboardingEmployees: any[] = [];
  selectedEmployee: any = null;
  isProcessing: boolean = false;
  
  // Search and filter
  searchTerm: string = '';
  filterStatus: string = '';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  Math=Math
  // Offboarding statuses
  offboardingStatuses = [
    { value: 'pending', label: 'Pending', class: 'bg-warning' },
    { value: 'in_progress', label: 'In Progress', class: 'bg-info' },
    { value: 'completed', label: 'Completed', class: 'bg-success' },
    { value: 'cancelled', label: 'Cancelled', class: 'bg-danger' }
  ];

  constructor(
    private http: HttpClient,
    private api: Api,
    private toast: ToastService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadOffboardingEmployees();
  }

  // Download sample file
  downloadSampleFile(): void {
    console.log('Downloading sample offboarding file...');
    
    const url = 'assets/Excel/Offboarding_Sample.xlsx';
    this.http.get(url, { responseType: 'blob' })
      .subscribe({
        next: (data: any) => {
          const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = 'Offboarding_Sample.xlsx';
          link.click();
          window.URL.revokeObjectURL(downloadUrl);
          
          this.toast.show('Sample file downloaded successfully', 'success');
        },
        error: (error) => {
          console.error('Error downloading sample file:', error);
          this.toast.show('Error downloading sample file', 'error');
        }
      });
  }

  // Load offboarding employees
  loadOffboardingEmployees(): void {
    this.isProcessing = true;
    
    this.api.get('/employee/offboarding-list/', {
      page: this.currentPage,
      page_size: this.pageSize,
      search: this.searchTerm,
      status: this.filterStatus
    }).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.offboardingEmployees = response.data.results || [];
          this.totalItems = response.data.count || 0;
        }
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error loading offboarding employees:', error);
        this.loadSampleData();
        this.isProcessing = false;
      }
    });
  }

  // Load sample data for demonstration
  loadSampleData(): void {
    this.offboardingEmployees = [
      {
        id: 1,
        employee_id: 'EMP001',
        name: 'Rajesh Kumar',
        department: 'IT Development',
        position: 'Senior Developer',
        offboarding_date: '2024-01-15',
        status: 'pending',
        reason: 'Career growth opportunity',
        exit_interview_date: '2024-01-10',
        clearance_status: 'pending',
        handover_status: 'in_progress'
      },
      {
        id: 2,
        employee_id: 'EMP002',
        name: 'Priya Sharma',
        department: 'Human Resources',
        position: 'HR Manager',
        offboarding_date: '2024-01-20',
        status: 'in_progress',
        reason: 'Personal reasons',
        exit_interview_date: '2024-01-15',
        clearance_status: 'completed',
        handover_status: 'completed'
      },
      {
        id: 3,
        employee_id: 'EMP003',
        name: 'Amit Patel',
        department: 'Finance',
        position: 'Accountant',
        offboarding_date: '2024-01-25',
        status: 'completed',
        reason: 'Better opportunity',
        exit_interview_date: '2024-01-20',
        clearance_status: 'completed',
        handover_status: 'completed'
      }
    ];
    this.totalItems = this.offboardingEmployees.length;
  }

  // Search employees
  searchEmployees(): void {
    this.currentPage = 1;
    this.loadOffboardingEmployees();
  }

  // Filter by status
  filterByStatus(status: string): void {
    this.filterStatus = status;
    this.currentPage = 1;
    this.loadOffboardingEmployees();
  }

  // Clear filters
  clearFilters(): void {
    this.searchTerm = '';
    this.filterStatus = '';
    this.currentPage = 1;
    this.loadOffboardingEmployees();
  }

  // Page change
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadOffboardingEmployees();
  }

  // Get status class
  getStatusClass(status: string): string {
    const statusObj = this.offboardingStatuses.find(s => s.value === status);
    return statusObj ? statusObj.class : 'bg-secondary';
  }

  // Get status label
  getStatusLabel(status: string): string {
    const statusObj = this.offboardingStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : 'Unknown';
  }

  // Start offboarding process
  startOffboarding(employee: any): void {
    if (confirm(`Are you sure you want to start the offboarding process for ${employee.name}?`)) {
      this.api.post('/employee/start-offboarding/', {
        employee_id: employee.employee_id,
        offboarding_date: employee.offboarding_date,
        reason: employee.reason
      }).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toast.show('Offboarding process started successfully', 'success');
            this.loadOffboardingEmployees();
          }
        },
        error: (error) => {
          console.error('Error starting offboarding:', error);
          this.toast.show('Error starting offboarding process', 'error');
        }
      });
    }
  }

  // Complete offboarding
  completeOffboarding(employee: any): void {
    if (confirm(`Are you sure you want to complete the offboarding process for ${employee.name}?`)) {
      this.api.post('/employee/complete-offboarding/', {
        employee_id: employee.employee_id
      }).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toast.show('Offboarding process completed successfully', 'success');
            this.loadOffboardingEmployees();
          }
        },
        error: (error) => {
          console.error('Error completing offboarding:', error);
          this.toast.show('Error completing offboarding process', 'error');
        }
      });
    }
  }

  // Cancel offboarding
  cancelOffboarding(employee: any): void {
    if (confirm(`Are you sure you want to cancel the offboarding process for ${employee.name}?`)) {
      this.api.post('/employee/cancel-offboarding/', {
        employee_id: employee.employee_id
      }).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toast.show('Offboarding process cancelled successfully', 'success');
            this.loadOffboardingEmployees();
          }
        },
        error: (error) => {
          console.error('Error cancelling offboarding:', error);
          this.toast.show('Error cancelling offboarding process', 'error');
        }
      });
    }
  }

  // View employee details
  viewEmployeeDetails(employee: any): void {
    this.selectedEmployee = employee;
    // Open modal or navigate to details page
    console.log('Viewing employee details:', employee);
  }

  // Export offboarding data
  exportOffboardingData(): void {
    this.api.get('/employee/export-offboarding/', {
      search: this.searchTerm,
      status: this.filterStatus
    }).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          const blob = new Blob([response.data], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'offboarding_data.csv';
          link.click();
          window.URL.revokeObjectURL(url);
          
          this.toast.show('Offboarding data exported successfully', 'success');
        }
      },
      error: (error) => {
        console.error('Error exporting offboarding data:', error);
        this.toast.show('Error exporting offboarding data', 'error');
      }
    });
  }

  // Get total pages
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  // Get pagination range
  get paginationRange(): number[] {
    const range = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    
    return range;
  }

  // Computed properties for statistics
  get pendingCount(): number {
    return this.offboardingEmployees?.filter(e => e.status === 'pending').length || 0;
  }

  get inProgressCount(): number {
    return this.offboardingEmployees?.filter(e => e.status === 'in_progress').length || 0;
  }

  get completedCount(): number {
    return this.offboardingEmployees?.filter(e => e.status === 'completed').length || 0;
  }
} 