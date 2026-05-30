import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './chart-of-accounts.html',
  styleUrls: ['./chart-of-accounts.scss']
})
export class ChartOfAccounts implements OnInit {
  accounts: Account[] = [];
  filteredAccounts: Account[] = [];
  categories: string[] = [];
  selectedCategory: string = 'All';
  searchTerm: string = '';
  selectedAccount: Account | null = null;
  editingAccountCode: string | null = null;
  editDraft: Account | null = null;

  ngOnInit() {
    this.generateAccounts();
    this.filterAccounts();
  }

  generateAccounts() {
    // Mock data for development/demo
    this.accounts = [
      // Assets
      { code: '1000', name: 'Cash on Hand', category: 'Current Assets', type: 'Asset', balance: 55000, is_active: true },
      { code: '1010', name: 'Petty Cash', category: 'Current Assets', type: 'Asset', balance: 1200, is_active: true },
      { code: '1100', name: 'Main Bank Account', category: 'Current Assets', type: 'Asset', balance: 125000, is_active: true },
      { code: '1110', name: 'Savings Bank Account', category: 'Current Assets', type: 'Asset', balance: 40000, is_active: true },
      { code: '1200', name: 'Accounts Receivable', category: 'Current Assets', type: 'Asset', balance: 45000, is_active: true },
      { code: '1300', name: 'Inventory', category: 'Current Assets', type: 'Asset', balance: 75000, is_active: true },
      { code: '1400', name: 'Prepaid Expenses', category: 'Current Assets', type: 'Asset', balance: 5000, is_active: true },
      { code: '1450', name: 'Input VAT Receivable', category: 'Current Assets', type: 'Asset', balance: 9200, is_active: true },
      { code: '1500', name: 'Equipment', category: 'Fixed Assets', type: 'Asset', balance: 250000, is_active: true },
      { code: '1600', name: 'Accumulated Depreciation', category: 'Fixed Assets', type: 'Asset', balance: -50000, is_active: true },
      { code: '1700', name: 'Vehicles', category: 'Fixed Assets', type: 'Asset', balance: 90000, is_active: false },
      
      // Liabilities
      { code: '2000', name: 'Accounts Payable', category: 'Current Liabilities', type: 'Liability', balance: 40000, is_active: true },
      { code: '2100', name: 'Accrued Expenses', category: 'Current Liabilities', type: 'Liability', balance: 8000, is_active: true },
      { code: '2150', name: 'VAT Payable', category: 'Current Liabilities', type: 'Liability', balance: 14500, is_active: true },
      { code: '2200', name: 'Bank Loan', category: 'Long-term Liabilities', type: 'Liability', balance: 100000, is_active: true },
      { code: '2300', name: 'Employee Benefits Payable', category: 'Long-term Liabilities', type: 'Liability', balance: 18000, is_active: true },
      
      // Equity
      { code: '3000', name: 'Owner\'s Capital', category: 'Equity', type: 'Equity', balance: 200000, is_active: true },
      { code: '3100', name: 'Retained Earnings', category: 'Equity', type: 'Equity', balance: 44000, is_active: true },
      { code: '3200', name: 'Current Year Earnings', category: 'Equity', type: 'Equity', balance: 26000, is_active: true },
      
      // Revenue
      { code: '4000', name: 'Sales Revenue', category: 'Revenue', type: 'Revenue', balance: -175000, is_active: true },
      { code: '4100', name: 'Service Revenue', category: 'Revenue', type: 'Revenue', balance: -25000, is_active: true },
      { code: '4200', name: 'Other Income', category: 'Revenue', type: 'Revenue', balance: -3500, is_active: true },
      
      // Expenses
      { code: '5000', name: 'Cost of Goods Sold', category: 'Cost of Sales', type: 'Expense', balance: 80000, is_active: true },
      { code: '6000', name: 'Salaries and Wages', category: 'Operating Expenses', type: 'Expense', balance: 35000, is_active: true },
      { code: '6100', name: 'Rent Expense', category: 'Operating Expenses', type: 'Expense', balance: 12000, is_active: true },
      { code: '6200', name: 'Utilities', category: 'Operating Expenses', type: 'Expense', balance: 3000, is_active: true },
      { code: '6300', name: 'Office Supplies', category: 'Operating Expenses', type: 'Expense', balance: 1500, is_active: true },
      { code: '6400', name: 'Insurance Expense', category: 'Operating Expenses', type: 'Expense', balance: 2200, is_active: true },
      { code: '6500', name: 'Bank Charges', category: 'Operating Expenses', type: 'Expense', balance: 600, is_active: false }
    ];

    this.categories = ['All', ...new Set(this.accounts.map(acc => acc.category))];
  }

  filterAccounts() {
    this.filteredAccounts = this.accounts.filter(account => {
      const matchesCategory = this.selectedCategory === 'All' || account.category === this.selectedCategory;
      const matchesSearch = !this.searchTerm || 
        account.code.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        account.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  onCategoryChange() {
    this.filterAccounts();
  }

  onSearchChange() {
    this.filterAccounts();
  }

  getAccountTypeClass(type: string): string {
    switch (type) {
      case 'Asset': return 'text-primary';
      case 'Liability': return 'text-danger';
      case 'Equity': return 'text-success';
      case 'Revenue': return 'text-info';
      case 'Expense': return 'text-warning';
      default: return 'text-muted';
    }
  }

  getActiveAccountsCount(): number {
    return this.filteredAccounts.filter(acc => acc.is_active).length;
  }

  getTotalAssets(): number {
    return this.filteredAccounts.filter(acc => acc.type === 'Asset').reduce((sum, acc) => sum + acc.balance, 0);
  }

  getTotalLiabilities(): number {
    return this.filteredAccounts.filter(acc => acc.type === 'Liability').reduce((sum, acc) => sum + acc.balance, 0);
  }

  getTotalEquity(): number {
    return this.filteredAccounts.filter(acc => acc.type === 'Equity').reduce((sum, acc) => sum + acc.balance, 0);
  }

  onViewAccount(account: Account): void {
    this.selectedAccount = account;
  }

  onEditAccount(account: Account): void {
    this.editingAccountCode = account.code;
    this.editDraft = { ...account };
  }

  onCancelEdit(): void {
    this.editingAccountCode = null;
    this.editDraft = null;
  }

  onSaveEdit(): void {
    if (!this.editDraft) {
      return;
    }

    const accountIndex = this.accounts.findIndex(acc => acc.code === this.editingAccountCode);
    if (accountIndex === -1) {
      this.onCancelEdit();
      return;
    }

    this.accounts[accountIndex] = { ...this.editDraft };
    this.selectedAccount = this.accounts[accountIndex];
    this.onCancelEdit();
    this.filterAccounts();
  }
} 