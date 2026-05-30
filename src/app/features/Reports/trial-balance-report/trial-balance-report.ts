import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TrialBalanceEntry } from '../../../core/services/financial-reports.service';
import { ToastService } from '../../../core/services/toast.service';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-trial-balance-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './trial-balance-report.html',
  styleUrls: ['./trial-balance-report.scss']
})
export class TrialBalanceReport implements OnInit {
  reportData: TrialBalanceEntry[] = [];
  reportDate: string = '';
  totals: { debit: number, credit: number } = { debit: 0, credit: 0 };
  isLoading: boolean = false;
  currencyCode: string = 'AED';

  constructor(
    private toast: ToastService,
    private api: Api
  ) {}

  ngOnInit() {
    this.reportDate = new Date().toISOString().split('T')[0];
    this.currencyCode = this.api.getcurrencies() || 'AED';
    this.generateReport();
  }

  generateReport() {
    this.isLoading = true;
    this.loadHardcodedData();
    this.isLoading = false;
    this.toast.show('Success', 'Trial Balance loaded successfully', 'success');
  }

  private loadHardcodedData() {
    this.reportData = [
      { account_code: '1010', account_name: 'Cash', debit: 50000, credit: null },
      { account_code: '1200', account_name: 'Accounts Receivable', debit: 75000, credit: null },
      { account_code: '2100', account_name: 'Accounts Payable', debit: null, credit: 40000 },
      { account_code: '3000', account_name: 'Owner\'s Capital', debit: null, credit: 160000 },
      { account_code: '4000', account_name: 'Sales Revenue', debit: null, credit: 175000 },
      { account_code: '5000', account_name: 'Cost of Goods Sold', debit: 80000, credit: null },
      { account_code: '6000', account_name: 'Rent Expense', debit: 70000, credit: null }
    ];
    this.calculateTotals();
  }
  
  calculateTotals() {
    const totalDebit = this.reportData.reduce((sum, item) => sum + (item.debit || 0), 0);
    const totalCredit = this.reportData.reduce((sum, item) => sum + (item.credit || 0), 0);
    this.totals = { debit: totalDebit, credit: totalCredit };
  }

  onDateChange() {
    this.generateReport();
  }

  exportReport() {
    // TODO: Implement export functionality
    this.toast.show('Info', 'Export functionality coming soon', 'info');
  }
} 