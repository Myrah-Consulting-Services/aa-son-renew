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
    this.loadHardcodedData();
    this.isLoading = false;
    this.toast.show('Success', 'Balance Sheet loaded successfully', 'success');
  }

  private loadHardcodedData() {
    const current_assets: ReportRow[] = [
      { account: 'Cash and Cash Equivalents', amount: 55000 },
      { account: 'Accounts Receivable', amount: 45000 },
      { account: 'Inventory', amount: 75000 }
    ];
    const non_current_assets: ReportRow[] = [
      { account: 'Property, Plant, and Equipment', amount: 250000 }
    ];
    const liabilities: ReportRow[] = [
      { account: 'Accounts Payable', amount: 40000 }
    ];
    const equity: ReportRow[] = [
      { account: 'Owner\'s Capital', amount: 341000 },
      { account: 'Retained Earnings', amount: 44000 }
    ];
    
    const total_current_assets = current_assets.reduce((sum, item) => sum + item.amount, 0);
    const total_non_current_assets = non_current_assets.reduce((sum, item) => sum + item.amount, 0);
    const total_assets = total_current_assets + total_non_current_assets;
    
    const total_liabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
    const total_equity = equity.reduce((sum, item) => sum + item.amount, 0);
    const total_liabilities_and_equity = total_liabilities + total_equity;

    this.reportData = {
      assets: {
        current: current_assets,
        non_current: non_current_assets,
        total_current: total_current_assets,
        total_non_current: total_non_current_assets,
        total: total_assets
      },
      liabilities_and_equity: {
        liabilities,
        equity,
        total_liabilities,
        total_equity,
        total: total_liabilities_and_equity
      }
    };
  }

  onDateChange() {
    this.generateReport();
  }

  exportReport() {
    // TODO: Implement export functionality
    this.toast.show('Info', 'Export functionality coming soon', 'info');
  }
} 