import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { CompanyService } from '../../core/services/company.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header implements OnInit {
  isLoggingOut = false;
  activeCompanyName = 'Company';

  constructor(
    private auth: Auth,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.updateActiveCompanyName();
    this.companyService.selectedCompany$.subscribe(() => {
      this.updateActiveCompanyName();
    });
  }

  get isAuthenticated$() {
    return this.auth.isAuthenticated$;
  }

  private updateActiveCompanyName(): void {
    this.activeCompanyName = this.companyService.getActiveCompanyName();
  }

  onLogout(): void {
    this.isLoggingOut = true;
    this.auth.logout().subscribe({
      next: () => {
        this.isLoggingOut = false;
      },
      error: () => {
        this.isLoggingOut = false;
      }
    });
  }
}
