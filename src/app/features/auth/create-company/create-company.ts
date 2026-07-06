import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CompanyService } from '../../../core/services/company.service';
import { ToastService } from '../../../core/services/toast.service';
import { CountryList } from '../../../country-list';

interface SearchOption {
  id: number;
  label: string;
}

@Component({
  selector: 'app-create-company',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-company.html',
  styleUrl: './create-company.scss'
})
export class CreateCompany implements OnInit {
  companyForm!: FormGroup;
  isSubmitting = false;
  returnToSelect = false;

  countries: SearchOption[] = [];
  emiratesList: SearchOption[] = [
    { id: 1, label: 'Dubai' },
    { id: 2, label: 'Abu Dhabi' },
    { id: 3, label: 'Sharjah' },
    { id: 4, label: 'Ajman' },
    { id: 5, label: 'Umm Al Quwain' },
    { id: 6, label: 'Ras Al Khaimah' },
    { id: 7, label: 'Fujairah' }
  ];

  currencies: SearchOption[] = [
    { id: 1, label: 'AED - UAE Dirham' },
    { id: 2, label: 'USD - US Dollar' },
    { id: 3, label: 'INR - Indian Rupee' },
    { id: 4, label: 'EUR - Euro' },
    { id: 5, label: 'GBP - British Pound' },
    { id: 6, label: 'SAR - Saudi Riyal' }
  ];

  countrySearchText = '';
  emirateSearchText = '';
  currencySearchText = '';
  filteredCountries: SearchOption[] = [];
  filteredEmirates: SearchOption[] = [];
  filteredCurrencies: SearchOption[] = [];
  showCountryDropdown = false;
  showEmirateDropdown = false;
  showCurrencyDropdown = false;
  activeCountryIndex = -1;
  activeEmirateIndex = -1;
  activeCurrencyIndex = -1;

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private countryList: CountryList,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {
    this.countries = this.countryList.countryList.map((country) => ({
      id: country.id,
      label: country.name
    }));
  }

  ngOnInit(): void {
    this.returnToSelect = this.route.snapshot.queryParamMap.get('from') === 'select';
    this.initializeForm();
    this.filteredCountries = [...this.countries];
    this.filteredEmirates = [...this.emiratesList];
    this.filteredCurrencies = [...this.currencies];
    this.setCountryDisplay(1);
    this.setEmirateDisplay(2);
    this.setCurrencyDisplay(1);
  }

  initializeForm(): void {
    this.companyForm = this.fb.group({
      business_name: ['', Validators.required],
      business_name_arabic: [''],
      phone_no: ['', Validators.required],
      alternate_business_no: [''],
      email: ['', [Validators.required, Validators.email]],
      alternate_email: [''],
      address1: [''],
      address2: [''],
      po_box: [''],
      license_number: [''],
      license_type: [''],
      issued_by: [''],
      license_expiry: [''],
      activity: [''],
      legal_type: [''],
      country: [1, Validators.required],
      emirates: [2],
      owner_name: [''],
      owner_nationality: [''],
      owner_emirates_id: [''],
      tax_registration_number: [''],
      vat_registered: [false],
      status: [1],
      business_logo: [''],
      signature: [''],
      is_currency_conversion: [false],
      curency_conversion: [1],
      currency_conversion_rate: [3.67]
    });
  }

  get isUaeSelected(): boolean {
    return Number(this.companyForm.get('country')?.value) === 1;
  }

