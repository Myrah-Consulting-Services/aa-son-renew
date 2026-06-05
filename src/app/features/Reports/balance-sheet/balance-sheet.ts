import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BalanceSheetData, ReportRow } from '../../../core/services/financial-reports.service';
import { ToastService } from '../../../core/services/toast.service';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-balance-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './balance-sheet.html',
  styleUrls: ['./balance-sheet.scss']
})
export class BalanceSheet implements OnInit {
  reportData: BalanceSheetData | null = null;
  reportDate: string = '';
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
      company: this.api.getCompanyId() ?? 1,
      as_of_date: this.reportDate
    };
    this.api.post('/reports/balance-sheet/', payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 200) {
          // Map API response → existing BalanceSheetData shape used by the HTML
          const mapItems = (items: any[]) =>
            (items || []).map((i: any) => ({ account: i.line_name ?? i.account, amount: i.amount ?? 0 }));

          const assets     = res.assets     || {};
          const liabEquity = res.liabilities_and_equity || {};
          const equity     = res.equity     || {};

          const currentItems    = mapItems(assets.current_assets?.items    || []);
          const nonCurrentItems = mapItems(assets.non_current_assets?.items || []);
          const liabItems       = mapItems(liabEquity.current_liabilities?.items || liabEquity.liabilities?.items || []);
          const equityItems     = mapItems(equity.items || liabEquity.equity?.items || []);

          const totalCurrent    = assets.current_assets?.total    ?? currentItems.reduce((s: number, i: any) => s + i.amount, 0);
          const totalNonCurrent = assets.non_current_assets?.total ?? nonCurrentItems.reduce((s: number, i: any) => s + i.amount, 0);
          const totalAssets     = assets.total_assets              ?? totalCurrent + totalNonCurrent;
          const totalLiab       = liabEquity.total_liabilities     ?? liabItems.reduce((s: number, i: any) => s + i.amount, 0);
          const totalEquity     = liabEquity.total_equity ?? equity.total ?? equityItems.reduce((s: number, i: any) => s + i.amount, 0);

          this.reportData = {
            assets: {
              current:           currentItems,
              non_current:       nonCurrentItems,
              total_current:     totalCurrent,
              total_non_current: totalNonCurrent,
              total:             totalAssets,
            },
            liabilities_and_equity: {
              liabilities:       liabItems,
              equity:            equityItems,
              total_liabilities: totalLiab,
              total_equity:      totalEquity,
              total:             totalLiab + totalEquity,
            }
          };
          this.toast.show('Success', 'Balance Sheet loaded successfully', 'success');
        }
      },
      error: () => {
        this.isLoading = false;
        this.toast.show('Error', 'Failed to load Balance Sheet', 'danger');
      }
    });
  }

  onDateChange() {
    this.generateReport();
  }

  exportReport() {
    // TODO: Implement export functionality
    this.toast.show('Info', 'Export functionality coming soon', 'info');
  }
} 