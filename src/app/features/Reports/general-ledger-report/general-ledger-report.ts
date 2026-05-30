import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinancialReportsService, LedgerEntry } from '../../../core/services/financial-reports.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-general-ledger-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './general-ledger-report.html',
  styleUrls: ['./general-ledger-report.scss']
})
export class GeneralLedgerReport implements OnInit {
  ledgerData: LedgerEntry[] = [];
  accountList: any[] = [];
  selectedAccount: string = 'all';
  dateFrom: string = '';
  dateTo: string = '';
  isLoading: boolean = false;

  constructor(
    private financialReportsService: FinancialReportsService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.dateFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    this.dateTo = new Date().toISOString().split('T')[0];
    this.loadAccounts();
    this.generateReport();
  }

  loadAccounts() {
    this.financialReportsService.getAllAccounts().subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.accountList = [
            { id: 'all', name: 'All Accounts' },
            ...(response.data || [])
          ];
        } else {
          this.toast.show('Warning', 'Failed to load accounts', 'warning');
        }
      },
      error: (error) => {
        console.error('Accounts API Error:', error);
        this.toast.show('Warning', 'Failed to load accounts', 'warning');
      }
    });
  }

  generateReport() {
    this.isLoading = true;
    const accountId = this.selectedAccount === 'all' ? undefined : this.selectedAccount;
    
    this.financialReportsService.getGeneralLedger(this.dateFrom, this.dateTo, accountId).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.ledgerData = response.data || [];
          this.toast.show('Success', 'General Ledger loaded successfully', 'success');
        } else {
          this.handleError(response.message || 'Failed to load general ledger');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('General Ledger API Error:', error);
        this.handleError('Failed to load general ledger data');
        this.loadFallbackData();
        this.isLoading = false;
      }
    });
  }

  private handleError(message: string) {
    this.toast.show('Warning', message + '. Showing sample data.', 'warning');
  }

  private loadFallbackData() {
    // Fallback to mock data if API fails
    const allEntries: LedgerEntry[] = [
      { date: '2024-06-01', account: 'Cash', transaction_type: 'Payment', description: 'Received from Customer A', debit: 5000, credit: null, balance: 5000 },
      { date: '2024-06-02', account: 'Accounts Receivable', transaction_type: 'Invoice', description: 'Sale to Customer B', debit: 7500, credit: null, balance: 7500 },
      { date: '2024-06-03', account: 'Cash', transaction_type: 'Expense', description: 'Paid for Office Supplies', debit: null, credit: 500, balance: 4500 },
      { date: '2024-06-04', account: 'Sales Revenue', transaction_type: 'Invoice', description: 'Sale to Customer B', debit: null, credit: 7500, balance: -7500 },
    ];

    if (this.selectedAccount === 'all') {
      this.ledgerData = allEntries;
    } else {
      const selectedAccountData = this.accountList.find(acc => acc.id === this.selectedAccount);
      const accountName = selectedAccountData?.name || this.selectedAccount;
      this.ledgerData = allEntries.filter(e => e.account === accountName);
    }
  }

  onFilterChange() {
    this.generateReport();
  }

  exportReport() {
    // TODO: Implement export functionality
    this.toast.show('Info', 'Export functionality coming soon', 'info');
  }
} 