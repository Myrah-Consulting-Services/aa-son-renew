import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../core/services/api';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-salary-history',
  imports: [CommonModule],
  templateUrl: './salary-history.html',
  styleUrl: './salary-history.scss'
})
export class SalaryHistory implements OnInit {
  @Input() employeeId: any;
  salaryHistory: any[] = [];
  loading: boolean = false;
  error: string = '';

  constructor(
    private api: Api,
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit(): void {
    if (this.employeeId) {
      // this.getSalaryHistory(this.employeeId);
      this.listReviseSalaryStructure();
    }
  }

  getSalaryHistory(employeeId: any): void {
    this.loading = true;
    this.error = '';
    
    this.api.get('/employee/get_revise_salary_by_employee/' + employeeId + '/').subscribe(
      (response: any) => {
        this.loading = false;
        if (response.status == 200) {
          this.salaryHistory = response.data || [];
          console.log('Salary history loaded:', this.salaryHistory);
        } else {
          this.error = 'Failed to load salary history';
        }
      },
      (error) => {
        this.loading = false;
        this.error = 'Error loading salary history';
        console.error('Error loading salary history:', error);
      }
    );
  }

  formatCurrency(amount: number): string {
    return `AED ${amount?.toFixed(2) || '0.00'}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  closeModal(): void {
    this.activeModal.close();
  }

  viewRevisionDetails(revision: any): void {
    console.log('Viewing revision details:', revision);
    // TODO: Implement detailed view modal or navigation
    // This could open another modal with detailed breakdown
  }

  downloadRevisionCertificate(revision: any): void {
    console.log('Downloading revision certificate:', revision);
    // TODO: Implement certificate download for specific revision
    // This could generate a certificate for the specific revision
  }
  // list_revise_salary_structure/
  listReviseSalaryStructure(): void {   
    this.api.get('/employee/list_revise_salary_structure/').subscribe((response: any) => {
      if (response.status == 200) {
        this.salaryHistory = response.data;
      }
    });
  }
}
