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
    this.loadHardcodedData();
    this.isLoading = false;
    this.toast.show('Success', 'Profit & Loss Statement loaded successfully', 'success');
  }

  private loadHardcodedData() {
    const revenue: ReportRow[] = [
      { account: 'Product Sales', amount: 150000 },
      { account: 'Service Revenue', amount: 25000 }
    ];
    const cost_of_sales: ReportRow[] = [
      { account: 'Cost of Goods Sold', amount: 80000 }
    ];
    const operating_expenses: ReportRow[] = [
      { account: 'Salaries and Wages', amount: 35000 },
      { account: 'Rent Expense', amount: 12000 },
      { account: 'Utilities', amount: 3000 }
    ];
    
    const total_revenue = revenue.reduce((sum, item) => sum + item.amount, 0);
    const total_cost_of_sales = cost_of_sales.reduce((sum, item) => sum + item.amount, 0);
    const gross_profit = total_revenue - total_cost_of_sales;
    const total_operating_expenses = operating_expenses.reduce((sum, item) => sum + item.amount, 0);
    const net_income = gross_profit - total_operating_expenses;

    this.reportData = {
      revenue,
      cost_of_sales,
      operating_expenses,
      total_revenue,
      total_cost_of_sales,
      gross_profit,
      total_operating_expenses,
      net_income
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