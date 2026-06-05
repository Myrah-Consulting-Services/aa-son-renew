import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Api } from '../../../core/services/api';

interface Account {
  code: string;
  name: string;
  category: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  balance: number;
  is_active: boolean;
  description?: string;
}

@Component({
  selector: 'app-chart-of-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chart-of-accounts.html',
  styleUrls: ['./chart-of-accounts.scss']
})
export class ChartOfAccounts implements OnInit {
  accounts: Account[] = [];
  filteredAccounts: Account[] = [];
  categories: string[] = ['All'];
  selectedCategory: string = 'All';
  searchTerm: string = '';
  selectedAccount: Account | null = null;
  editingAccountCode: string | null = null;
  editDraft: Account | null = null;

  isLoading = false;

  // KPI from API
  kpis: any = { total_accounts: 0, active_accounts: 0, categories: 0 };
  balanceSummary: any = { total_assets: 0, total_liabilities: 0, total_equity: 0,
                          total_assets_formatted: '0.00', total_liabilities_formatted: '0.00', total_equity_formatted: '0.00' };

  // Pagination
  currentPage  = 1;
  pageSize     = 10;
  totalCount   = 0;

  constructor(private api: Api) {}

  ngOnInit() {
    this.loadAccounts();
  }

  loadAccounts() {
    this.isLoading = true;
    const payload: any = {
      company:     this.api.getCompanyId() ?? 1,
      page_number: this.currentPage,
      page_size:   this.pageSize,
    };
    if (this.searchTerm.trim())                        payload['search']   = this.searchTerm.trim();
    if (this.selectedCategory && this.selectedCategory !== 'All') payload['category'] = this.selectedCategory;

    this.api.post('/ledger/chart-of-accounts/', payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 200) {
          // KPIs
          this.kpis          = res.kpis          || this.kpis;
          this.balanceSummary = res.balance_summary || this.balanceSummary;
          this.totalCount     = res.kpis?.total_accounts ?? 0;

          // Category options from API
          const apiCategories = res.category_options || [];
          this.categories = ['All', ...apiCategories];

          // Map data → existing Account interface
          this.accounts = (res.data || []).map((item: any) => ({
            code:        item.account_code  ?? item.code ?? '',
            name:        item.account_name  ?? item.name ?? '',
            category:    item.category      ?? '',
            type:        item.account_type  ?? item.type ?? 'Asset',
            balance:     item.balance       ?? 0,
            is_active:   item.is_active     ?? true,
            description: item.description   ?? '',
          }));
          this.filteredAccounts = [...this.accounts];
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  // Keep existing filter functions working
  generateAccounts() { this.loadAccounts(); }

  filterAccounts() {
    this.currentPage = 1;
    this.loadAccounts();
  }

  onCategoryChange() { this.filterAccounts(); }
  onSearchChange()   { this.filterAccounts(); }

  getAccountTypeClass(type: string): string {
    switch (type) {
      case 'Asset':     return 'text-primary';
      case 'Liability': return 'text-danger';
      case 'Equity':    return 'text-success';
      case 'Revenue':   return 'text-info';
      case 'Expense':   return 'text-warning';
      default:          return 'text-muted';
    }
  }

  getActiveAccountsCount(): number {
    return this.kpis.active_accounts ?? this.filteredAccounts.filter(a => a.is_active).length;
  }

  getTotalAssets(): number      { return this.balanceSummary.total_assets      ?? 0; }
  getTotalLiabilities(): number { return this.balanceSummary.total_liabilities ?? 0; }
  getTotalEquity(): number      { return this.balanceSummary.total_equity      ?? 0; }

  onViewAccount(account: Account): void { this.selectedAccount = account; }

  onEditAccount(account: Account): void {
    this.editingAccountCode = account.code;
    this.editDraft = { ...account };
  }

  onCancelEdit(): void {
    this.editingAccountCode = null;
    this.editDraft = null;
  }

  onSaveEdit(): void {
    if (!this.editDraft) return;
    const idx = this.accounts.findIndex(a => a.code === this.editingAccountCode);
    if (idx !== -1) {
      this.accounts[idx]  = { ...this.editDraft };
      this.selectedAccount = this.accounts[idx];
    }
    this.onCancelEdit();
    this.filteredAccounts = [...this.accounts];
  }
} 