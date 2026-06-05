import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProfitLossData, ReportRow } from '../../../core/services/financial-reports.service';
import { ToastService } from '../../../core/services/toast.service';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-profit-loss-statement',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profit-loss-statement.html',
  styleUrls: ['./profit-loss-statement.scss']
})
export class ProfitLossStatement implements OnInit {
  reportData: ProfitLossData | null = null;
  dateFrom: string = '';
  dateTo: string = '';
  isLoading: boolean = false;
  currencyCode: string = 'AED';

  constructor(
    private toast: ToastService,
    private api: Api
  ) {}

  ngOnInit() {
    this.dateFrom = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    this.dateTo = new Date().toISOString().split('T')[0];
    this.currencyCode = this.api.getcurrencies() || 'AED';
    this.generateReport();
  }

  generateReport() {
    this.isLoading = true;
    const payload = {
      company: this.api.getCompanyId() ?? 1,
      from_date: this.dateFrom,
      to_date:   this.dateTo
    };
    this.api.post('/reports/profit-and-loss/', payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 200) {
          const mapItems = (items: any[]) =>
            (items || []).map((i: any) => ({ account: i.line_name ?? i.account, amount: i.amount ?? 0 }));

          const revenue      = res.revenue      || {};
          const costOfSales  = res.cost_of_sales || {};
          const opExpenses   = res.operating_expenses || {};

          const revenueItems   = mapItems(revenue.items      || []);
          const cosItems       = mapItems(costOfSales.items  || []);
          const opExpItems     = mapItems(opExpenses.items   || []);

          const totalRevenue   = revenue.total      ?? revenueItems.reduce((s: number, i: any) => s + i.amount, 0);
          const totalCOS       = costOfSales.total  ?? cosItems.reduce((s: number, i: any) => s + i.amount, 0);
          const grossProfit    = res.gross_profit   ?? totalRevenue - totalCOS;
          const totalOpExp     = opExpenses.total   ?? opExpItems.reduce((s: number, i: any) => s + i.amount, 0);
          const netIncome      = res.net_income     ?? grossProfit - totalOpExp;

          this.reportData = {
            revenue:                  revenueItems,
            cost_of_sales:            cosItems,
            operating_expenses:       opExpItems,
            total_revenue:            totalRevenue,
            total_cost_of_sales:      totalCOS,
            gross_profit:             grossProfit,
            total_operating_expenses: totalOpExp,
            net_income:               netIncome,
          };
          this.toast.show('Success', 'Profit & Loss Statement loaded successfully', 'success');
        }
      },
      error: () => {
        this.isLoading = false;
        this.toast.show('Error', 'Failed to load Profit & Loss Statement', 'danger');
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