  onSubmit(): void {
    if (!this.companyForm.valid || this.isSubmitting) {
      this.companyForm.markAllAsTouched();
      this.toast.show('Error', 'Please fill all required fields correctly', 'danger');
      return;
    }

    const formValue = { ...this.companyForm.value };
    if (!this.isUaeSelected) {
      delete formValue.emirates;
    }

    if (!formValue.is_currency_conversion) {
      formValue.currency_conversion_rate = 0;
    }

    this.isSubmitting = true;
    this.companyService.createCompanyAndActivate(formValue).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        if (response.status === 200) {
          const message = typeof response.data === 'string'
            ? response.data
            : 'Company created successfully';
          this.toast.show('Success', message, 'success');
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        const message = error?.message || error?.error?.data || 'Failed to create company';
        this.toast.show('Error', message, 'danger');
      }
    });
  }

  onCancel(): void {
    if (this.returnToSelect) {
      this.router.navigate(['/select-company']);
      return;
    }

    this.router.navigate(['/dashboard']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.searchable-select')) {
      this.closeAllDropdowns();
    }
  }

  openCountryDropdown(): void {
    this.closeAllDropdowns();
    this.showCountryDropdown = true;
    this.filterCountries();
    this.activeCountryIndex = this.filteredCountries.findIndex(
      (item) => item.id === Number(this.companyForm.get('country')?.value)
    );
  }

  openEmirateDropdown(): void {
    if (!this.isUaeSelected) {
      return;
    }
    this.closeAllDropdowns();
    this.showEmirateDropdown = true;
    this.filterEmirates();
    this.activeEmirateIndex = this.filteredEmirates.findIndex(
      (item) => item.id === Number(this.companyForm.get('emirates')?.value)
    );
  }

  openCurrencyDropdown(): void {
    this.closeAllDropdowns();
    this.showCurrencyDropdown = true;
    this.filterCurrencies();
    this.activeCurrencyIndex = this.filteredCurrencies.findIndex(
      (item) => item.id === Number(this.companyForm.get('curency_conversion')?.value)
    );
  }

  filterCountries(): void {
    const search = this.countrySearchText.trim().toLowerCase();
    this.filteredCountries = search
      ? this.countries.filter((item) => item.label.toLowerCase().includes(search))
      : [...this.countries];
    this.activeCountryIndex = this.filteredCountries.length ? 0 : -1;
  }

  onCountrySearchInput(event: Event): void {
    this.countrySearchText = (event.target as HTMLInputElement).value;
    this.filterCountries();
  }

  filterEmirates(): void {
    const search = this.emirateSearchText.trim().toLowerCase();
    this.filteredEmirates = search
      ? this.emiratesList.filter((item) => item.label.toLowerCase().includes(search))
      : [...this.emiratesList];
    this.activeEmirateIndex = this.filteredEmirates.length ? 0 : -1;
  }

  onEmirateSearchInput(event: Event): void {
    this.emirateSearchText = (event.target as HTMLInputElement).value;
    this.filterEmirates();
  }

  filterCurrencies(): void {
    const search = this.currencySearchText.trim().toLowerCase();
    this.filteredCurrencies = search
      ? this.currencies.filter((item) => item.label.toLowerCase().includes(search))
      : [...this.currencies];
    this.activeCurrencyIndex = this.filteredCurrencies.length ? 0 : -1;
  }

  onCurrencySearchInput(event: Event): void {
    this.currencySearchText = (event.target as HTMLInputElement).value;
    this.filterCurrencies();
  }

  selectCountry(option: SearchOption): void {
    this.companyForm.patchValue({ country: option.id });
    this.setCountryDisplay(option.id);
    this.showCountryDropdown = false;
    this.countrySearchText = '';
  }

  selectEmirate(option: SearchOption): void {
    this.companyForm.patchValue({ emirates: option.id });
    this.setEmirateDisplay(option.id);
    this.showEmirateDropdown = false;
    this.emirateSearchText = '';
  }

  selectCurrency(option: SearchOption): void {
    this.companyForm.patchValue({ curency_conversion: option.id });
    this.setCurrencyDisplay(option.id);
    this.showCurrencyDropdown = false;
    this.currencySearchText = '';
  }

  clearCountry(): void {
    this.companyForm.patchValue({ country: null });
    this.countrySearchText = '';
    this.showCountryDropdown = false;
  }

  clearEmirate(): void {
    this.companyForm.patchValue({ emirates: null });
    this.emirateSearchText = '';
    this.showEmirateDropdown = false;
  }

  clearCurrency(): void {
    this.companyForm.patchValue({ curency_conversion: null });
    this.currencySearchText = '';
    this.showCurrencyDropdown = false;
  }

  onCountryKeydown(event: KeyboardEvent): void {
    this.handleDropdownKeydown(event, 'country');
  }

  onEmirateKeydown(event: KeyboardEvent): void {
    this.handleDropdownKeydown(event, 'emirate');
  }

  onCurrencyKeydown(event: KeyboardEvent): void {
    this.handleDropdownKeydown(event, 'currency');
  }

  private handleDropdownKeydown(event: KeyboardEvent, type: 'country' | 'emirate' | 'currency'): void {
    const options = type === 'country'
      ? this.filteredCountries
      : type === 'emirate'
        ? this.filteredEmirates
        : this.filteredCurrencies;

    let activeIndex = type === 'country'
      ? this.activeCountryIndex
      : type === 'emirate'
        ? this.activeEmirateIndex
        : this.activeCurrencyIndex;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isDropdownOpen(type)) {
        this.openDropdown(type);
        return;
      }
      activeIndex = Math.min(activeIndex + 1, options.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
    } else if (event.key === 'Enter' && this.isDropdownOpen(type) && activeIndex >= 0) {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) {
        if (type === 'country') {
          this.selectCountry(option);
        } else if (type === 'emirate') {
          this.selectEmirate(option);
        } else {
          this.selectCurrency(option);
        }
      }
      return;
    } else if (event.key === 'Escape') {
      this.closeAllDropdowns();
      return;
    } else {
      return;
    }

    if (type === 'country') {
      this.activeCountryIndex = activeIndex;
    } else if (type === 'emirate') {
      this.activeEmirateIndex = activeIndex;
    } else {
      this.activeCurrencyIndex = activeIndex;
    }
  }

  private isDropdownOpen(type: 'country' | 'emirate' | 'currency'): boolean {
    if (type === 'country') {
      return this.showCountryDropdown;
    }
    if (type === 'emirate') {
      return this.showEmirateDropdown;
    }
    return this.showCurrencyDropdown;
  }

  private openDropdown(type: 'country' | 'emirate' | 'currency'): void {
    if (type === 'country') {
      this.openCountryDropdown();
    } else if (type === 'emirate') {
      this.openEmirateDropdown();
    } else {
      this.openCurrencyDropdown();
    }
  }

  private closeAllDropdowns(): void {
    this.showCountryDropdown = false;
    this.showEmirateDropdown = false;
    this.showCurrencyDropdown = false;
  }

  private setCountryDisplay(id: number): void {
    const country = this.countries.find((item) => item.id === id);
    this.countrySearchText = country?.label ?? '';
  }

  private setEmirateDisplay(id: number): void {
    const emirate = this.emiratesList.find((item) => item.id === id);
    this.emirateSearchText = emirate?.label ?? '';
  }

  private setCurrencyDisplay(id: number): void {
    const currency = this.currencies.find((item) => item.id === id);
    this.currencySearchText = currency?.label ?? '';
  }
}
