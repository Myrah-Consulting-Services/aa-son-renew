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
    const payload = {
      company: this.api.getCompanyId(),
      as_of_date: this.reportDate
    };
    this.api.post('/reports/trial-balance/', payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 200) {
          // Map API fields → existing TrialBalanceEntry shape
          this.reportData = (res.data || []).map((item: any) => ({
            account_code: item.account_code,
            account_name: item.account_name,
            debit:  item.debit  ?? 0,
            credit: item.credit ?? 0,
          }));
          this.calculateTotals();
          this.toast.show('Success', 'Trial Balance loaded successfully', 'success');
        }
      },
      error: () => {
        this.isLoading = false;
        this.toast.show('Error', 'Failed to load Trial Balance', 'danger');
      }
    });
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