import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';

export interface TrialBalanceEntry {
  account_code: string;
  account_name: string;
  debit: number | null;
  credit: number | null;
}

export interface BalanceSheetData {
  assets: {
    current: ReportRow[];
    non_current: ReportRow[];
    total_current: number;
    total_non_current: number;
    total: number;
  };
  liabilities_and_equity: {
    liabilities: ReportRow[];
    equity: ReportRow[];
    total_liabilities: number;
    total_equity: number;
    total: number;
  };
}

export interface ProfitLossData {
  revenue: ReportRow[];
  cost_of_sales: ReportRow[];
  operating_expenses: ReportRow[];
  total_revenue: number;
  total_cost_of_sales: number;
  gross_profit: number;
  total_operating_expenses: number;
  net_income: number;
}

export interface ReportRow {
  account: string;
  amount: number;
}

export interface LedgerEntry {
  date: string;
  account: string;
  transaction_type: string;
  description: string;
  debit: number | null;
  credit: number | null;
  balance: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinancialReportsService {

  constructor(private api: Api) { }

  getTrialBalance(asOfDate?: string): Observable<any> {
    const params = {
      company: this.api.getCompanyId(),
      as_of_date: asOfDate || new Date().toISOString().split('T')[0]
    };
    return this.api.post('/financial-reports/trial-balance/', params);
  }

  getBalanceSheet(asOfDate?: string): Observable<any> {
    const params = {
      company: this.api.getCompanyId(),
      as_of_date: asOfDate || new Date().toISOString().split('T')[0]
    };
    return this.api.post('/financial-reports/balance-sheet/', params);
  }

  getProfitLoss(dateFrom?: string, dateTo?: string): Observable<any> {
    const params = {
      company: this.api.getCompanyId(),
      date_from: dateFrom || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      date_to: dateTo || new Date().toISOString().split('T')[0]
    };
    return this.api.post('/financial-reports/profit-loss/', params);
  }

  getGeneralLedger(dateFrom?: string, dateTo?: string, accountId?: string): Observable<any> {
    const params = {
      company: this.api.getCompanyId(),
      date_from: dateFrom || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      date_to: dateTo || new Date().toISOString().split('T')[0],
      account_id: accountId || 'all'
    };
    return this.api.post('/financial-reports/general-ledger/', params);
  }

  getAllAccounts(): Observable<any> {
    const params = {
      company: this.api.getCompanyId()
    };
    return this.api.post('/journal-voucher/list-all-ledgers/', params);
  }

  // Helper method to transform trial balance data
  transformTrialBalanceData(apiData: any[]): TrialBalanceEntry[] {
    return apiData.map(item => ({
      account_code: item.account_code || item.code,
      account_name: item.account_name || item.name,
      debit: item.debit_balance > 0 ? item.debit_balance : null,
      credit: item.credit_balance > 0 ? item.credit_balance : null
    }));
  }

  // Helper method to transform balance sheet data
  transformBalanceSheetData(apiData: any): BalanceSheetData {
    return {
      assets: {
        current: apiData.assets?.current || [],
        non_current: apiData.assets?.non_current || [],
        total_current: apiData.assets?.total_current || 0,
        total_non_current: apiData.assets?.total_non_current || 0,
        total: apiData.assets?.total || 0
      },
      liabilities_and_equity: {
        liabilities: apiData.liabilities_and_equity?.liabilities || [],
        equity: apiData.liabilities_and_equity?.equity || [],
        total_liabilities: apiData.liabilities_and_equity?.total_liabilities || 0,
        total_equity: apiData.liabilities_and_equity?.total_equity || 0,
        total: apiData.liabilities_and_equity?.total || 0
      }
    };
  }

  // Helper method to transform P&L data
  transformProfitLossData(apiData: any): ProfitLossData {
    return {
      revenue: apiData.revenue || [],
      cost_of_sales: apiData.cost_of_sales || [],
      operating_expenses: apiData.operating_expenses || [],
      total_revenue: apiData.total_revenue || 0,
      total_cost_of_sales: apiData.total_cost_of_sales || 0,
      gross_profit: apiData.gross_profit || 0,
      total_operating_expenses: apiData.total_operating_expenses || 0,
      net_income: apiData.net_income || 0
    };
  }
} 