import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CompanyService, UserCompany } from '../../../core/services/company.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-select-company',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './select-company.html',
  styleUrl: './select-company.scss'
})
export class SelectCompany implements OnInit {
  companies: UserCompany[] = [];
  activeCompanyId: number | null = null;
  isLoading = true;
  isSelecting = false;
  isSwitchMode = false;
  errorMessage = '';

  constructor(
    private companyService: CompanyService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.isSwitchMode = this.route.snapshot.queryParamMap.get('switch') === 'true';
    this.activeCompanyId = this.companyService.getStoredCompanyId();
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.companyService.fetchMyCompanies().subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.status !== 200 || !response.data?.length) {
          this.companies = [];
          this.errorMessage = '';
          return;
        }

        this.companies = response.data;
        this.activeCompanyId = response.active_company_id ?? this.activeCompanyId;

        if (!this.isSwitchMode && this.companies.length === 1) {
          this.onSelectCompany(this.companies[0]);
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load companies. Please try again.';
        this.toast.show('Error', this.errorMessage, 'danger');
      }
    });
  }

  onSelectCompany(company: UserCompany): void {
    if (this.isSelecting) {
      return;
    }

    this.isSelecting = true;
    this.companyService.switchCompany(company.id).subscribe({
      next: (response) => {
        if (response.status === 200) {
          this.activeCompanyId = response.active_company_id;
          this.companies = response.companies ?? this.companies;
          this.toast.show('Success', response.data || `Switched to ${company.business_name}`, 'success');
        } else {
          this.toast.show('Error', 'Failed to switch company', 'danger');
        }
        this.isSelecting = false;
      },
      error: () => {
        this.toast.show('Error', 'Failed to switch company', 'danger');
        this.isSelecting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  isActiveCompany(company: UserCompany): boolean {
    return company.id === this.activeCompanyId;
  }
}
