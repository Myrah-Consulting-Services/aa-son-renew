import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CashFlowSection {
  title: string;
  items: { description: string; amount: number }[];
  total: number;
}

interface CashFlowData {
  operating_activities: CashFlowSection;
  investing_activities: CashFlowSection;
  financing_activities: CashFlowSection;
  net_cash_flow: number;
  opening_cash: number;
  closing_cash: number;
}

@Component({
  selector: 'app-cash-flow-statement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cash-flow-statement.html',
  styleUrls: ['./cash-flow-statement.scss']
})
export class CashFlowStatement implements OnInit {
  reportData: CashFlowData | null = null;
  dateFrom: string = '';
  dateTo: string = '';

  ngOnInit() {
    this.dateFrom = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    this.dateTo = new Date().toISOString().split('T')[0];
    this.generateReport();
  }

  generateReport() {
    // Mock data - to be replaced by API call
    const operating_activities: CashFlowSection = {
      title: 'Cash Flows from Operating Activities',
      items: [
        { description: 'Net Income', amount: 45000 },
        { description: 'Depreciation & Amortization', amount: 15000 },
        { description: 'Changes in Accounts Receivable', amount: -8000 },
        { description: 'Changes in Inventory', amount: -12000 },
        { description: 'Changes in Accounts Payable', amount: 5000 },
        { description: 'Changes in Prepaid Expenses', amount: -2000 },
        { description: 'Changes in Accrued Liabilities', amount: 3000 }
      ],
      total: 0
    };

    const investing_activities: CashFlowSection = {
      title: 'Cash Flows from Investing Activities',
      items: [
        { description: 'Purchase of Equipment', amount: -25000 },
        { description: 'Purchase of Investments', amount: -10000 },
        { description: 'Proceeds from Sale of Assets', amount: 5000 }
      ],
      total: 0
    };

    const financing_activities: CashFlowSection = {
      title: 'Cash Flows from Financing Activities',
      items: [
        { description: 'Proceeds from Bank Loan', amount: 30000 },
        { description: 'Repayment of Bank Loan', amount: -15000 },
        { description: 'Owner\'s Capital Contribution', amount: 20000 },
        { description: 'Dividends Paid', amount: -10000 }
      ],
      total: 0
    };

    // Calculate totals
    operating_activities.total = operating_activities.items.reduce((sum, item) => sum + item.amount, 0);
    investing_activities.total = investing_activities.items.reduce((sum, item) => sum + item.amount, 0);
    financing_activities.total = financing_activities.items.reduce((sum, item) => sum + item.amount, 0);

    const net_cash_flow = operating_activities.total + investing_activities.total + financing_activities.total;
    const opening_cash = 50000;
    const closing_cash = opening_cash + net_cash_flow;

    this.reportData = {
      operating_activities,
      investing_activities,
      financing_activities,
      net_cash_flow,
      opening_cash,
      closing_cash
    };
  }
} 