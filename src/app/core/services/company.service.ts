import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, switchMap, tap } from 'rxjs';
import { Api } from './api';
import { TitleService } from './title.service';
import { ToastService } from './toast.service';

export interface UserCompany {
  id: number;
  business_name: string;
  role: string;
  is_default: boolean;
}

export interface MyCompaniesResponse {
  data: UserCompany[];
  active_company_id: number | null;
  status: number;
}

export interface SwitchCompanyResponse {
  data: string;
  companies: UserCompany[];
  active_company_id: number;
  status: number;
}

export interface CreateCompanyPayload {
  business_name: string;
  business_name_arabic?: string;
  phone_no: string;
  alternate_business_no?: string;
  email: string;
  alternate_email?: string;
  address1?: string;
  address2?: string;
  po_box?: string;
  license_number?: string;
  license_type?: string;
  issued_by?: string;
  license_expiry?: string;
  activity?: string;
  legal_type?: string;
  country: number;
  emirates?: number;
  owner_name?: string;
  owner_nationality?: string;
  owner_emirates_id?: string;
  tax_registration_number?: string;
  vat_registered?: boolean;
  status?: number;
  business_logo?: string;
  signature?: string;
  is_currency_conversion?: boolean;
  curency_conversion?: number;
  currency_conversion_rate?: number;
}

export interface CreateCompanyResponse {
  status: number;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private readonly ACTIVE_COMPANY_KEY = 'active_company_id';
  private readonly COMPANIES_CACHE_KEY = 'my_companies';

  private selectedCompanySubject = new BehaviorSubject<number | null>(this.getStoredCompanyId());
  selectedCompany$ = this.selectedCompanySubject.asObservable();

  constructor(
    private api: Api,
    private router: Router,
    private titleService: TitleService,
    private toast: ToastService
  ) {}

  fetchMyCompanies(): Observable<MyCompaniesResponse> {
    return this.api.get<MyCompaniesResponse>('/auth/my-companies/').pipe(
      tap((response) => {
        if (response.status === 200 && response.data) {
          this.cacheCompanies(response.data);
          this.syncActiveCompanyId(response.active_company_id);
        }
      })
    );
  }

  switchCompany(companyId: number, navigateToDashboard = true): Observable<SwitchCompanyResponse> {
    return this.api.post<SwitchCompanyResponse>('/auth/switch-company/', { company_id: companyId }).pipe(
      tap((response) => {
        if (response.status === 200) {
          this.applyCompanySwitch(response);
          if (navigateToDashboard) {
            this.router.navigate(['/dashboard']);
          }
        }
      })
    );
  }

  createCompany(payload: CreateCompanyPayload): Observable<CreateCompanyResponse> {
    return this.api.post<CreateCompanyResponse>('/company/create_business_info/', payload);
  }

  createCompanyAndActivate(payload: CreateCompanyPayload): Observable<SwitchCompanyResponse | CreateCompanyResponse> {
    return this.createCompany(payload).pipe(
      switchMap((response) => {
        if (response.status !== 200) {
          throw new Error(typeof response.data === 'string' ? response.data : 'Failed to create company');
        }

        const companyId = this.extractCompanyId(response.data, payload.business_name);

        return this.fetchMyCompanies().pipe(
          switchMap(() => {
            if (companyId) {
              return this.switchCompany(companyId);
            }

            this.router.navigate(['/select-company']);
            return of(response);
          })
        );
      })
    );
  }

  handlePostLoginNavigation(): void {
    this.fetchMyCompanies().subscribe({
      next: (response) => {
        if (response.status !== 200 || !response.data?.length) {
          this.router.navigate(['/select-company']);
          return;
        }

        if (response.data.length === 1) {
          this.switchCompany(response.data[0].id).subscribe({
            error: () => {
              this.toast.show('Error', 'Failed to select company', 'danger');
            }
          });
          return;
        }

        if (response.active_company_id) {
          this.syncActiveCompanyId(response.active_company_id);
        }

        this.router.navigate(['/select-company']);
      },
      error: () => {
        this.toast.show('Error', 'Failed to load companies', 'danger');
      }
    });
  }

  getStoredCompanyId(): number | null {
    const stored = localStorage.getItem(this.ACTIVE_COMPANY_KEY);
    return stored ? Number(stored) : null;
  }

  getActiveCompany(): UserCompany | null {
    const activeId = this.getStoredCompanyId();
    if (!activeId) {
      return null;
    }

    const companies = this.getCompanies();
    return companies.find((company) => company.id === activeId) ?? null;
  }

  getActiveCompanyName(): string {
    return this.getActiveCompany()?.business_name ?? 'Company';
  }

  getCompanies(): UserCompany[] {
    const cached = localStorage.getItem(this.COMPANIES_CACHE_KEY);
    if (!cached) {
      return [];
    }

    try {
      return JSON.parse(cached) as UserCompany[];
    } catch {
      return [];
    }
  }

  hasActiveCompany(): boolean {
    return this.getStoredCompanyId() !== null;
  }

  clearCompanyData(): void {
    localStorage.removeItem(this.ACTIVE_COMPANY_KEY);
    localStorage.removeItem(this.COMPANIES_CACHE_KEY);
    this.selectedCompanySubject.next(null);
  }

  private cacheCompanies(companies: UserCompany[]): void {
    localStorage.setItem(this.COMPANIES_CACHE_KEY, JSON.stringify(companies));
  }

  private syncActiveCompanyId(companyId: number | null): void {
    if (!companyId) {
      return;
    }

    localStorage.setItem(this.ACTIVE_COMPANY_KEY, String(companyId));
    this.selectedCompanySubject.next(companyId);
  }

  private applyCompanySwitch(response: SwitchCompanyResponse): void {
    if (response.companies?.length) {
      this.cacheCompanies(response.companies);
    }

    this.syncActiveCompanyId(response.active_company_id);
    localStorage.removeItem('inv_code');
    localStorage.removeItem('selected_currency');
    this.titleService.refreshTitle();
  }

  private extractCompanyId(data: any, businessName: string): number | null {
    if (typeof data === 'number') {
      return data;
    }

    if (data?.id) {
      return data.id;
    }

    if (data?.company_id) {
      return data.company_id;
    }

    const matchedCompany = this.getCompanies().find((company) => company.business_name === businessName);
    return matchedCompany?.id ?? null;
  }
}
